import { expect, test } from 'bun:test';
import { countdown, isWinter } from './winter';

test('isWinter runs from 1 December to 6 January', () => {
  expect(isWinter(new Date(2026, 10, 30))).toBe(false);
  expect(isWinter(new Date(2026, 11, 1))).toBe(true);
  expect(isWinter(new Date(2027, 0, 6))).toBe(true);
  expect(isWinter(new Date(2027, 0, 7))).toBe(false);
});

test('countdown counts the days to Christmas Eve, then wishes a merry Christmas until the 26th', () => {
  expect(countdown(new Date(2026, 10, 30))).toBeUndefined();
  expect(countdown(new Date(2026, 11, 1))).toBe('23 dager til julaften.');
  expect(countdown(new Date(2026, 11, 23))).toBe('1 dag til julaften.');
  expect(countdown(new Date(2026, 11, 24))).toBe('God jul!');
  expect(countdown(new Date(2026, 11, 26))).toBe('God jul!');
  expect(countdown(new Date(2026, 11, 27))).toBeUndefined();
});
