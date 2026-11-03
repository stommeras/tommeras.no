import { expect, test } from 'bun:test';
import { parse } from './shell';

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
