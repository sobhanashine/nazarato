import { supabaseAdmin } from "@/lib/supabase/server";
import { toRelativePersianTime } from "./businesses";

/** Pre-written title suggestions shown via the lightbulb icon on the title field. */
export const TITLE_SUGGESTIONS: string[] = [
  "محصول دقیقاً مطابق توضیحات بود",
  "ارسال سریع و بسته‌بندی عالی",
  "قیمت مناسب، کیفیت خوب",
  "پشتیبانی عالی و پاسخگو",
  "کیفیت پایین‌تر از انتظار بود",
  "محصول با تأخیر رسید",
  "خرید مجدد توصیه می‌کنم",
  "از این خرید راضی نیستم",
  "بسته‌بندی محکم و حرفه‌ای",
  "محصول تقلبی بود",
];

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

export const recentReviews: Review[] = [
  {
    id: "1",
    user: { id: "user-mock-1", name: "سارا احمدی", initial: "س", color: "#5BBB7B", username: "sara_ahmadi" },
    shop: { name: "دیجی‌کالا", href: "/company/digikala" },
    date: "۲ روز پیش",
    rating: 5,
    text: "خرید از دیجی‌کالا همیشه تجربه خوبی بوده. ارسال سریع، بسته‌بندی عالی و پشتیبانی پاسخگو. واقعاً راضی‌ام.",
    helpful_count: 5,
  },
  {
    id: "2",
    user: { id: "user-mock-2", name: "نیلوفر حسینی", initial: "ن", color: "#8B5CF6", username: "niloofar_h" },
    shop: { name: "مانتو سارا", href: "/shop/manto_sara" },
    date: "۳ روز پیش",
    rating: 4,
    text: "کیفیت پارچه عالی و دوخت تمیز. سایزبندی دقیق بود و دقیقاً همون رنگی که عکسش رو دیده بودم رسید. حتماً دوباره خرید می‌کنم.",
    helpful_count: 3,
  },
  {
    id: "3",
    user: { id: "user-mock-3", name: "زهرا موسوی", initial: "ز", color: "#F59E0B", username: "zahra_m" },
    shop: { name: "کیک خونگی آرزو", href: "/shop/arezoo_cake" },
    date: "۴ روز پیش",
    rating: 3,
    text: "کیک تولد سفارش دادم، خوشمزه بود ولی تزئین اون چیزی که خواسته بودم نشد. در کل بد نبود.",
    helpful_count: 1,
  },
  {
    id: "4",
    user: { id: "user-mock-4", name: "علی کریمی", initial: "ع", color: "#3B82F6", username: "ali_k" },
    shop: { name: "گجت‌شاپ", href: "/shop/gadget_shop_ir" },
    date: "۵ روز پیش",
    rating: 2,
    text: "محصول با تاخیر زیادی رسید و بسته‌بندی هم آسیب دیده بود. پشتیبانی هم درست جواب نداد. راضی نبودم.",
    helpful_count: 0,
  },
  {
    id: "5",
    user: { id: "user-mock-5", name: "محمد رضایی", initial: "م", color: "#EC4899", username: "mohammad_r" },
    shop: { name: "آرایشی ریحانه", href: "/shop/reyhaneh_beauty" },
    date: "۱ هفته پیش",
    rating: 1,
    text: "متاسفانه محصول تقلبی بود و هیچ شباهتی به اصل نداشت. تماس گرفتم پاسخی ندادن. تجربه خیلی بدی بود.",
    helpful_count: 0,
  },
  {
    id: "6",
    user: { id: "user-mock-6", name: "رضا جعفری", initial: "ر", color: "#14B8A6", username: "reza_j" },
    shop: { name: "خانه زیبای من", href: "/shop/my_beautiful_home" },
    date: "۱ هفته پیش",
    rating: 5,
    text: "چند تا قاب دکوری و گلدون سفارش دادم. کیفیت ساخت بالا و بسته‌بندی فوق‌العاده. دقیقاً همونی بود که می‌خواستم.",
    helpful_count: 4,
  },
];

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
        category_slug
      )
    `, { count: "exact" })
    .eq("status", "published");

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
  if (authorId.startsWith("user-mock-") || authorId.startsWith("mock-user-")) {
    return recentReviews.filter((r) => r.user.id === authorId);
  }

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
      business:businesses (
        id,
        name,
        slug,
        type
      )
    `)
    .eq("author_id", authorId)
    .eq("status", "published")
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


