import { describe, expect, test } from "vitest";
import type { Notification } from "@/lib/data/notifications";
import { dayHeader, dayKey, groupByDay } from "./groupByDay";

/**
 * Fixture factory — only the fields `groupByDay` looks at need to be real.
 */
function note(id: string, isoCreatedAt: string): Notification {
  return {
    id,
    user_id: "u1",
    type: "admin_new_review",
    title: `note ${id}`,
    body: null,
    link: null,
    read_at: null,
    created_at: isoCreatedAt,
  };
}

describe("dayKey", () => {
  test("formats as YYYY-MM-DD in the local TZ", () => {
    expect(dayKey("2026-05-26T10:00:00Z")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("two ISO timestamps from the same local day collapse to one key", () => {
    expect(dayKey("2026-05-26T01:00:00")).toBe(dayKey("2026-05-26T23:59:00"));
  });
});

describe("dayHeader", () => {
  const NOW = new Date("2026-05-26T12:00:00");

  test("today → «امروز»", () => {
    expect(dayHeader("2026-05-26T08:00:00", NOW)).toBe("امروز");
  });

  test("yesterday → «دیروز»", () => {
    expect(dayHeader("2026-05-25T22:00:00", NOW)).toBe("دیروز");
  });

  test("older → a Persian-localized full date string", () => {
    const h = dayHeader("2026-05-20T08:00:00", NOW);
    expect(h).not.toBe("امروز");
    expect(h).not.toBe("دیروز");
    expect(h.length).toBeGreaterThan(5);
  });
});

describe("groupByDay", () => {
  const NOW = new Date("2026-05-26T12:00:00");

  test("returns an empty list when given no items", () => {
    expect(groupByDay([], NOW)).toEqual([]);
  });

  test("collapses same-day items into a single group", () => {
    const items = [
      note("a", "2026-05-26T11:00:00"),
      note("b", "2026-05-26T09:00:00"),
      note("c", "2026-05-26T08:00:00"),
    ];
    const groups = groupByDay(items, NOW);
    expect(groups).toHaveLength(1);
    expect(groups[0].header).toBe("امروز");
    expect(groups[0].items.map((n) => n.id)).toEqual(["a", "b", "c"]);
  });

  test("splits at day boundaries while preserving feed order", () => {
    const items = [
      note("a", "2026-05-26T11:00:00"), // today
      note("b", "2026-05-25T22:00:00"), // yesterday
      note("c", "2026-05-25T10:00:00"), // yesterday
      note("d", "2026-05-20T08:00:00"), // older
    ];
    const groups = groupByDay(items, NOW);
    expect(groups.map((g) => g.header)).toEqual([
      "امروز",
      "دیروز",
      expect.any(String),
    ]);
    expect(groups[0].items.map((n) => n.id)).toEqual(["a"]);
    expect(groups[1].items.map((n) => n.id)).toEqual(["b", "c"]);
    expect(groups[2].items.map((n) => n.id)).toEqual(["d"]);
  });
});
