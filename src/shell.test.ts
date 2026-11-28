import { expect, test } from 'bun:test';
import { complete, parse } from './shell';

const commands = ['cat', 'cd', 'clear', 'ls'];

test('complete fills in a unique command, path, or directory', () => {
  expect(complete('~', commands, 'l')).toEqual({ completed: 'ls ', options: [] });
  expect(complete('~', commands, 'cat om')).toEqual({ completed: 'cat om-meg.md ', options: [] });
  expect(complete('~', commands, 'ls pro')).toEqual({ completed: 'ls prosjekter/', options: [] });
  expect(complete('~', commands, 'cat prosjekter/proof/R')).toEqual({
    completed: 'cat prosjekter/proof/README.md ',
    options: [],
  });
  expect(complete('~/prosjekter', commands, 'cd ../ko')).toEqual({ completed: 'cd ../kontakt/', options: [] });
  expect(complete('~', commands, './h')).toEqual({ completed: './hei.sh ', options: [] });
  expect(complete('~/kontakt', commands, 'ls ~')).toEqual({ completed: 'ls ~/', options: [] });
});

test('complete fills in as far as the matches agree, then lists them', () => {
  expect(complete('~', commands, 'c')).toEqual({ completed: 'c', options: ['cat', 'cd', 'clear'] });
  expect(complete('~', commands, 'cl')).toEqual({ completed: 'clear ', options: [] });
  expect(complete('~/prosjekter', commands, 'ls m')).toEqual({ completed: 'ls myldre/', options: [] });
  expect(complete('~', commands, 'cat ')).toEqual({
    completed: 'cat ',
    options: ['hei.sh', 'kontakt/', 'moria/', 'om-meg.md', 'prosjekter/'],
  });
});

test('complete offers only directories and links to cd', () => {
  expect(complete('~', commands, 'cd ')).toEqual({ completed: 'cd ', options: ['kontakt/', 'moria/', 'prosjekter/'] });
});

test('complete leaves out hidden paths', () => {
  expect(complete('~', commands, 'cat moria/')).toEqual({
    completed: 'cat moria/',
    options: ['broen/', 'brønnen/', 'notat.txt', 'stein'],
  });
  const sealed = (path: string) => path.startsWith('~/moria/');
  expect(complete('~', commands, 'cat moria/', sealed)).toEqual({ completed: 'cat moria/', options: [] });
  expect(complete('~', commands, 'cd mo', sealed)).toEqual({ completed: 'cd moria/', options: [] });
});

test('complete leaves unknown, quoted, and empty words alone', () => {
  expect(complete('~', commands, 'xyz')).toEqual({ completed: 'xyz', options: [] });
  expect(complete('~', commands, 'cat nope/')).toEqual({ completed: 'cat nope/', options: [] });
  expect(complete('~', commands, `cat "om`)).toEqual({ completed: `cat "om`, options: [] });
  expect(complete('~', commands, '')).toEqual({ completed: '', options: [] });
});

test('parse splits a command into words on any run of whitespace', () => {
  expect(parse('  ls   -la\tprosjekter ')).toEqual(['ls', '-la', 'prosjekter']);
  expect(parse('   ')).toEqual([]);
});

test('parse keeps quoted whitespace in one word and drops the quotes', () => {
  expect(parse(`echo "hei  du" 'og deg'`)).toEqual(['echo', 'hei  du', 'og deg']);
  expect(parse(`echo "it's" 'si "hei"'`)).toEqual(['echo', "it's", 'si "hei"']);
  expect(parse(`cat om"-"meg.md ""`)).toEqual(['cat', 'om-meg.md', '']);
});

test('parse runs an unclosed quote to the end of the line', () => {
  expect(parse('echo "hei')).toEqual(['echo', 'hei']);
  expect(parse("echo 'hei du")).toEqual(['echo', 'hei du']);
});

test('parse expands variables outside single quotes, and an unknown one to nothing', () => {
  const env = { USER: 'gjest', HOME: '/home/gjest' };
  expect(parse(`echo $USER@tommeras "$HOME/x" '$USER'`, env)).toEqual([
    'echo',
    'gjest@tommeras',
    '/home/gjest/x',
    '$USER',
  ]);
  expect(parse(`echo $NOPE "$NOPE" $ 5$`, env)).toEqual(['echo', '', '$', '5$']);
});
