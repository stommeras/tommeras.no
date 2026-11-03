// The site as a directory tree. The pages render their listings and texts from it, and the prompt at the end of
// every page runs ls, cat, head and cd against it, so what the prompt prints matches the page.

export type Icon = 'folder' | 'file' | 'terminal' | 'mail' | 'github' | 'linkedin' | 'flask';

export interface Text {
  // cat and the pages show it as a # heading, like a Markdown title
  title?: string;
  body: string;
}

export interface Item {
  name: string;
  kind: 'dir' | 'file' | 'link';
  icon: Icon;
  // The page a directory opens, or where a file or link goes
  href?: string;
  // Where a link points, shown after -> as ls -l does
  target?: string;
  desc?: string;
  text?: Text;
  executable?: boolean;
  children?: Item[];
}

const readme = (title: string, body: string): Item => ({
  name: 'README.md',
  kind: 'file',
  icon: 'file',
  text: { title, body },
});

export const home: Item = {
  name: '~',
  kind: 'dir',
  icon: 'folder',
  href: '/',
  children: [
    {
      name: 'hei.sh',
      kind: 'file',
      icon: 'terminal',
      executable: true,
      text: { body: '#!/bin/sh\necho "TØMMERÅS"\necho "En av nettsidene gjennom tidene."' },
    },
    {
      name: 'kontakt',
      kind: 'dir',
      icon: 'folder',
      children: [
        { name: 'hei@tommeras.no', kind: 'file', icon: 'mail', href: 'mailto:hei@tommeras.no' },
        {
          name: 'GitHub',
          kind: 'link',
          icon: 'github',
          href: 'https://github.com/stommeras',
          target: 'github.com/stommeras',
        },
        {
          name: 'LinkedIn',
          kind: 'link',
          icon: 'linkedin',
          href: 'https://www.linkedin.com/in/steffen-tommeras/',
          target: 'linkedin.com/in/steffen-tommeras',
        },
      ],
    },
    {
      name: 'om-meg.md',
      kind: 'file',
      icon: 'file',
      text: {
        title: 'Om meg',
        body: 'Hei, jeg heter Steffen Tømmerås og jobber som frontendutvikler hos Kredinor. Jeg liker å teste nye verktøy og måter å jobbe på, og for tiden er det mest AI. Denne siden er for eksempel skrevet om sammen med Claude Code.',
      },
    },
    {
      name: 'prosjekter',
      kind: 'dir',
      icon: 'folder',
      href: '/prosjekter',
      desc: 'alle prosjekter med skjermbilder',
      children: [
        {
          name: 'lab',
          kind: 'link',
          icon: 'flask',
          href: 'https://lab.tommeras.no',
          target: 'lab.tommeras.no',
          desc: 'eksperimenter og skisser',
        },
        {
          name: 'proof',
          kind: 'dir',
          icon: 'folder',
          href: '/prosjekter/proof',
          desc: 'cocktaillogg med versjonshistorikk',
          children: [
            readme(
              'Proof',
              'En cocktaillogg med versjonshistorikk inspirert av git. Hver versjon av en oppskrift er en commit med ingredienser, metode, garnityr og hva du syntes om drinken. Du kan lage en branch av en oppskrift eller flytte HEAD tilbake til en eldre versjon uten at noe du har skrevet blir overskrevet.',
            ),
          ],
        },
        {
          name: 'rabra',
          kind: 'dir',
          icon: 'folder',
          href: '/prosjekter/rabra',
          desc: 'ros til kolleger for det som gikk bra',
          children: [
            readme(
              '#Råbra',
              'En app for å gi kolleger ros. #Råbra er en metode fra helsevesenet for å lære av det som gikk bra, ikke bare av avvikene.',
            ),
          ],
        },
      ],
    },
  ],
};

// Every item by its path, like ~/prosjekter/proof
export const items = new Map<string, Item>();
const add = (path: string, item: Item) => {
  items.set(path, item);
  for (const child of item.children ?? []) add(`${path}/${child.name}`, child);
};
add('~', home);

// For the pages, which only ask for paths that exist
export const byPath = (path: string) => items.get(path)!;

export const user = 'gjest';
export const host = `${user}@tommeras`;
export const homeDir = `/home/${user}`;
export const absolute = (path: string) => `${homeDir}${path.slice(1)}`;

// Entry.astro marks each ls -l row with this key, and the prompt copies rows by it. The ./ row gets its own key.
export const rowKey = (path: string, self = false) => (self ? `${path}/.` : path);

export const perm = (item: Item) =>
  item.kind === 'dir'
    ? 'drwxr-xr-x'
    : item.kind === 'link'
      ? 'lrwxr-xr-x'
      : item.executable
        ? '-rwxr-xr-x'
        : '-rw-r--r--';

export const label = (item: Item, self = false) => (self ? './' : item.kind === 'dir' ? `${item.name}/` : item.name);

// Turns what a visitor typed into a path like ~/kontakt, relative to cwd. Returns undefined for paths outside
// the home directory, since the tree has nothing there.
export function resolve(cwd: string, arg: string): string | undefined {
  if (arg.startsWith('/')) {
    if (arg !== homeDir && !arg.startsWith(`${homeDir}/`)) return undefined;
    arg = `~${arg.slice(homeDir.length)}`;
  }
  if (arg.startsWith('~') && arg !== '~' && !arg.startsWith('~/')) return undefined;
  const parts = arg.startsWith('~') ? [] : cwd.split('/').slice(1);
  for (const part of arg.replace(/^~/, '').split('/')) {
    if (part === '..') parts.pop();
    else if (part && part !== '.') parts.push(part);
  }
  return ['~', ...parts].join('/');
}
