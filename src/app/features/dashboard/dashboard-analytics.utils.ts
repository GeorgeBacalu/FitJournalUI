export function withinDays<T>(items: T[], dateOf: (item: T) => string, days: number, now = Date.now()) {
  if (days === 0) return [...items];
  const cutoff = now - days * 86_400_000;
  return items.filter((item) => new Date(dateOf(item)).getTime() >= cutoff);
}

export function countByDay<T>(items: T[], dateOf: (item: T) => string) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const day = dateOf(item).slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  const labels = [...counts.keys()].sort();
  return { labels, values: labels.map((label) => counts.get(label) ?? 0) };
}
