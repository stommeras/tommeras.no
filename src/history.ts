// Like zsh with HIST_IGNORE_DUPS, a command that repeats the one before it isn't stored again
export const add = (entries: string[], command: string) => {
  const trimmed = command.trim();
  return !trimmed || trimmed === entries.at(-1) ? entries : [...entries, trimmed];
};

// Event numbers start at 1, and !! is the last event, so !! in an empty history is event 0, which doesn't exist
export const expand = (entries: string[], command: string) => {
  const events = /!(!|\d+)/g;
  const number = (event: string) => (event === '!' ? entries.length : Number(event));
  const missing = [...command.matchAll(events)].find(([, event]) => !entries[number(event) - 1]);
  if (missing) return { missing: String(number(missing[1])) };
  const expanded = command.replace(events, (_, event: string) => entries[number(event) - 1]);
  return { command: expanded, expanded: expanded !== command };
};

// Position entries.length, one past the newest entry, is the line being typed
export const step = (entries: string[], at: number, by: number) => Math.min(Math.max(at + by, 0), entries.length);
