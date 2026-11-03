import { expect, test } from 'bun:test';
import { add, expand, step } from './history';

test('add keeps commands in order and skips empty lines and repeats of the last one', () => {
  let entries: string[] = [];
  for (const command of ['ls', '  ', 'ls', 'cd ~ ', 'ls']) entries = add(entries, command);
  expect(entries).toEqual(['ls', 'cd ~', 'ls']);
});

test('step stops at the oldest entry and comes back to the draft after the newest', () => {
  const entries = ['ls', 'pwd'];
  // Position 2, one past the newest entry, is the line being typed
  expect(step(entries, 2, -1)).toBe(1);
  expect(step(entries, 0, -1)).toBe(0);
  expect(step(entries, 1, 1)).toBe(2);
  expect(step(entries, 2, 1)).toBe(2);
});

test('expand replaces !! with the last command and !n with command number n', () => {
  const entries = ['./hei.sh', 'cat om-meg.md', 'ls'];
  expect(expand(entries, 'pwd')).toEqual({ command: 'pwd', expanded: false });
  expect(expand(entries, '!!')).toEqual({ command: 'ls', expanded: true });
  expect(expand(entries, 'sudo !!')).toEqual({ command: 'sudo ls', expanded: true });
  expect(expand(entries, '!2 && !1')).toEqual({ command: 'cat om-meg.md && ./hei.sh', expanded: true });
});

test('expand names the first event that does not exist', () => {
  expect(expand(['ls'], '!1 !4 !0')).toEqual({ missing: '4' });
  expect(expand(['ls'], '!0')).toEqual({ missing: '0' });
  expect(expand([], '!!')).toEqual({ missing: '0' });
});
