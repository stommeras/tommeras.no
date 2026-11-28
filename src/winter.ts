import { user } from './fs';

// From 1 December to 6 January, the thirteenth day of Christmas.
// The inline script in Window.astro repeats this check, since it can't import.
export const isWinter = (date: Date) => date.getMonth() === 11 || (date.getMonth() === 0 && date.getDate() <= 6);

export const winterHost = `${user}@nordpolen`;

export const countdown = (date: Date) => {
  if (date.getMonth() !== 11 || date.getDate() > 26) return;
  const days = 24 - date.getDate();
  if (days <= 0) return 'God jul!';
  return `${days} ${days === 1 ? 'dag' : 'dager'} til julaften.`;
};
