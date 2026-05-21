/**
 * Business listings — placeholder data until Supabase is wired (issue #16/#18).
 * A `Business` is a registered company (vs. an Instagram shop) and lives at
 * `/company/[slug]`. `score`/`reviews` are pre-formatted Persian-numeral strings
 * to match `InstagramShop` and keep render code free of locale formatting.
 */

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

export const featuredBusinesses: Business[] = [
  { slug: "digikala", name: "دیجی‌کالا", category: "فروشگاه اینترنتی", city: "تهران", initial: "د", color: "#EF4444", score: "۴.۲", reviews: "۹۸۴", verified: true },
  { slug: "snappfood", name: "اسنپ‌فود", category: "سفارش آنلاین غذا", city: "تهران", initial: "ا", color: "#EC4899", score: "۳.۹", reviews: "۷۲۱", verified: true },
  { slug: "cafe-naderi", name: "کافه نادری", category: "کافه و رستوران", city: "تهران", initial: "ک", color: "#F59E0B", score: "۴.۶", reviews: "۵۴۲" },
  { slug: "bime-pasargad", name: "بیمه پاسارگاد", category: "بیمه", city: "تهران", initial: "ب", color: "#3B82F6", score: "۳.۵", reviews: "۲۱۰" },
  { slug: "iran-khodro-diesel", name: "ایران‌خودرو دیزل", category: "خودرو", city: "کرج", initial: "ا", color: "#14B8A6", score: "۲.۸", reviews: "۱۳۴" },
  { slug: "daroukhane-sina", name: "داروخانه دکتر سینا", category: "داروخانه", city: "اصفهان", initial: "د", color: "#8B5CF6", score: "۴.۴", reviews: "۸۹", verified: true },
];
