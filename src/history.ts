export const add = (entries: string[], command: string) => {
  const trimmed = command.trim();
  return !trimmed || trimmed === entries.at(-1) ? entries : [...entries, trimmed];
};

export const expand = (entries: string[], command: string) => {
  const events = /!(!|\d+)/g;
  const eventIndex = (event: string) => (event === '!' ? entries.length : Number(event)) - 1;
  const missing = [...command.matchAll(events)].find(([, event]) => !entries[eventIndex(event)]);
  if (missing) return { missing: String(eventIndex(missing[1]) + 1) };
  const expanded = command.replace(events, (_, event: string) => entries[eventIndex(event)]);
  return { command: expanded, expanded: expanded !== command };
};

export const draftPosition = (entries: string[]) => entries.length;

export const step = (entries: string[], at: number, by: number) =>
  Math.min(Math.max(at + by, 0), draftPosition(entries));
