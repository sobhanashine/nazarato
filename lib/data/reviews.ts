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
  user: { name: string; initial: string; color: string };
  shop: { name: string; href: string };
  date: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  verified?: boolean;
};

export const recentReviews: Review[] = [
  {
    id: "1",
    user: { name: "سارا احمدی", initial: "س", color: "#5BBB7B" },
    shop: { name: "دیجی‌کالا", href: "/company/digikala" },
    date: "۲ روز پیش",
    rating: 5,
    text: "خرید از دیجی‌کالا همیشه تجربه خوبی بوده. ارسال سریع، بسته‌بندی عالی و پشتیبانی پاسخگو. واقعاً راضی‌ام.",
  },
  {
    id: "2",
    user: { name: "نیلوفر حسینی", initial: "ن", color: "#8B5CF6" },
    shop: { name: "مانتو سارا", href: "/shop/manto_sara" },
    date: "۳ روز پیش",
    rating: 4,
    text: "کیفیت پارچه عالی و دوخت تمیز. سایزبندی دقیق بود و دقیقاً همون رنگی که عکسش رو دیده بودم رسید. حتماً دوباره خرید می‌کنم.",
  },
  {
    id: "3",
    user: { name: "زهرا موسوی", initial: "ز", color: "#F59E0B" },
    shop: { name: "کیک خونگی آرزو", href: "/shop/arezoo_cake" },
    date: "۴ روز پیش",
    rating: 3,
    text: "کیک تولد سفارش دادم، خوشمزه بود ولی تزئین اون چیزی که خواسته بودم نشد. در کل بد نبود.",
  },
  {
    id: "4",
    user: { name: "علی کریمی", initial: "ع", color: "#3B82F6" },
    shop: { name: "گجت‌شاپ", href: "/shop/gadget_shop_ir" },
    date: "۵ روز پیش",
    rating: 2,
    text: "محصول با تاخیر زیادی رسید و بسته‌بندی هم آسیب دیده بود. پشتیبانی هم درست جواب نداد. راضی نبودم.",
  },
  {
    id: "5",
    user: { name: "محمد رضایی", initial: "م", color: "#EC4899" },
    shop: { name: "آرایشی ریحانه", href: "/shop/reyhaneh_beauty" },
    date: "۱ هفته پیش",
    rating: 1,
    text: "متاسفانه محصول تقلبی بود و هیچ شباهتی به اصل نداشت. تماس گرفتم پاسخی ندادن. تجربه خیلی بدی بود.",
  },
  {
    id: "6",
    user: { name: "رضا جعفری", initial: "ر", color: "#14B8A6" },
    shop: { name: "خانه زیبای من", href: "/shop/my_beautiful_home" },
    date: "۱ هفته پیش",
    rating: 5,
    text: "چند تا قاب دکوری و گلدون سفارش دادم. کیفیت ساخت بالا و بسته‌بندی فوق‌العاده. دقیقاً همونی بود که می‌خواستم.",
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
        avatar_color
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
  const reviews: Review[] = rows.map((r) => {
    const author = r.author || { display_name: "کاربر نظراتو", avatar_color: "#3B82F6" };
    const biz = r.business || { name: "کسب‌وکار ناشناس", slug: "unknown", type: "company" };
    const isIg = biz.type === "ig_shop";

    return {
      id: r.id,
      user: {
        name: author.display_name,
        initial: author.display_name.charAt(0) || "ک",
        color: author.avatar_color || "#3B82F6",
      },
      shop: {
        name: biz.name,
        href: isIg ? `/shop/${biz.slug}` : `/company/${biz.slug}`,
      },
      date: toRelativePersianTime(r.created_at),
      rating: r.rating as 1 | 2 | 3 | 4 | 5,
      text: r.body,
      verified: r.verified,
    };
  });

  return { reviews, total: count || 0 };
}

