/**
 * Business listings — placeholder data until Supabase is wired (issue #16/#18).
 *
 * `businessDetails` is the source of truth. Card-shaped data (`Business`) and
 * rating stats are *derived* from it, so a company page and its cards can never
 * disagree. `score`/`reviews` on `Business` are pre-formatted Persian-numeral
 * strings so render code stays free of locale formatting.
 */

import type { Rating } from "@/components/ui/RatingStars";
import type { Review } from "@/lib/data/reviews";
import { categories } from "./categories";
import { supabaseAdmin } from "@/lib/supabase/server";

export function getCategoryTitle(categorySlug: string): string {
  const cat = categories.find((c) => c.href === `/categories/${categorySlug}`);
  if (cat) return cat.title;
  
  const map: Record<string, string> = {
    digital: "کالای دیجیتال",
    food: "خوراکی و شیرینی",
    health: "سلامت و مکمل",
    sports: "ورزش و کمپینگ",
  };
  return map[categorySlug] || categorySlug;
}

export function toRelativePersianTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  const faNum = (n: number) => n.toLocaleString("fa-IR");

  if (diffMins < 1) return "همین الان";
  if (diffMins < 60) return `${faNum(diffMins)} دقیقه پیش`;
  if (diffHours < 24) return `${faNum(diffHours)} ساعت پیش`;
  if (diffDays < 7) return `${faNum(diffDays)} روز پیش`;
  if (diffWeeks < 5) return `${faNum(diffWeeks)} هفته پیش`;
  if (diffMonths < 12) return `${faNum(diffMonths)} ماه پیش`;
  return `${faNum(diffYears)} سال پیش`;
}

/** Card-shaped business — consumed by `<BusinessCard />`. */
export type Business = {
  slug: string;
  name: string;
  category: string;
  city: string;
  initial: string;
  color: string;
  score: string;
  reviews: string;
  verified?: boolean;
};

/** A review as authored — `shop` is attached on read (see `getBusiness`). */
type RawReview = {
  id: string;
  user: { name: string; initial: string; color: string };
  rating: Rating;
  date: string;
  text: string;
  verified?: boolean;
  helpful_count?: number;
  /** True when the current viewer has cast a helpful vote on this review. */
  has_voted?: boolean;
  /** Public owner reply, when one exists. */
  owner_response?: { body: string; date: string };
};

/** Full business profile — the `/company/[slug]` source of truth. */
export type BusinessDetail = {
  slug: string;
  name: string;
  category: string;
  city: string;
  initial: string;
  color: string;
  verified: boolean;
  claimed: boolean;
  description: string;
  contact: { website?: string; phone?: string; instagram?: string };
  hours?: { day: string; value: string }[];
  info: { label: string; value: string }[];
  similar: string[];
  reviews: RawReview[];
};

const faNum = (n: number) => n.toLocaleString("fa-IR");

/** Average / count / 5→1 histogram, all derived from the review list. */
export function ratingStats(reviews: RawReview[]) {
  const histogram: Record<Rating, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of reviews) {
    histogram[r.rating] += 1;
    sum += r.rating;
  }
  const count = reviews.length;
  return { count, average: count ? sum / count : 0, histogram };
}

/** Persian one-decimal average, e.g. `۴٫۲`. `—` when there are no reviews. */
export function averageLabel(reviews: RawReview[]): string {
  const { count, average } = ratingStats(reviews);
  if (!count) return "—";
  return average.toLocaleString("fa-IR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/** Attach the parent business as `shop` so the row renders in `<ReviewCard />`. */
export function toReviews(detail: BusinessDetail): Review[] {
  return detail.reviews.map((r) => {
    const mockMap: Record<string, { id: string; username: string }> = {
      "سارا احمدی": { id: "user-mock-1", username: "sara_ahmadi" },
      "نیلوفر حسینی": { id: "user-mock-2", username: "niloofar_h" },
      "زهرا موسوی": { id: "user-mock-3", username: "zahra_m" },
      "علی کریمی": { id: "user-mock-4", username: "ali_k" },
      "محمد رضایی": { id: "user-mock-5", username: "mohammad_r" },
      "رضا جعفری": { id: "user-mock-6", username: "reza_j" },
    };

    const mockUser = mockMap[r.user.name];
    const userId = mockUser ? mockUser.id : `mock-user-${r.user.name.replace(/\s+/g, "-")}`;
    const username = mockUser ? mockUser.username : null;

    return {
      id: r.id,
      user: {
        id: userId,
        name: r.user.name,
        initial: r.user.initial,
        color: r.user.color,
        username,
      },
      shop: { name: detail.name, href: `/company/${detail.slug}` },
      date: r.date,
      rating: r.rating,
      text: r.text,
      verified: r.verified,
      helpful_count: r.helpful_count || 0,
      has_voted: r.has_voted || false,
      owner_response: r.owner_response
        ? { ...r.owner_response, business: { name: detail.name } }
        : undefined,
    };
  });
}

function toCard(d: BusinessDetail): Business {
  const { count, average } = ratingStats(d.reviews);
  return {
    slug: d.slug,
    name: d.name,
    category: d.category,
    city: d.city,
    initial: d.initial,
    color: d.color,
    score: count
      ? average.toLocaleString("fa-IR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      : "—",
    reviews: faNum(count),
    verified: d.verified,
  };
}

export const businessDetails: BusinessDetail[] = [
  {
    slug: "digikala",
    name: "دیجی‌کالا",
    category: "فروشگاه اینترنتی",
    city: "تهران",
    initial: "د",
    color: "#EF4444",
    verified: true,
    claimed: true,
    description:
      "بزرگ‌ترین فروشگاه اینترنتی ایران با تنوع کالا از کالای دیجیتال تا خواروبار. ارسال سراسری و امکان پرداخت در محل در بیشتر شهرها.",
    contact: { website: "digikala.com", phone: "۰۲۱۹۱۰۰۰۰۰۰", instagram: "digikala" },
    info: [
      { label: "سال تأسیس", value: "۱۳۸۵" },
      { label: "تعداد کارکنان", value: "بیش از ۱۲٬۰۰۰ نفر" },
      { label: "حوزه فعالیت", value: "خرده‌فروشی آنلاین" },
    ],
    similar: ["snappfood", "bime-pasargad", "cafe-naderi", "daroukhane-sina"],
    reviews: [
      { id: "dk-1", user: { name: "سارا احمدی", initial: "س", color: "#5BBB7B" }, rating: 5, date: "۲ روز پیش", text: "ارسال سریع و بسته‌بندی عالی. پشتیبانی هم پاسخگو بود، واقعاً راضی‌ام." },
      { id: "dk-2", user: { name: "علی کریمی", initial: "ع", color: "#3B82F6" }, rating: 4, date: "۵ روز پیش", text: "تنوع کالا فوق‌العاده‌ست. فقط زمان ارسال یک روز بیشتر از موعد طول کشید." },
      { id: "dk-3", user: { name: "نیلوفر حسینی", initial: "ن", color: "#8B5CF6" }, rating: 5, date: "۱ هفته پیش", text: "چند بار خرید کردم و هر بار تجربه خوبی داشتم. مرجوعی هم بدون دردسر بود." },
      { id: "dk-4", user: { name: "محمد رضایی", initial: "م", color: "#EC4899" }, rating: 3, date: "۲ هفته پیش", text: "کالا سالم رسید ولی قیمت بعضی محصولات از بازار بالاتر بود." },
      { id: "dk-5", user: { name: "زهرا موسوی", initial: "ز", color: "#F59E0B" }, rating: 4, date: "۳ هفته پیش", text: "اپلیکیشن روان و کاربردیه. پیگیری سفارش خیلی شفافه." },
    ],
  },
  {
    slug: "snappfood",
    name: "اسنپ‌فود",
    category: "سفارش آنلاین غذا",
    city: "تهران",
    initial: "ا",
    color: "#EC4899",
    verified: true,
    claimed: true,
    description:
      "سرویس سفارش آنلاین غذا از رستوران‌ها و سوپرمارکت‌ها. پوشش گسترده در کلان‌شهرها و امکان پیگیری لحظه‌ای پیک.",
    contact: { website: "snappfood.ir", instagram: "snappfood" },
    info: [
      { label: "سال تأسیس", value: "۱۳۹۵" },
      { label: "حوزه فعالیت", value: "سفارش و ارسال غذا" },
    ],
    similar: ["digikala", "cafe-naderi", "daroukhane-sina", "bime-pasargad"],
    reviews: [
      { id: "sf-1", user: { name: "رضا جعفری", initial: "ر", color: "#14B8A6" }, rating: 4, date: "۱ روز پیش", text: "انتخاب رستوران زیاده و تخفیف‌ها خوبن. پیک معمولاً سر وقت می‌رسه." },
      { id: "sf-2", user: { name: "مریم نادری", initial: "م", color: "#A855F7" }, rating: 3, date: "۴ روز پیش", text: "گاهی سفارش با تأخیر می‌رسه ولی پشتیبانی جبران می‌کنه." },
      { id: "sf-3", user: { name: "حسین قاسمی", initial: "ح", color: "#3B82F6" }, rating: 5, date: "۱ هفته پیش", text: "تجربه خیلی روونیه. پرداخت آنلاین و پیگیری پیک واقعاً کار رو راحت کرده." },
      { id: "sf-4", user: { name: "الهام صادقی", initial: "ا", color: "#EF4444" }, rating: 4, date: "۲ هفته پیش", text: "قیمت‌ها منصفانه‌ست و ثبت سفارش ساده‌ست. راضی‌ام." },
    ],
  },
  {
    slug: "cafe-naderi",
    name: "کافه نادری",
    category: "کافه و رستوران",
    city: "تهران",
    initial: "ک",
    color: "#F59E0B",
    verified: false,
    claimed: false,
    description:
      "کافه‌ای تاریخی در خیابان جمهوری با فضایی نوستالژیک. شیرینی‌های خانگی و قهوه دم‌شده از امضاهای این کافه است.",
    contact: { phone: "۰۲۱۶۶۷۰۰۰۰۰", instagram: "cafe_naderi" },
    hours: [
      { day: "شنبه تا چهارشنبه", value: "۸:۰۰ تا ۲۳:۰۰" },
      { day: "پنجشنبه و جمعه", value: "۸:۰۰ تا ۲۴:۰۰" },
    ],
    info: [
      { label: "سال تأسیس", value: "۱۳۰۶" },
      { label: "نوع فضا", value: "کافه، رستوران، فضای باز" },
    ],
    similar: ["snappfood", "digikala", "daroukhane-sina", "bime-pasargad"],
    reviews: [
      { id: "cn-1", user: { name: "پریسا اکبری", initial: "پ", color: "#EC4899" }, rating: 5, date: "۳ روز پیش", text: "فضاش حس خوبی داره و شیرینی‌هاش عالیه. حتماً دوباره میرم." },
      { id: "cn-2", user: { name: "کاوه مرادی", initial: "ک", color: "#14B8A6" }, rating: 4, date: "۱ هفته پیش", text: "قهوه‌اش خوب بود و برخورد پرسنل صمیمی. کمی شلوغ بود." },
      { id: "cn-3", user: { name: "شیما رحیمی", initial: "ش", color: "#8B5CF6" }, rating: 4, date: "۲ هفته پیش", text: "نوستالژی محض. قیمت‌ها هم نسبت به موقعیتش منطقیه." },
    ],
  },
  {
    slug: "bime-pasargad",
    name: "بیمه پاسارگاد",
    category: "بیمه",
    city: "تهران",
    initial: "ب",
    color: "#3B82F6",
    verified: true,
    claimed: true,
    description:
      "شرکت بیمه با پوشش بیمه‌های عمر، درمان تکمیلی و خودرو. شبکه گسترده نمایندگی در سراسر کشور.",
    contact: { website: "pasargadinsurance.ir", phone: "۰۲۱۸۲۸۸۰۰۰۰" },
    info: [
      { label: "سال تأسیس", value: "۱۳۸۵" },
      { label: "حوزه فعالیت", value: "بیمه عمر، درمان، خودرو" },
    ],
    similar: ["digikala", "snappfood", "daroukhane-sina", "cafe-naderi"],
    reviews: [
      { id: "bp-1", user: { name: "فرهاد بهرامی", initial: "ف", color: "#F59E0B" }, rating: 4, date: "۵ روز پیش", text: "پرداخت خسارت سر وقت انجام شد و نماینده‌ام پاسخگو بود." },
      { id: "bp-2", user: { name: "نازنین یوسفی", initial: "ن", color: "#A855F7" }, rating: 3, date: "۲ هفته پیش", text: "روند صدور بیمه‌نامه کمی کند بود ولی در نهایت مشکلی پیش نیومد." },
      { id: "bp-3", user: { name: "امیر شریفی", initial: "ا", color: "#EF4444" }, rating: 4, date: "۱ ماه پیش", text: "بیمه عمرشون شرایط خوبی داره. مشاوره اولیه شفاف بود." },
    ],
  },
  {
    slug: "iran-khodro-diesel",
    name: "ایران‌خودرو دیزل",
    category: "خودرو",
    city: "کرج",
    initial: "ا",
    color: "#14B8A6",
    verified: true,
    claimed: true,
    description:
      "تولیدکننده خودروهای تجاری و سنگین شامل کامیون و اتوبوس. خدمات پس از فروش از طریق نمایندگی‌های مجاز.",
    contact: { website: "ikd.ir", phone: "۰۲۶۳۴۷۰۰۰۰۰" },
    info: [
      { label: "سال تأسیس", value: "۱۳۴۵" },
      { label: "حوزه فعالیت", value: "خودروهای تجاری و سنگین" },
    ],
    similar: ["digikala", "bime-pasargad", "snappfood", "cafe-naderi"],
    reviews: [
      { id: "ik-1", user: { name: "بهنام کاظمی", initial: "ب", color: "#3B82F6" }, rating: 2, date: "۱ هفته پیش", text: "خدمات پس از فروش کند بود و تأمین قطعه زمان زیادی برد." },
      { id: "ik-2", user: { name: "سعید نعمتی", initial: "س", color: "#EC4899" }, rating: 3, date: "۳ هفته پیش", text: "خودرو کیفیت قابل قبولی داره ولی پشتیبانی باید بهتر بشه." },
      { id: "ik-3", user: { name: "جواد عباسی", initial: "ج", color: "#8B5CF6" }, rating: 3, date: "۱ ماه پیش", text: "مصرف سوخت منطقیه. روند تحویل کمی طولانی بود." },
    ],
  },
  {
    slug: "daroukhane-sina",
    name: "داروخانه دکتر سینا",
    category: "داروخانه",
    city: "اصفهان",
    initial: "د",
    color: "#8B5CF6",
    verified: true,
    claimed: true,
    description:
      "داروخانه شبانه‌روزی با بخش لوازم آرایشی-بهداشتی و مشاوره دارویی. ارسال دارو در محدوده شهر اصفهان.",
    contact: { phone: "۰۳۱۳۶۲۰۰۰۰۰", instagram: "daroukhane_sina" },
    hours: [{ day: "همه روزه", value: "۲۴ ساعته" }],
    info: [
      { label: "نوع داروخانه", value: "شبانه‌روزی" },
      { label: "خدمات", value: "مشاوره دارویی، ارسال در محل" },
    ],
    similar: ["digikala", "snappfood", "cafe-naderi", "bime-pasargad"],
    reviews: [],
  },
];

export const featuredBusinesses: Business[] = businessDetails.map(toCard);

export async function getBusiness(
  slug: string,
  viewerId?: string,
): Promise<BusinessDetail | undefined> {
  const supabase = supabaseAdmin();
  
  // 1. Fetch business row
  const { data: b, error: bError } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .single();
    
  if (bError || !b) return undefined;
  
  // 2. Fetch published reviews for this business
  const { data: reviewsData, error: rError } = await supabase
    .from("reviews")
    .select(`
      id,
      rating,
      created_at,
      body,
      verified,
      helpful_count,
      owner_response_body,
      owner_response_at,
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
    console.error("[businesses] Failed to fetch reviews", rError.message);
  }
    
  // 3. Map reviews
  interface DbReview {
    id: string;
    rating: number;
    created_at: string;
    body: string;
    verified: boolean;
    helpful_count: number;
    owner_response_body: string | null;
    owner_response_at: string | null;
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
      console.error("[businesses] Failed to fetch review votes", vError.message);
    }
    if (votes) {
      votedSet = new Set((votes as Array<{ review_id: string }>).map((v) => v.review_id));
    }
  }

  const reviews: RawReview[] = reviewsList.map((r) => {
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
      helpful_count: r.helpful_count || 0,
      has_voted: votedSet.has(r.id),
      owner_response:
        r.owner_response_body && r.owner_response_at
          ? {
              body: r.owner_response_body,
              date: toRelativePersianTime(r.owner_response_at),
            }
          : undefined,
    };
  });
  
  // 4. Fetch similar businesses from same category
  let similarSlugs: string[] = [];
  const { data: similarData } = await supabase
    .from("businesses")
    .select("slug")
    .eq("category_slug", b.category_slug)
    .eq("status", "active")
    .neq("slug", b.slug)
    .limit(4);
    
  if (similarData) {
    similarSlugs = similarData.map(s => s.slug);
  }
  
  return {
    slug: b.slug,
    name: b.name,
    category: getCategoryTitle(b.category_slug),
    city: b.city || "نامشخص",
    initial: b.initial,
    color: b.color,
    verified: b.verified,
    claimed: b.claimed,
    description: b.description || "",
    contact: b.contact || {},
    hours: b.hours || undefined,
    info: b.info || [],
    similar: similarSlugs,
    reviews: reviews,
  };
}

/** Card-shaped `similar` businesses for the مشابه tab; unknown slugs dropped. */
export async function getSimilarBusinesses(detail: BusinessDetail): Promise<Business[]> {
  const supabase = supabaseAdmin();
  if (!detail.similar || detail.similar.length === 0) return [];
  
  const { data: list, error } = await supabase
    .from("businesses")
    .select("*")
    .in("slug", detail.similar);
    
  if (error || !list) return [];
  
  return list.map(b => {
    const scoreVal = b.rating_avg ? Number(b.rating_avg) : 0.0;
    return {
      slug: b.slug,
      name: b.name,
      category: getCategoryTitle(b.category_slug),
      city: b.city || "نامشخص",
      initial: b.initial,
      color: b.color,
      score: b.review_count > 0 ? scoreVal.toLocaleString("fa-IR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—",
      reviews: b.review_count.toLocaleString("fa-IR"),
      verified: b.verified,
    };
  });
}

/** Mappings of category slugs to subcategory names. */
export const categorySubcategories: Record<string, string[]> = {
  food: ["همه", "کافه", "رستوران", "سفارش آنلاین"],
  digital: ["همه", "فروشگاه بزرگ", "خرده‌فروشی آنلاین"],
  health: ["همه", "بیمه", "داروخانه"],
  sports: ["همه", "خودرو", "سنگین"],
};

/**
 * Checks if a business details match a given subcategory keyword.
 */
export function businessMatchesSubcategory(
  b: { name: string; description?: string; category?: string; info?: unknown[] },
  subcat: string,
): boolean {
  if (!subcat || subcat === "همه") return true;
  const name = b.name || "";
  const desc = b.description || "";
  const cat = b.category || "";
  const infoText = Array.isArray(b.info) ? JSON.stringify(b.info) : "";

  const textToSearch = `${name} ${desc} ${cat} ${infoText}`.toLowerCase();

  if (subcat === "کافه") return textToSearch.includes("کافه");
  if (subcat === "رستوران") return textToSearch.includes("رستوران");
  if (subcat === "سفارش آنلاین") return textToSearch.includes("آنلاین") || textToSearch.includes("سفارش");
  if (subcat === "فروشگاه بزرگ") return textToSearch.includes("فروشگاه") || textToSearch.includes("بزرگترین") || textToSearch.includes("بزرگ‌ ترین");
  if (subcat === "خرده‌فروشی آنلاین") return textToSearch.includes("خرده‌فروشی") || textToSearch.includes("آنلاین");
  if (subcat === "بیمه") return textToSearch.includes("بیمه");
  if (subcat === "داروخانه") return textToSearch.includes("داروخانه");
  if (subcat === "خودرو") return textToSearch.includes("خودرو");
  if (subcat === "سنگین") return textToSearch.includes("سنگین");

  return textToSearch.includes(subcat.toLowerCase());
}

export type BusinessSortKey = "rating" | "reviews" | "newest";

/** Retrieve paginated, sorted, and optionally sub-category filtered businesses under a category slug. */
export async function getBusinessesByCategory(
  categorySlug: string,
  options?: {
    sort?: BusinessSortKey;
    subcategory?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ businesses: Business[]; total: number }> {
  const supabase = supabaseAdmin();
  const sort = options?.sort || "rating";
  const subcategory = options?.subcategory || "همه";
  const page = options?.page || 1;
  const limit = options?.limit || 6;

  // 1. Start querying the businesses table
  let query = supabase
    .from("businesses")
    .select("*", { count: "exact" })
    .eq("category_slug", categorySlug)
    .in("status", ["active", "merged"]);

  // Apply sorting at the database level where possible
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

  const { data, error } = await query;
  if (error || !data) {
    return { businesses: [], total: 0 };
  }

  // 2. Map DB rows to card shape
  let mappedList = data.map((b) => {
    const scoreVal = b.rating_avg ? Number(b.rating_avg) : 0.0;
    return {
      slug: b.slug,
      name: b.name,
      category: getCategoryTitle(b.category_slug),
      city: b.city || "نامشخص",
      initial: b.initial,
      color: b.color,
      score: b.review_count > 0 ? scoreVal.toLocaleString("fa-IR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—",
      reviews: b.review_count.toLocaleString("fa-IR"),
      verified: b.verified,
      description: b.description || "",
      info: b.info || [],
    };
  });

  // 3. Client-side subcategory filtering (since it's keyword-based JSONB / description parsing)
  if (subcategory && subcategory !== "همه") {
    mappedList = mappedList.filter((b) =>
      businessMatchesSubcategory(
        { name: b.name, description: b.description, category: b.category, info: b.info },
        subcategory,
      )
    );
  }

  const filteredTotal = mappedList.length;

  // 4. Client-side pagination
  const startIndex = (page - 1) * limit;
  const paginatedList = mappedList.slice(startIndex, startIndex + limit);

  // Strip temporary fields before returning
  const resultList: Business[] = paginatedList.map((b) => ({
    slug: b.slug,
    name: b.name,
    category: b.category,
    city: b.city,
    initial: b.initial,
    color: b.color,
    score: b.score,
    reviews: b.reviews,
    verified: b.verified,
  }));

  return {
    businesses: resultList,
    total: filteredTotal,
  };
}
