/**
 * Owner-side data layer for the `(business)` route group.
 *
 * "Owner" is not a `users.role` value — it's anyone whose `id` appears in
 * `businesses.owner_id` (set by the claim-approval trigger,
 * `tr_business_claim_approved` in migration 0008). One user can own multiple
 * businesses, so every read here is keyed by `userId`+`businessId`.
 *
 * Server-only: imports `supabaseAdmin` and uses the service-role key.
 */
import { supabaseAdmin } from "@/lib/supabase/server";
import { toRelativePersianTime } from "./businesses";
import { computeInsights, type InsightsRow, type OwnerInsights } from "./owner-insights";

/** Card-shaped owned business — feeds the dashboard switcher + tile. */
export type OwnedBusiness = {
  id: string;
  slug: string;
  name: string;
  initial: string;
  color: string;
  reviewCount: number;
  ratingAvg: number;
  lastReviewAt: string | null;
};

/** All businesses claimed by `userId`, most-active first. Empty list = not an owner. */
export async function getOwnedBusinesses(
  userId: string,
): Promise<OwnedBusiness[]> {
  const { data, error } = await supabaseAdmin()
    .from("businesses")
    .select(
      "id, slug, name, initial, color, review_count, rating_avg, last_review_at, status",
    )
    .eq("owner_id", userId)
    .in("status", ["active", "merged"])
    .order("review_count", { ascending: false });

  if (error) {
    console.error("[owner] getOwnedBusinesses failed", {
      userId,
      error: error.message,
    });
    throw new Error("owner lookup failed");
  }

  return (data ?? []).map((b) => ({
    id: b.id as string,
    slug: b.slug as string,
    name: b.name as string,
    initial: b.initial as string,
    color: b.color as string,
    reviewCount: (b.review_count as number) ?? 0,
    ratingAvg: b.rating_avg ? Number(b.rating_avg) : 0,
    lastReviewAt: (b.last_review_at as string | null) ?? null,
  }));
}

/** KPI tile values for `/business`. Counts are point-in-time. */
export type OwnerKpis = {
  avgRating: number;
  totalReviews: number;
  newThisWeek: number;
  unansweredCount: number;
};

/**
 * Aggregates for a single business. `avg_rating` and `review_count` come from
 * the denormalized columns on `businesses` (kept current by `tr_review_changes`
 * in migration 0002), so they're free reads. The two count(*) queries run in
 * parallel since they hit independent indexes on `reviews`.
 */
export async function getOwnerKpis(businessId: string): Promise<OwnerKpis> {
  const supabase = supabaseAdmin();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [biz, newWeek, unanswered] = await Promise.all([
    supabase
      .from("businesses")
      .select("review_count, rating_avg")
      .eq("id", businessId)
      .single(),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "published")
      .gte("created_at", oneWeekAgo),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "published")
      .eq("has_owner_response", false),
  ]);

  if (biz.error) {
    console.error("[owner] getOwnerKpis(biz) failed", {
      businessId,
      error: biz.error.message,
    });
    throw new Error("kpi lookup failed");
  }

  return {
    avgRating: biz.data?.rating_avg ? Number(biz.data.rating_avg) : 0,
    totalReviews: (biz.data?.review_count as number) ?? 0,
    newThisWeek: newWeek.count ?? 0,
    unansweredCount: unanswered.count ?? 0,
  };
}

// ─── Insights (`/business/insights`) ──────────────────────────────────────────

// The aggregation + its types live in a server-free module so they can be
// unit-tested without pulling in `server-only`/Supabase. Re-exported here so
// callers keep importing everything insights-related from `@/lib/data/owner`.
export { computeInsights };
export type { OwnerInsights, InsightsRow };
export type { RatingBar, MonthlyPoint } from "./owner-insights";

/**
 * Fetch + aggregate insights for one business. Pulls only the five columns
 * `computeInsights` needs across all published reviews; for early-stage
 * businesses (hundreds of reviews) a single scan is cheaper and more accurate
 * than a fan-out of head-count queries.
 */
export async function getOwnerInsights(businessId: string): Promise<OwnerInsights> {
  const { data, error } = await supabaseAdmin()
    .from("reviews")
    .select("rating, created_at, verified, has_owner_response, helpful_count")
    .eq("business_id", businessId)
    .eq("status", "published");

  if (error) {
    console.error("[owner] getOwnerInsights failed", {
      businessId,
      error: error.message,
    });
    throw new Error("insights lookup failed");
  }

  return computeInsights((data ?? []) as InsightsRow[]);
}

/** A review row trimmed for the owner dashboard preview list. */
export type OwnerReviewPreview = {
  id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  body: string;
  createdAt: string;
  createdAtLabel: string;
  hasOwnerResponse: boolean;
  verified: boolean;
  ownerResponse: {
    body: string;
    at: string;
    atLabel: string;
  } | null;
  author: {
    name: string;
    initial: string;
    color: string;
  };
};

type DbReviewRow = {
  id: string;
  rating: number;
  body: string;
  created_at: string;
  verified: boolean;
  has_owner_response: boolean;
  owner_response_body: string | null;
  owner_response_at: string | null;
  author: {
    display_name: string;
    avatar_color: string | null;
  } | null;
};

const REVIEW_SELECT = `id, rating, body, created_at, verified, has_owner_response,
       owner_response_body, owner_response_at,
       author:users ( display_name, avatar_color )`;

function mapReview(r: DbReviewRow): OwnerReviewPreview {
  const author = r.author ?? { display_name: "کاربر نظراتو", avatar_color: null };
  return {
    id: r.id,
    rating: Math.min(5, Math.max(1, r.rating)) as 1 | 2 | 3 | 4 | 5,
    body: r.body,
    createdAt: r.created_at,
    createdAtLabel: toRelativePersianTime(r.created_at),
    hasOwnerResponse: r.has_owner_response,
    verified: r.verified,
    ownerResponse:
      r.owner_response_body && r.owner_response_at
        ? {
            body: r.owner_response_body,
            at: r.owner_response_at,
            atLabel: toRelativePersianTime(r.owner_response_at),
          }
        : null,
    author: {
      name: author.display_name,
      initial: author.display_name.charAt(0) || "ک",
      color: author.avatar_color ?? "#3B82F6",
    },
  };
}

/** Most recent published reviews for one business; default 5 for the tile. */
export async function getRecentReviewsForOwner(
  businessId: string,
  limit = 5,
): Promise<OwnerReviewPreview[]> {
  const { data, error } = await supabaseAdmin()
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("business_id", businessId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[owner] getRecentReviewsForOwner failed", {
      businessId,
      error: error.message,
    });
    throw new Error("review preview lookup failed");
  }

  return ((data ?? []) as unknown as DbReviewRow[]).map(mapReview);
}

/** Filter for the inbox. `all` = everything published, `unanswered` = no reply yet. */
export type OwnerInboxFilter = "all" | "unanswered" | "answered";

/** Paginated inbox for `/business/reviews`. Page is 1-based. */
export async function getReviewsForOwner(
  businessId: string,
  options?: { filter?: OwnerInboxFilter; page?: number; pageSize?: number },
): Promise<{ reviews: OwnerReviewPreview[]; total: number; page: number; pageSize: number }> {
  const filter = options?.filter ?? "all";
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, options?.pageSize ?? 20));

  let query = supabaseAdmin()
    .from("reviews")
    .select(REVIEW_SELECT, { count: "exact" })
    .eq("business_id", businessId)
    .eq("status", "published");

  if (filter === "unanswered") query = query.eq("has_owner_response", false);
  else if (filter === "answered") query = query.eq("has_owner_response", true);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error("[owner] getReviewsForOwner failed", {
      businessId,
      filter,
      error: error.message,
    });
    throw new Error("review inbox lookup failed");
  }

  return {
    reviews: ((data ?? []) as unknown as DbReviewRow[]).map(mapReview),
    total: count ?? 0,
    page,
    pageSize,
  };
}

/** Verify `userId` owns `businessId`. Returns the row or `null`. Used by every owner-side action. */
export async function assertOwnsBusiness(
  userId: string,
  businessId: string,
): Promise<{ id: string; slug: string; name: string } | null> {
  const { data, error } = await supabaseAdmin()
    .from("businesses")
    .select("id, slug, name, owner_id, status")
    .eq("id", businessId)
    .maybeSingle();

  if (error) {
    console.error("[owner] assertOwnsBusiness failed", {
      userId,
      businessId,
      error: error.message,
    });
    return null;
  }
  if (!data || data.owner_id !== userId || data.status !== "active") return null;
  return { id: data.id, slug: data.slug, name: data.name };
}

/** Resolve the review row + parent business, asserting `userId` owns the business. */
export async function getReviewForOwner(
  userId: string,
  reviewId: string,
): Promise<{ review: { id: string; business_id: string; author_id: string }; business: { id: string; slug: string; name: string } } | null> {
  const { data, error } = await supabaseAdmin()
    .from("reviews")
    .select("id, business_id, author_id")
    .eq("id", reviewId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[owner] getReviewForOwner failed", { reviewId, error: error.message });
    return null;
  }
  const business = await assertOwnsBusiness(userId, data.business_id as string);
  if (!business) return null;
  return {
    review: {
      id: data.id as string,
      business_id: data.business_id as string,
      author_id: data.author_id as string,
    },
    business,
  };
}
