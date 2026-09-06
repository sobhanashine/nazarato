import { supabaseAdmin } from "@/lib/supabase/server";
import {
  PUBLIC_BUSINESS_SOURCE_SELECT,
  PUBLIC_BUSINESS_STATUSES,
  toRelativePersianTime,
} from "./businesses";

export type Review = {
  id: string;
  user: { id: string; name: string; initial: string; color: string; username?: string | null };
  shop: { name: string; href: string };
  date: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  verified?: boolean;
  helpful_count?: number;
  /** True when the current viewer has cast a helpful vote on this review. */
  has_voted?: boolean;
  /** Public reply from the business owner, set via `/business/reviews`. */
  owner_response?: {
    body: string;
    /** Pre-formatted Persian relative time, e.g. «۲ روز پیش». */
    date: string;
    /** The owning business — kept on the response so the badge can say "پاسخ از X". */
    business: { name: string };
  };
};

/** Fetch which review IDs the given viewer has already voted on. */
async function fetchVotedSet(
  viewerId: string | undefined,
  reviewIds: string[],
): Promise<Set<string>> {
  if (!viewerId || reviewIds.length === 0) return new Set();
  // Skip mock IDs — they would be rejected by the UUID-typed FK.
  const realIds = reviewIds.filter((id) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
  );
  if (realIds.length === 0) return new Set();

  const { data, error } = await supabaseAdmin()
    .from("review_votes")
    .select("review_id")
    .eq("user_id", viewerId)
    .in("review_id", realIds);

  if (error || !data) {
    if (error?.code !== "PGRST205") {
      console.error("[reviews] fetchVotedSet failed", error?.message);
    }
    return new Set();
  }
  return new Set((data as Array<{ review_id: string }>).map((r) => r.review_id));
}

export type GlobalReviewSortKey = "newest" | "helpful" | "controversial";

export async function getReviewsFromDb(options?: {
  rating?: number;
  categorySlug?: string;
  igOnly?: boolean;
  sort?: GlobalReviewSortKey;
  page?: number;
  limit?: number;
  viewerId?: string;
}): Promise<{ reviews: Review[]; total: number }> {
  const supabase = supabaseAdmin();
  const rating = options?.rating || 0;
  const categorySlug = options?.categorySlug || "all";
  const igOnly = options?.igOnly || false;
  const sort = options?.sort || "newest";
  const page = options?.page || 1;
  const limit = options?.limit || 6;

  let query = supabase
    .from("reviews")
    .select(`
      id,
      rating,
      created_at,
      body,
      verified,
      helpful_count,
      report_count,
      author:users (
        id,
        display_name,
        avatar_color,
        username
      ),
      business:businesses!inner (
        id,
        name,
        slug,
        type,
        category_slug,
        ${PUBLIC_BUSINESS_SOURCE_SELECT}
      )
    `, { count: "exact" })
    .eq("status", "published")
    .in("business.status", PUBLIC_BUSINESS_STATUSES)
    .eq("business.business_sources.status", "approved");

  if (rating > 0) {
    query = query.eq("rating", rating);
  }

  if (categorySlug && categorySlug !== "all") {
    query = query.eq("business.category_slug", categorySlug);
  }

  if (igOnly) {
    query = query.eq("business.type", "ig_shop");
  }

  if (sort === "helpful") {
    query = query.order("helpful_count", { ascending: false }).order("created_at", { ascending: false });
  } else if (sort === "controversial") {
    query = query.order("report_count", { ascending: false }).order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error || !data) {
    console.error("[reviews] Failed to fetch global reviews:", error?.message);
    return { reviews: [], total: 0 };
  }

  interface DbReviewRow {
    id: string;
    rating: number;
    created_at: string;
    body: string;
    verified: boolean;
    helpful_count: number;
    report_count: number;
    author: {
      id: string;
      display_name: string;
      avatar_color: string | null;
      username: string | null;
    } | null;
    business: {
      id: string;
      name: string;
      slug: string;
      type: string;
      category_slug: string;
    } | null;
  }

  const rows = data as unknown as DbReviewRow[];
  const votedSet = await fetchVotedSet(
    options?.viewerId,
    rows.map((r) => r.id),
  );

  const reviews: Review[] = rows.map((r) => {
    const author = r.author || { id: "unknown", display_name: "کاربر نظراتو", avatar_color: "#3B82F6", username: null };
    const biz = r.business || { name: "کسب‌وکار ناشناس", slug: "unknown", type: "company" };
    const isIg = biz.type === "ig_shop";

    return {
      id: r.id,
      user: {
        id: author.id,
        name: author.display_name,
        initial: author.display_name.charAt(0) || "ک",
        color: author.avatar_color || "#3B82F6",
        username: author.username,
      },
      shop: {
        name: biz.name,
        href: isIg ? `/shop/${biz.slug}` : `/company/${biz.slug}`,
      },
      date: toRelativePersianTime(r.created_at),
      rating: r.rating as 1 | 2 | 3 | 4 | 5,
      text: r.body,
      verified: r.verified,
      helpful_count: r.helpful_count || 0,
      has_voted: votedSet.has(r.id),
    };
  });

  return { reviews, total: count || 0 };
}

/** Fetch only the published reviews written by a specific user. */
export async function getUserReviews(
  authorId: string,
  viewerId?: string,
): Promise<Review[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      id,
      rating,
      created_at,
      body,
      verified,
      helpful_count,
      author:users (
        id,
        display_name,
        avatar_color,
        username
      ),
      business:businesses!inner (
        id,
        name,
        slug,
        type,
        ${PUBLIC_BUSINESS_SOURCE_SELECT}
      )
    `)
    .eq("author_id", authorId)
    .eq("status", "published")
    .in("business.status", PUBLIC_BUSINESS_STATUSES)
    .eq("business.business_sources.status", "approved")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[reviews] Failed to fetch user reviews:", error?.message);
    return [];
  }

  interface DbReviewRow {
    id: string;
    rating: number;
    created_at: string;
    body: string;
    verified: boolean;
    helpful_count: number;
    author: {
      id: string;
      display_name: string;
      avatar_color: string | null;
      username: string | null;
    } | null;
    business: {
      id: string;
      name: string;
      slug: string;
      type: string;
    } | null;
  }

  const rows = data as unknown as DbReviewRow[];
  const votedSet = await fetchVotedSet(viewerId, rows.map((r) => r.id));

  return rows.map((r) => {
    const author = r.author || { id: "unknown", display_name: "کاربر نظراتو", avatar_color: "#3B82F6", username: null };
    const biz = r.business || { name: "کسب‌وکار ناشناس", slug: "unknown", type: "company" };
    const isIg = biz.type === "ig_shop";

    return {
      id: r.id,
      user: {
        id: author.id,
        name: author.display_name,
        initial: author.display_name.charAt(0) || "ک",
        color: author.avatar_color || "#3B82F6",
        username: author.username,
      },
      shop: {
        name: biz.name,
        href: isIg ? `/shop/${biz.slug}` : `/company/${biz.slug}`,
      },
      date: toRelativePersianTime(r.created_at),
      rating: r.rating as 1 | 2 | 3 | 4 | 5,
      text: r.body,
      verified: r.verified,
      helpful_count: r.helpful_count || 0,
      has_voted: votedSet.has(r.id),
    };
  });
}

