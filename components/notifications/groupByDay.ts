import type { Notification } from "@/lib/data/notifications";

/** Local YYYY-MM-DD key — collapses notifications by calendar day. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Persian-friendly header for a day bucket: «امروز» / «دیروز» / full date.
 * `now` is injectable so tests stay deterministic regardless of when they run.
 */
export function dayHeader(iso: string, now: Date = new Date()): string {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return "امروز";
  if (diffDays === 1) return "دیروز";
  return new Date(iso).toLocaleDateString("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export type Group = {
  key: string;
  header: string;
  items: Notification[];
};

/**
 * Bucket the (already-sorted-desc) feed into day groups, preserving order.
 * Same-day notifications stay in one bucket; group boundaries appear when
 * the calendar day changes between consecutive items.
 */
export function groupByDay(
  items: Notification[],
  now: Date = new Date(),
): Group[] {
  const groups: Group[] = [];
  for (const n of items) {
    const key = dayKey(n.created_at);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(n);
    } else {
      groups.push({ key, header: dayHeader(n.created_at, now), items: [n] });
    }
  }
  return groups;
}
