import { supabaseAdmin } from "@/lib/supabase/server";
import { getCategoryTitle, toRelativePersianTime, type Business, type BusinessDetail } from "./businesses";
import type { Rating } from "@/components/ui/RatingStars";

export type Niche = "all" | "clothing" | "food" | "beauty" | "decor" | "digital";

export type InstagramShop = {
  href: string;
  slug: string;
  niche: Exclude<Niche, "all">;
  name: string;
  handle: string;
  initial: string;
  color: string;
  score: string;
  reviews: string;
};

export const nicheTabs: { id: Niche; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "clothing", label: "پوشاک" },
  { id: "food", label: "غذا و شیرینی" },
  { id: "beauty", label: "زیبایی و آرایشی" },
  { id: "decor", label: "دکوراسیون" },
  { id: "digital", label: "دیجیتال" },
];

export const instagramShops: InstagramShop[] = [
  { href: "#", slug: "manto_sara", niche: "clothing", name: "مانتو سارا", handle: "@manto_sara", initial: "م", color: "#8B5CF6", score: "۴.۸", reviews: "۳۲۵" },
  { href: "#", slug: "nika_fashion", niche: "clothing", name: "لباس مجلسی نیکا", handle: "@nika_fashion", initial: "ل", color: "#EC4899", score: "۴.۶", reviews: "۱۸۹" },
  { href: "#", slug: "arezoo_cake", niche: "food", name: "کیک خونگی آرزو", handle: "@arezoo_cake", initial: "ک", color: "#F59E0B", score: "۴.۹", reviews: "۴۵۶" },
  { href: "#", slug: "maman_food_ir", niche: "food", name: "غذای خانگی مامان", handle: "@maman_food_ir", initial: "غ", color: "#EF4444", score: "۴.۷", reviews: "۲۱۲" },
  { href: "#", slug: "reyhaneh_beauty", niche: "beauty", name: "آرایشی ریحانه", handle: "@reyhaneh_beauty", initial: "آ", color: "#F472B6", score: "۴.۵", reviews: "۳۷۸" },
  { href: "#", slug: "golareh_skin", niche: "beauty", name: "پوست و مو گلاره", handle: "@golareh_skin", initial: "پ", color: "#A855F7", score: "۴.۳", reviews: "۱۵۶" },
  { href: "#", slug: "my_beautiful_home", niche: "decor", name: "خانه زیبای من", handle: "@my_beautiful_home", initial: "خ", color: "#14B8A6", score: "۴.۴", reviews: "۲۸۹" },
  { href: "#", slug: "gadget_shop_ir", niche: "digital", name: "گجت‌شاپ", handle: "@gadget_shop_ir", initial: "گ", color: "#3B82F6", score: "۴.۶", reviews: "۴۱۲" },
];

const NICHE_LABEL: Record<Exclude<Niche, "all">, string> = {
  clothing: "پوشاک",
  food: "غذا و شیرینی",
  beauty: "زیبایی و آرایشی",
  decor: "دکوراسیون",
  digital: "دیجیتال",
};

/**
 * Adapt an Instagram shop to the `Business` card shape so the review-sheet
 * picker can treat shops and companies as a single searchable list. City is
 * fixed to «اینستاگرام» so users can recognise online-only sellers in the row.
 */
export function instagramShopToBusiness(s: InstagramShop): Business {
  return {
    slug: s.slug,
    name: s.name,
    category: NICHE_LABEL[s.niche],
    city: "اینستاگرام",
    initial: s.initial,
    color: s.color,
    score: s.score,
    reviews: s.reviews,
  };
}

export const instagramShopsAsBusinesses: Business[] =
  instagramShops.map(instagramShopToBusiness);

export type InstagramShopSortKey = "rating" | "reviews" | "newest";

export interface DbInstagramShopRow {
  id: string;
  slug: string;
  type: string;
  name: string;
  category_slug: string;
  city: string | null;
  description: string | null;
  initial: string;
  color: string;
  contact: Record<string, unknown>;
  hours: unknown[] | null;
  info: unknown[] | null;
  claimed: boolean;
  verified: boolean;
  status: string;
  review_count: number;
  rating_sum: number;
  rating_avg: number | null;
  created_at: string;
  updated_at: string;
}

/** Convert a database businesses row to InstagramShop card format */
export function mapDbRowToInstagramShop(b: DbInstagramShopRow): InstagramShop {
  const scoreVal = b.rating_avg ? Number(b.rating_avg) : 0.0;
  return {
    href: `/shop/${b.slug}`,
    slug: b.slug,
    niche: b.category_slug as Exclude<Niche, "all">,
    name: b.name,
    handle: `@${b.slug}`,
    initial: b.initial,
    color: b.color,
    score: b.review_count > 0 ? scoreVal.toLocaleString("fa-IR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—",
    reviews: b.review_count.toLocaleString("fa-IR"),
  };
}

/** Fetch Instagram shops with sorting, niche filtering, and pagination from DB */
export async function getInstagramShopsFromDb(options?: {
  sort?: InstagramShopSortKey;
  niche?: Niche;
  page?: number;
  limit?: number;
}): Promise<{ shops: InstagramShop[]; total: number }> {
  const supabase = supabaseAdmin();
  const sort = options?.sort || "rating";
  const niche = options?.niche || "all";
  const page = options?.page || 1;
  const limit = options?.limit || 8;

  let query = supabase
    .from("businesses")
    .select("*", { count: "exact" })
    .eq("type", "ig_shop")
    .in("status", ["active", "merged"]);

  if (niche && niche !== "all") {
    query = query.eq("category_slug", niche);
  }

  // Apply sorting at the database level
  if (sort === "rating") {
    query = query
      .order("rating_avg", { ascending: false })
      .order("review_count", { ascending: false });
  } else if (sort === "reviews") {
    query = query
      .order("review_count", { ascending: false })
      .order("rating_avg", { ascending: false });
  } else if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  }

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error || !data) {
    console.error("[instagram-shops] Failed to fetch shops:", error?.message);
    return { shops: [], total: 0 };
  }

  const dbRows = data as unknown as DbInstagramShopRow[];
  const shops = dbRows.map(mapDbRowToInstagramShop);
  return { shops, total: count || 0 };
}

/** Get individual Instagram shop profile by handle (slug) and fetch its reviews */
export async function getShopByHandle(
  handle: string,
  viewerId?: string,
): Promise<BusinessDetail | undefined> {
  const supabase = supabaseAdmin();
  
  // 1. Fetch shop row
  const { data: bRaw, error: bError } = await supabase
    .from("businesses")
    .select("*")
    .eq("type", "ig_shop")
    .eq("slug", handle)
    .single();
    
  if (bError || !bRaw) return undefined;
  
  const b = bRaw as unknown as DbInstagramShopRow;
  
  // 2. Fetch published reviews for this shop
  const { data: reviewsData, error: rError } = await supabase
    .from("reviews")
    .select(`
      id,
      rating,
      created_at,
      body,
      verified,
      author:users (
        id,
        display_name,
        avatar_color
      )
    `)
    .eq("business_id", b.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (rError) {
    console.error("[instagram-shops] Failed to fetch reviews:", rError.message);
  }
    
  // 3. Map reviews
  interface DbReview {
    id: string;
    rating: number;
    created_at: string;
    body: string;
    verified: boolean;
    author: {
      id: string;
      display_name: string;
      avatar_color: string | null;
    } | null;
  }

  const reviewsList = (reviewsData || []) as unknown as DbReview[];

  // Resolve which of these reviews the viewer has already voted on.
  let votedSet: Set<string> = new Set();
  if (viewerId && reviewsList.length > 0) {
    const { data: votes, error: vError } = await supabase
      .from("review_votes")
      .select("review_id")
      .eq("user_id", viewerId)
      .in("review_id", reviewsList.map((r) => r.id));
    if (vError && vError.code !== "PGRST205") {
      console.error("[instagram-shops] Failed to fetch review votes:", vError.message);
    }
    if (votes) {
      votedSet = new Set((votes as Array<{ review_id: string }>).map((v) => v.review_id));
    }
  }

  const reviews = reviewsList.map((r) => {
    const author = r.author || { display_name: "کاربر نظراتو", avatar_color: "#3B82F6" };
    return {
      id: r.id,
      user: {
        name: author.display_name,
        initial: author.display_name.charAt(0) || "ک",
        color: author.avatar_color || "#3B82F6",
      },
      rating: r.rating as Rating,
      date: toRelativePersianTime(r.created_at),
      text: r.body,
      verified: r.verified,
      has_voted: votedSet.has(r.id),
    };
  });
  
  // 4. Fetch similar shops from same category (niche)
  let similarSlugs: string[] = [];
  const { data: similarData } = await supabase
    .from("businesses")
    .select("slug")
    .eq("type", "ig_shop")
    .eq("category_slug", b.category_slug)
    .eq("status", "active")
    .neq("slug", b.slug)
    .limit(4);
    
  if (similarData) {
    similarSlugs = (similarData as { slug: string }[]).map(s => s.slug);
  }
  
  return {
    slug: b.slug,
    name: b.name,
    category: getCategoryTitle(b.category_slug),
    city: b.city || "اینستاگرامی",
    initial: b.initial,
    color: b.color,
    verified: b.verified,
    claimed: b.claimed,
    description: b.description || "",
    contact: b.contact as { website?: string; phone?: string; instagram?: string },
    hours: b.hours as { day: string; value: string }[] | undefined,
    info: (b.info || []) as { label: string; value: string }[],
    similar: similarSlugs,
    reviews: reviews,
  };
}

export async function getSimilarShops(shop: BusinessDetail): Promise<InstagramShop[]> {
  const supabase = supabaseAdmin();
  const nicheId = nicheTabs.find((t) => t.label === shop.category)?.id || "";
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("type", "ig_shop")
    .eq("category_slug", nicheId)
    .eq("status", "active")
    .neq("slug", shop.slug)
    .limit(4);

  if (error || !data) return [];
  const dbRows = data as unknown as DbInstagramShopRow[];
  return dbRows.map(mapDbRowToInstagramShop);
}
