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
  return detail.reviews.map((r) => ({
    id: r.id,
    user: r.user,
    shop: { name: detail.name, href: `/company/${detail.slug}` },
    date: r.date,
    rating: r.rating,
    text: r.text,
  }));
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

export function getBusiness(slug: string): BusinessDetail | undefined {
  return businessDetails.find((b) => b.slug === slug);
}

/** Card-shaped `similar` businesses for the مشابه tab; unknown slugs dropped. */
export function getSimilarBusinesses(detail: BusinessDetail): Business[] {
  return detail.similar
    .map((slug) => businessDetails.find((b) => b.slug === slug))
    .filter((b): b is BusinessDetail => Boolean(b))
    .map(toCard);
}
