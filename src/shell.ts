import { absolute, homeDir, host, items, label, resolve, rowKey, user, type Item, type Text } from './fs';

// A word is unquoted text and quoted parts side by side. A quote nobody closes runs to the end of the line.
const words = /(?:[^\s"']+|"[^"]*"?|'[^']*'?)+/g;
const parts = /[^"']+|"([^"]*)"?|'([^']*)'?/g;
const variable = /\$([A-Za-z_]\w*)/g;

export const parse = (input: string, env: Record<string, string> = {}) =>
  [...input.matchAll(words)].flatMap(([word]) => {
    const expanded = [...word.matchAll(parts)]
      .map(([part, double, single]) => single ?? (double ?? part).replace(variable, (_, name) => env[name] ?? ''))
      .join('');
    // Like zsh, an unquoted word that expands to nothing is no word at all
    return expanded || /["']/.test(word) ? [expanded] : [];
  });

export const line = (text: string, className = 'output') => {
  const p = document.createElement('p');
  p.className = className;
  p.textContent = text;
  return p;
};

// What the shell needs from the window around it
export interface Terminal {
  cwd: string;
  // The page's own path, like /prosjekter
  page: string;
  // Every ls -l row, and the hero ./hei.sh prints
  rows: DocumentFragment;
  heroCopy: DocumentFragment;
  history: () => string[];
  changeDirectory: (path: string) => void;
  shakeSoft: () => void;
  shakeHard: () => void;
}

const help = [
  './hei.sh        si hei',
  'ls [-la] [sti]  vis hva som ligger i en mappe',
  'cat <fil>       skriv ut en fil',
  'head <fil>      skriv ut starten av en fil',
  'cd [sti]        gå til en mappe',
  'open <sti>      åpne en lenke',
  'pwd             vis hvor du er',
  'history         vis tidligere kommandoer',
  'man <kommando>  vis hjelp for en kommando',
  'clear           tøm skjermen',
  'exit            avslutt',
];

const systems: [string, RegExp][] = [
  ['iOS', /iPhone|iPad|iPod/],
  ['Android', /Android/],
  ['ChromeOS', /CrOS/],
  ['Windows', /Windows/],
  ['macOS', /Macintosh/],
  ['Linux', /Linux/],
];

// Edge and Opera also say Chrome, and Chrome also says Safari, so they go first
const browsers: [string, RegExp][] = [
  ['Edge', /Edg(?:A|iOS)?\/(\d+)/],
  ['Opera', /OPR\/(\d+)/],
  ['Firefox', /(?:Firefox|FxiOS)\/(\d+)/],
  ['Chrome', /(?:Chrome|CriOS)\/(\d+)/],
  ['Safari', /Version\/(\d+).*Safari/],
];

const browser = (ua: string) => {
  for (const [name, pattern] of browsers) {
    const version = pattern.exec(ua)?.[1];
    if (version) return `${name} ${version}`;
  }
};

const tokens = ['bg', 'surface', 'chrome', 'line', 'muted', 'fg', 'pink', 'lavender', 'mint', 'peach'];

const train = String.raw`
      (  ) (@@) ( )
    ()
  __||____     ______________     ______________
 |   __   |   |  []  []  []  |   |  []  []  []  |
 |  |__|  |___|              |___|              |
 |________|   |______________|   |______________|
   (o)(o)       (o)      (o)       (o)      (o)
`.slice(1);

export const createShell = (terminal: Terminal) => {
  let cwd = terminal.cwd;

  const env = () => ({ USER: user, HOME: homeDir, PWD: absolute(cwd), SHELL: '/bin/zsh' });

  const row = (path: string) => terminal.rows.querySelector(`[data-path="${CSS.escape(path)}"]`)!.cloneNode(true);
  const list = (paths: string[]) => {
    const ul = document.createElement('ul');
    ul.append(...paths.map(row));
    return ul;
  };

  const text = ({ title, body }: Text) => [...(title ? [line(`# ${title}`, 'title')] : []), line(body, 'text')];

  // ls without -l prints just the names, each linked where the long listing links it
  const names = (entries: { item: Item; self: boolean }[]) => {
    const p = line('', 'output names');
    for (const { item, self } of entries) {
      const name = document.createElement(item.href ? 'a' : 'span');
      name.textContent = label(item, self);
      if (item.href) (name as HTMLAnchorElement).href = item.href;
      p.append(name);
    }
    return p;
  };

  const find = (arg: string) => {
    const path = resolve(cwd, arg);
    const item = path && items.get(path);
    return item ? { path: path!, item } : undefined;
  };

  // The error messages follow GNU ls and cat and zsh's cd, translated the way nb_NO translates them
  const missing = 'Ingen slik fil eller filkatalog';

  const ls = (args: string[]) => {
    const options = args.filter((arg) => arg.startsWith('-') && arg !== '-');
    const unknown = options.find((option) => option.startsWith('--') && option !== '--all');
    if (unknown) return [line(`ls: ukjent valg '${unknown}'`)];
    const flags = options.map((option) => (option === '--all' ? 'a' : option.slice(1))).join('');
    const invalid = [...flags].find((flag) => !'la'.includes(flag));
    if (invalid) return [line(`ls: ugyldig valg -- '${invalid}'`)];
    const paths = args.filter((arg) => !options.includes(arg));
    const targets = paths.length ? paths : ['.'];
    return targets.flatMap((arg): Element[] => {
      const found = find(arg);
      if (!found) return [line(`ls: får ikke tilgang til '${arg}': ${missing}`)];
      const { path, item } = found;
      const entries =
        item.kind === 'dir'
          ? [
              ...(flags.includes('a') ? [{ path: rowKey(path, true), item, self: true }] : []),
              ...item.children!.map((child) => ({ path: `${path}/${child.name}`, item: child, self: false })),
            ]
          : [{ path, item, self: false }];
      const output = flags.includes('l') ? list(entries.map((entry) => entry.path)) : names(entries);
      return targets.length > 1 ? [line(`${arg}:`), output] : [output];
    });
  };

  // head prints the same as cat, since every file is shorter than head's ten lines. Without a file, real cat
  // waits for input, so here it prints nothing.
  const cat = (command: string) => (args: string[]) => {
    return args.flatMap((arg): Element[] => {
      const found = find(arg);
      if (!found) return [line(`${command}: ${arg}: ${missing}`)];
      const { path, item } = found;
      if (item.kind === 'dir') return [line(`${command}: ${arg}: Er en filkatalog`)];
      // Links and the mail address have no text, so they print the row to click instead
      return item.text ? text(item.text) : [list([path])];
    });
  };

  const cd = ([arg = '~']: string[]) => {
    const found = find(arg);
    if (!found) return [line(`cd: ingen slik fil eller filkatalog: ${arg}`)];
    const { path, item } = found;
    if (item.kind === 'link') {
      location.assign(item.href!);
      return [];
    }
    if (item.kind !== 'dir') return [line(`cd: ikke en filkatalog: ${arg}`)];
    // A directory with a page opens it. One without, like kontakt, changes directory on this page.
    if (item.href && item.href !== terminal.page) {
      location.assign(item.href);
      return [];
    }
    cwd = path;
    terminal.changeDirectory(path);
    return [];
  };

  const open = ([arg]: string[]) => {
    if (!arg) return [line('open: mangler operand')];
    const href = find(arg)?.item.href;
    if (!href) return [line(`open: kan ikke åpne ${arg}`)];
    // Like cd, opening the page you're on keeps it instead of reloading it
    if (href !== terminal.page) location.assign(href);
    return [];
  };

  const programs: Record<string, () => Element[]> = {
    '~/hei.sh': () => [terminal.heroCopy.firstElementChild!.cloneNode(true) as Element],
  };
  const runProgram = (path: string) => (Object.hasOwn(programs, path) ? programs[path]() : []);

  const exec = (arg: string) => {
    const found = find(arg);
    if (!found) return [line(`zsh: ingen slik fil eller filkatalog: ${arg}`)];
    const { path, item } = found;
    if (item.kind === 'dir') return [line(`zsh: er en filkatalog: ${arg}`)];
    if (!item.executable) return [line(`zsh: tilgang nektet: ${arg}`)];
    return runProgram(path);
  };

  const firstCommand = ({ title, body }: Text) => {
    const lines = [...(title ? [`# ${title}`] : []), ...body.split('\n')].map((text) => text.trim());
    const at = lines.findIndex((text) => text && !text.startsWith('#'));
    return at === -1 ? undefined : { lineNumber: at + 1, word: lines[at].split(/\s+/)[0] };
  };

  const sh = (command: string) => (args: string[]) => {
    const [arg] = args;
    if (!arg) return [];
    const found = find(arg);
    if (!found) return [line(`${command}: ${arg}: ${missing}`)];
    const { path, item } = found;
    if (item.kind === 'dir') return [line(`${command}: ${arg}: Er en filkatalog`)];
    if (item.executable) return runProgram(path);
    const first = item.text && firstCommand(item.text);
    return first ? [line(`${arg}: linje ${first.lineNumber}: ${first.word}: kommando ikke funnet`)] : [];
  };

  const man = ([name]: string[]) => {
    if (!name) return [line('Hvilken manualside vil du ha?')];
    const entry = help.find((usage) => usage.split(' ')[0] === name);
    return [line(entry ?? `Ingen manualoppføring for ${name}`, 'output pre')];
  };

  const rm = (args: string[]) => {
    const options = args.filter((arg) => arg.startsWith('-') && arg !== '-');
    const short = options.filter((option) => !option.startsWith('--')).join('');
    const recursive = /[rR]/.test(short) || options.includes('--recursive');
    const force = short.includes('f') || options.includes('--force');
    const paths = args.filter((arg) => !options.includes(arg));
    if (!paths.length) return [line('rm: mangler operand')];
    if (recursive && force) terminal.shakeHard();
    return paths.map((path) => line(`rm: kan ikke fjerne '${path}': Skrivebeskyttet filsystem`));
  };

  const fastfetch = () => {
    const ua = navigator.userAgent;
    const rows = [
      ['OS', systems.find(([, pattern]) => pattern.test(ua))?.[0]],
      ['Nettleser', browser(ua)],
      ['Skall', 'zsh'],
      ['Oppetid', `${Math.floor(performance.now() / 60_000)} min`],
      ['Skjerm', screen.width ? `${screen.width}×${screen.height} @${+devicePixelRatio.toFixed(2)}x` : undefined],
      ['Språk', navigator.language],
      ['Tidssone', Intl.DateTimeFormat().resolvedOptions().timeZone],
      ['Tema', matchMedia('(prefers-color-scheme: dark)').matches ? 'mørk' : 'lys'],
    ].filter((row): row is [string, string] => !!row[1]);

    const info = line('', 'output pre');
    const heading = document.createElement('span');
    heading.className = 'fetch-host';
    heading.textContent = host;
    const dashes = document.createElement('span');
    dashes.setAttribute('aria-hidden', 'true');
    dashes.textContent = `\n${'-'.repeat(host.length)}`;
    info.append(heading, dashes);
    for (const [key, value] of rows) {
      const name = document.createElement('span');
      name.className = 'fetch-key';
      name.textContent = key;
      info.append('\n', name, `: ${value}`);
    }

    const swatches = document.createElement('div');
    swatches.className = 'swatches';
    swatches.setAttribute('aria-hidden', 'true');
    for (const token of tokens) {
      const swatch = document.createElement('span');
      swatch.style.background = `var(--${token})`;
      swatches.append(swatch);
    }

    // A logo would go in a column before the info
    const layout = document.createElement('div');
    layout.className = 'fetch';
    const column = document.createElement('div');
    column.append(info, swatches);
    layout.append(column);
    return [layout];
  };

  const sl = () => {
    const box = document.createElement('div');
    box.className = 'sl';
    const picture = document.createElement('pre');
    picture.setAttribute('aria-hidden', 'true');
    picture.textContent = train;
    picture.addEventListener('animationend', () => picture.remove());
    box.append(line('Et tog kjører forbi.', 'visually-hidden'), picture);
    return [box];
  };

  // Like zsh, the first exit warns about running jobs and an exit right after it goes through
  let warnedAboutJobs = false;

  const exit = () => {
    if (warnedAboutJobs) {
      warnedAboutJobs = false;
      terminal.shakeHard();
      return [line('Godt forsøk.')];
    }
    warnedAboutJobs = true;
    terminal.shakeSoft();
    return [line('zsh: du har jobber som kjører.')];
  };

  const sudo = () => {
    terminal.shakeSoft();
    return [line(`${user} er ikke i sudoers-filen. Denne hendelsen vil bli rapportert.`)];
  };

  const editor = () => [line('Du kommer ikke ut igjen.')];
  const printHelp = () => [line(help.join('\n'), 'output pre')];
  const dateFormat = new Intl.DateTimeFormat('nb-NO', { dateStyle: 'full', timeStyle: 'long' });

  const commands: Record<string, (args: string[]) => Element[]> = {
    ls,
    cat: cat('cat'),
    head: cat('head'),
    cd,
    open,
    pwd: () => [line(absolute(cwd))],
    sh: sh('sh'),
    bash: sh('bash'),
    history: () => [
      line(
        terminal
          .history()
          .map((command, i) => `${String(i + 1).padStart(5)}  ${command}`)
          .join('\n'),
        'output pre',
      ),
    ],
    help: printHelp,
    hjelp: printHelp,
    man,
    exit,
    whoami: () => [line(user)],
    date: () => [line(dateFormat.format(new Date()))],
    echo: (args) => [line(args.join(' '), 'output pre')],
    sudo,
    rm,
    fastfetch,
    neofetch: fastfetch,
    sl,
    vim: editor,
    nvim: editor,
    nano: editor,
  };

  return {
    parse: (command: string) => parse(command, env()),
    run: (name: string | undefined, args: string[]) => {
      // An empty line keeps the warning, so exit, Enter, exit still goes through
      if (name && name !== 'exit') warnedAboutJobs = false;
      if (!name) return [];
      if (name.includes('/')) return exec(name);
      return Object.hasOwn(commands, name) ? commands[name](args) : [line(`zsh: kommando ikke funnet: ${name}`)];
    },
  };
};
