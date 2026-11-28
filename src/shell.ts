import moriaDoor from './moria-door.txt?raw';
import { absolute, homeDir, host, items, label, resolve, rowKey, user, type Item, type Text } from './fs';
import { rememberSnow, showSnow } from './snow';
import { countdown, isWinter, winterHost } from './winter';

const words = /(?:[^\s"']+|"[^"]*"?|'[^']*'?)+/g;
const parts = /[^"']+|"([^"]*)"?|'([^']*)'?/g;
const variable = /\$([A-Za-z_]\w*)/g;

export const parse = (input: string, env: Record<string, string> = {}) =>
  [...input.matchAll(words)].flatMap(([word]) => {
    const expanded = [...word.matchAll(parts)]
      .map(([part, double, single]) => single ?? (double ?? part).replace(variable, (_, name) => env[name] ?? ''))
      .join('');
    const quoted = /["']/.test(word);
    return expanded || quoted ? [expanded] : [];
  });

// hidden leaves out paths the visitor can't see yet, like the inside of a locked directory
export function complete(cwd: string, commands: string[], before: string, hidden = (_path: string) => false) {
  const word = /\S*$/.exec(before)![0];
  const start = before.slice(0, before.length - word.length);
  const none = { completed: before, options: [] as string[] };
  const needsParse = /["'$]/.test(word);
  if (needsParse) return none;

  const first = !start.trim();
  let candidates: { text: string; option: string; end: string }[];
  if (first && !word.includes('/')) {
    if (!word) return none;
    candidates = commands
      .filter((name) => name.startsWith(word))
      .map((name) => ({ text: name, option: name, end: ' ' }));
  } else {
    if (word === '~') return { completed: `${start}~/`, options: [] };
    const dirPart = word.slice(0, word.lastIndexOf('/') + 1);
    const prefix = word.slice(dirPart.length);
    const path = resolve(cwd, dirPart || '.');
    const dir = path ? items.get(path) : undefined;
    const onlyDirs = start.trim() === 'cd';
    candidates = (dir?.children ?? [])
      .filter(
        (child) =>
          child.name.startsWith(prefix) && (!onlyDirs || child.kind !== 'file') && !hidden(`${path}/${child.name}`),
      )
      .map((child) => ({
        text: dirPart + child.name,
        option: label(child),
        end: child.kind === 'dir' ? '/' : ' ',
      }));
  }

  if (candidates.length === 1) return { completed: start + candidates[0].text + candidates[0].end, options: [] };
  if (!candidates.length) return none;
  let shared = candidates[0].text;
  for (const { text } of candidates) while (!text.startsWith(shared)) shared = shared.slice(0, -1);
  if (shared.length > word.length) return { completed: start + shared, options: [] };
  return { completed: before, options: candidates.map(({ option }) => option) };
}

export const line = (text: string, className = 'output') => {
  const p = document.createElement('p');
  p.className = className;
  p.textContent = text;
  return p;
};

export interface Terminal {
  cwd: string;
  pagePath: string;
  lsRows: DocumentFragment;
  heroCopy: DocumentFragment;
  history: () => string[];
  changeDirectory: (path: string) => void;
  shakeSoft: () => void;
  shakeHard: () => void;
}

const baseHelp = [
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

const winterHelp = [
  'juletre         tegn et juletre',
  'snø [på|av]     la det snø, eller slå snøen bak vinduet av og på',
];

const tabHint = 'Tab fullfører kommandoer og stier.';

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
  const winter = isWinter(new Date());
  const help = winter ? [...baseHelp, ...winterHelp] : baseHelp;
  const helpCommands = help.map((usage) => usage.split(' ')[0]).filter((name) => /^\p{Ll}+$/u.test(name));

  const env = () => ({ USER: user, HOME: homeDir, PWD: absolute(cwd), SHELL: '/bin/zsh' });

  const row = (path: string) => {
    const copy = terminal.lsRows.querySelector(`[data-path="${CSS.escape(path)}"]`)!.cloneNode(true) as Element;
    // Entry.astro draws ~/moria as locked, so its rows show the real permissions once the door is open
    if (doorOpen && (path === door || path === rowKey(door, true)))
      copy.querySelector('.perm')!.textContent = 'drwxr-xr-x';
    return copy;
  };
  const list = (paths: string[]) => {
    const ul = document.createElement('ul');
    ul.append(...paths.map(row));
    return ul;
  };

  const text = ({ title, body }: Text) => [...(title ? [line(`# ${title}`, 'title')] : []), line(body, 'text')];

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

  // ~/moria stays shut until the visitor says the password, "mellon"
  const door = '~/moria';
  let doorOpen = false;
  const sealed = (path: string) => !doorOpen && (path === door || path.startsWith(`${door}/`));
  const denied = 'Tilgang nektet';

  // Inside, the visitor can throw the stone down the well with mv, and then it's gone
  const stone = `${door}/stein`;
  const well = `${door}/brønnen`;
  const bridge = `${door}/broen`;
  let stoneThrown = false;
  const hidden = (path: string) => (stoneThrown && path === stone) || (sealed(path) && path !== door);
  // Checked before find, so a sealed path gives the same answer whether or not it exists
  const shut = (arg: string) => {
    const path = resolve(cwd, arg);
    return !!path && sealed(path);
  };

  const find = (arg: string) => {
    const path = resolve(cwd, arg);
    const item = path && !(stoneThrown && path === stone) && items.get(path);
    return item ? { path: path!, item } : undefined;
  };

  const missing = 'Ingen slik fil eller filkatalog';

  const mellon = () => {
    if (doorOpen) return [line('Døren står allerede åpen.')];
    doorOpen = true;
    return [line('Døren glir stille opp.')];
  };

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
      if (shut(arg))
        return [
          line(
            resolve(cwd, arg) === door
              ? `ls: kan ikke åpne filkatalogen '${arg}': ${denied}`
              : `ls: får ikke tilgang til '${arg}': ${denied}`,
          ),
        ];
      const found = find(arg);
      if (!found) return [line(`ls: får ikke tilgang til '${arg}': ${missing}`)];
      const { path, item } = found;
      const entries =
        item.kind === 'dir'
          ? [
              ...(flags.includes('a') ? [{ path: rowKey(path, true), item, self: true }] : []),
              ...item
                .children!.map((child) => ({ path: `${path}/${child.name}`, item: child, self: false }))
                .filter((entry) => !hidden(entry.path)),
            ]
          : [{ path, item, self: false }];
      const output = flags.includes('l') ? list(entries.map((entry) => entry.path)) : names(entries);
      return targets.length > 1 ? [line(`${arg}:`), output] : [output];
    });
  };

  const printFiles = (command: string) => (args: string[]) => {
    return args.flatMap((arg): Element[] => {
      if (shut(arg)) return [line(`${command}: ${arg}: ${denied}`)];
      const found = find(arg);
      if (!found) return [line(`${command}: ${arg}: ${missing}`)];
      const { path, item } = found;
      if (item.kind === 'dir') return [line(`${command}: ${arg}: Er en filkatalog`)];
      return item.text ? text(item.text) : [list([path])];
    });
  };

  const cd = ([arg = '~']: string[]) => {
    if (shut(arg)) {
      const picture = document.createElement('pre');
      picture.className = 'door';
      picture.setAttribute('aria-hidden', 'true');
      picture.textContent = moriaDoor;
      return [
        line(`cd: tilgang nektet: ${arg}`),
        line('En dør av stein med en innskrift over buen.', 'visually-hidden'),
        picture,
        line('Tal, venn, og tred inn.', 'text'),
      ];
    }
    const found = find(arg);
    if (!found) return [line(`cd: ingen slik fil eller filkatalog: ${arg}`)];
    const { path, item } = found;
    if (item.kind === 'link') {
      location.assign(item.href!);
      return [];
    }
    if (item.kind !== 'dir') return [line(`cd: ikke en filkatalog: ${arg}`)];
    if (path === bridge) {
      terminal.shakeHard();
      return [line('Du kommer ikke forbi!')];
    }
    if (item.href && item.href !== terminal.pagePath) {
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
    if (href !== terminal.pagePath) location.assign(href);
    return [];
  };

  const programs: Record<string, () => Element[]> = {
    '~/hei.sh': () => [terminal.heroCopy.firstElementChild!.cloneNode(true) as Element],
  };
  const runProgram = (path: string) => (Object.hasOwn(programs, path) ? programs[path]() : []);

  const exec = (arg: string) => {
    if (shut(arg)) return [line(`zsh: tilgang nektet: ${arg}`)];
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
    if (shut(arg)) return [line(`${command}: ${arg}: ${denied}`)];
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

  const throwStone = () => {
    stoneThrown = true;
    const drums = line('');
    setTimeout(() => (drums.textContent = 'Trommer, trommer i dypet...'), 3000);
    return [line('Plopp.'), drums];
  };

  const mv = (args: string[]) => {
    const paths = args.filter((arg) => !arg.startsWith('-'));
    if (!paths.length) return [line('mv: mangler filoperand')];
    if (paths.length === 1) return [line(`mv: mangler målfil etter '${paths[0]}'`)];
    // The target can be the well or a path inside it, like moria/brønnen/stein
    const target = resolve(cwd, paths.pop()!);
    const intoWell = target === well || target?.startsWith(`${well}/`);
    return paths.flatMap((arg) => {
      if (shut(arg)) return [line(`mv: kan ikke flytte '${arg}': ${denied}`)];
      const found = find(arg);
      if (!found) return [line(`mv: kan ikke ta status for '${arg}': ${missing}`)];
      if (found.path === stone && intoWell) return throwStone();
      return [line(`mv: kan ikke flytte '${arg}': Skrivebeskyttet filsystem`)];
    });
  };

  // A hidden way to throw for visitors who don't think of mv
  const kast = ([arg, target = well]: string[]) => {
    if (!arg) return [line('kast: mangler operand')];
    if (shut(arg)) return [line(`kast: ${arg}: ${denied}`)];
    const found = find(arg);
    if (!found) return [line(`kast: ${arg}: ${missing}`)];
    if (found.path === stone && find(target)?.path === well) return throwStone();
    return [line(`kast: ${arg}: Skrivebeskyttet filsystem`)];
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
    const shownHost = winter ? winterHost : host;
    heading.textContent = shownHost;
    const dashes = document.createElement('span');
    dashes.setAttribute('aria-hidden', 'true');
    dashes.textContent = `\n${'-'.repeat(shownHost.length)}`;
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

  const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const juletre = () => {
    const height = 7;
    const ornaments = ['pink', 'lavender', 'peach'];
    const paint = (text: string, token: string) => {
      const span = document.createElement('span');
      span.textContent = text;
      span.style.color = `var(--${token})`;
      return span;
    };
    const picture = document.createElement('pre');
    picture.className = 'tree';
    picture.setAttribute('aria-hidden', 'true');
    picture.append(' '.repeat(height), paint('★', 'peach'));
    for (let row = 0; row < height; row++) {
      picture.append(`\n${' '.repeat(height - row - 1)}/`);
      for (let i = 0; i < 2 * row + 1; i++)
        picture.append(
          Math.random() < 0.25 ? paint('o', ornaments[Math.floor(Math.random() * ornaments.length)]) : '*',
        );
      picture.append('\\');
    }
    picture.append(`\n${' '.repeat(height - 1)}`, paint('[_]', 'peach'));
    return [line('Et juletre med pynt.', 'visually-hidden'), picture];
  };

  // Snow falls through a box of text for a few seconds, then settles
  const snowfall = () => {
    const [rows, columns] = [8, 40];
    const flakes = () => Array.from({ length: columns }, () => (Math.random() < 0.08 ? '*' : ' ')).join('');
    const frame = Array.from({ length: rows }, flakes);
    const picture = document.createElement('pre');
    picture.className = 'snowfall';
    picture.setAttribute('aria-hidden', 'true');
    picture.textContent = frame.join('\n');
    if (!reducedMotion()) {
      const timer = setInterval(() => {
        frame.pop();
        frame.unshift(flakes());
        picture.textContent = frame.join('\n');
      }, 200);
      setTimeout(() => clearInterval(timer), 4000);
    }
    return [line('Snø faller.', 'visually-hidden'), picture];
  };

  const snø = ([arg]: string[]) => {
    if (!arg) return snowfall();
    if (arg !== 'på' && arg !== 'av') return [line(`snø: ukjent valg '${arg}'`)];
    const on = arg === 'på';
    rememberSnow(on);
    showSnow(on);
    if (!on) return [line('Snøen har stoppet.')];
    return [line(reducedMotion() ? 'Snøen står stille når du har bedt om mindre bevegelse.' : 'Det begynner å snø.')];
  };

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
  const printHelp = () => [line(`${help.join('\n')}\n\n${tabHint}`, 'output pre')];
  const dateFormat = new Intl.DateTimeFormat('nb-NO', { dateStyle: 'full', timeStyle: 'long' });

  const commands: Record<string, (args: string[]) => Element[]> = {
    ls,
    cat: printFiles('cat'),
    head: printFiles('head'),
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
    date: () => {
      const now = new Date();
      const christmas = countdown(now);
      return [line(dateFormat.format(now)), ...(christmas ? [line(christmas)] : [])];
    },
    echo: (args) => [line(args.join(' '), 'output pre')],
    sudo,
    rm,
    mv,
    kast,
    fastfetch,
    neofetch: fastfetch,
    sl,
    vim: editor,
    nvim: editor,
    nano: editor,
    mellon,
    juletre,
    snø,
  };

  return {
    parse: (command: string) => parse(command, env()),
    complete: (before: string) => complete(cwd, helpCommands, before, hidden),
    run: (name: string | undefined, args: string[]) => {
      if (name && name !== 'exit') warnedAboutJobs = false;
      if (!name) return [];
      if (name.includes('/')) return exec(name);
      return Object.hasOwn(commands, name) ? commands[name](args) : [line(`zsh: kommando ikke funnet: ${name}`)];
    },
  };
};
