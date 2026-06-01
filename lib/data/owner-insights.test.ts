import { describe, it, expect } from "vitest";
import { computeInsights, type InsightsRow } from "./owner-insights";

const NOW = new Date("2026-06-15T00:00:00Z");

function row(over: Partial<InsightsRow> & Pick<InsightsRow, "rating" | "created_at">): InsightsRow {
  return {
    verified: false,
    has_owner_response: false,
    helpful_count: 0,
    ...over,
  };
}

describe("computeInsights", () => {
  it("returns an all-zero shape for no reviews", () => {
    const r = computeInsights([], NOW);
    expect(r.totalReviews).toBe(0);
    expect(r.avgRating).toBe(0);
    expect(r.responseRate).toBe(0);
    expect(r.verifiedRate).toBe(0);
    expect(r.helpfulTotal).toBe(0);
    expect(r.distribution.map((d) => d.count)).toEqual([0, 0, 0, 0, 0]);
    expect(r.distribution.map((d) => d.pct)).toEqual([0, 0, 0, 0, 0]);
    // Always six trend buckets, even when empty.
    expect(r.trend).toHaveLength(6);
    expect(r.trend.every((p) => p.count === 0 && p.avgRating === null)).toBe(true);
  });

  it("aggregates distribution, rates, and helpful total", () => {
    const rows: InsightsRow[] = [
      row({ rating: 5, verified: true, has_owner_response: true, helpful_count: 2, created_at: "2026-06-10T00:00:00Z" }),
      row({ rating: 5, verified: true, has_owner_response: true, helpful_count: 2, created_at: "2026-06-11T00:00:00Z" }),
      row({ rating: 5, verified: true, has_owner_response: true, helpful_count: 2, created_at: "2026-06-12T00:00:00Z" }),
      row({ rating: 4, created_at: "2026-05-10T00:00:00Z" }),
      row({ rating: 1, helpful_count: 5, created_at: "2026-03-10T00:00:00Z" }),
    ];
    const r = computeInsights(rows, NOW);

    expect(r.totalReviews).toBe(5);
    expect(r.avgRating).toBe(4); // (5+5+5+4+1)/5
    // distribution is ordered 5★ → 1★
    expect(r.distribution).toEqual([
      { rating: 5, count: 3, pct: 60 },
      { rating: 4, count: 1, pct: 20 },
      { rating: 3, count: 0, pct: 0 },
      { rating: 2, count: 0, pct: 0 },
      { rating: 1, count: 1, pct: 20 },
    ]);
    expect(r.answeredCount).toBe(3);
    expect(r.responseRate).toBe(60);
    expect(r.verifiedCount).toBe(3);
    expect(r.verifiedRate).toBe(60);
    expect(r.helpfulTotal).toBe(11);
  });

  it("buckets the last six months oldest → newest with per-month averages", () => {
    const rows: InsightsRow[] = [
      row({ rating: 5, created_at: "2026-06-10T00:00:00Z" }),
      row({ rating: 3, created_at: "2026-06-20T00:00:00Z" }),
      row({ rating: 4, created_at: "2026-05-10T00:00:00Z" }),
      row({ rating: 1, created_at: "2026-03-10T00:00:00Z" }),
    ];
    const r = computeInsights(rows, NOW);

    expect(r.trend.map((p) => p.key)).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
    ]);
    expect(r.trend.map((p) => p.count)).toEqual([0, 0, 1, 0, 1, 2]);
    expect(r.trend.map((p) => p.avgRating)).toEqual([null, null, 1, null, 4, 4]); // June (5+3)/2 = 4
  });

  it("ignores reviews outside the six-month window", () => {
    const r = computeInsights(
      [row({ rating: 5, created_at: "2025-01-01T00:00:00Z" })],
      NOW,
    );
    // Counted in totals…
    expect(r.totalReviews).toBe(1);
    // …but not in any trend bucket.
    expect(r.trend.every((p) => p.count === 0)).toBe(true);
  });
});
