/**
 * Pure aggregation for the owner `/business/insights` page.
 *
 * Deliberately free of `server-only` / Supabase imports so it can be unit-tested
 * in a plain node environment. `owner.ts` owns the DB read and calls
 * `computeInsights` with the rows it fetched.
 */

/** One bar in the rating-distribution chart. `pct` is share of total, 0–100. */
export type RatingBar = { rating: 1 | 2 | 3 | 4 | 5; count: number; pct: number };

/** One month in the review trend. `avgRating` is null when the month had none. */
export type MonthlyPoint = {
  /** Stable `YYYY-MM` key (Gregorian) — used as a React key, never shown. */
  key: string;
  /** Persian month+year label for the axis. */
  label: string;
  count: number;
  avgRating: number | null;
};

/** Everything `/business/insights` renders, derived purely from review rows. */
export type OwnerInsights = {
  totalReviews: number;
  avgRating: number;
  /** Star buckets, 5★ → 1★. */
  distribution: RatingBar[];
  answeredCount: number;
  /** Share of reviews with an owner response, 0–100. */
  responseRate: number;
  verifiedCount: number;
  /** Share of reviews flagged verified, 0–100. */
  verifiedRate: number;
  /** Sum of `helpful_count` across all reviews. */
  helpfulTotal: number;
  /** Last 6 months, oldest → newest. */
  trend: MonthlyPoint[];
};

/** The minimal review shape `computeInsights` needs — keep the SELECT in sync. */
export type InsightsRow = {
  rating: number;
  created_at: string;
  verified: boolean;
  has_owner_response: boolean;
  helpful_count: number;
};

const pct = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

const monthKey = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

/**
 * Pure aggregation over a business's published review rows. `now` is injectable
 * for deterministic trend windows in tests.
 */
export function computeInsights(
  rows: InsightsRow[],
  now: Date = new Date(),
): OwnerInsights {
  const total = rows.length;

  const counts: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let ratingSum = 0;
  let answered = 0;
  let verified = 0;
  let helpfulTotal = 0;

  // Six month buckets ending with the current month, keyed by `YYYY-MM`.
  const buckets = new Map<string, { count: number; sum: number; label: string }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    buckets.set(monthKey(d), {
      count: 0,
      sum: 0,
      label: d.toLocaleDateString("fa-IR", { month: "short", year: "2-digit" }),
    });
  }

  for (const r of rows) {
    const rating = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    counts[rating] += 1;
    ratingSum += rating;
    if (r.has_owner_response) answered += 1;
    if (r.verified) verified += 1;
    helpfulTotal += r.helpful_count ?? 0;

    const bucket = buckets.get(monthKey(new Date(r.created_at)));
    if (bucket) {
      bucket.count += 1;
      bucket.sum += rating;
    }
  }

  const distribution: RatingBar[] = ([5, 4, 3, 2, 1] as const).map((rating) => ({
    rating,
    count: counts[rating],
    pct: pct(counts[rating], total),
  }));

  const trend: MonthlyPoint[] = [...buckets.entries()].map(([key, b]) => ({
    key,
    label: b.label,
    count: b.count,
    avgRating: b.count > 0 ? Math.round((b.sum / b.count) * 10) / 10 : null,
  }));

  return {
    totalReviews: total,
    avgRating: total > 0 ? Math.round((ratingSum / total) * 10) / 10 : 0,
    distribution,
    answeredCount: answered,
    responseRate: pct(answered, total),
    verifiedCount: verified,
    verifiedRate: pct(verified, total),
    helpfulTotal,
    trend,
  };
}
