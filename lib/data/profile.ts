/**
 * Mock "my account" data for the consumer profile area (issue #14).
 *
 * Legacy notes: a fixture for status-badge / delete-flow coverage that
 * predates the live `reviews` table. New work should source from
 * `getUserReviews()` instead.
 */
import type { Rating } from "@/components/ui/RatingStars";

/** Moderation state of a review — see pages-diagrams.md §6 (review lifecycle). */
export type ReviewStatus = "published" | "pending" | "rejected";

export type MyReview = {
  id: string;
  shop: { name: string; href: string };
  /** Pre-formatted Persian relative date (mock data has no real timestamps). */
  date: string;
  rating: Rating;
  text: string;
  status: ReviewStatus;
  rejectionReason?: string | null;
};

/** Fixtures — one row per status, plus extras, newest first. */
export const myReviews: MyReview[] = [
  {
    id: "r1",
    shop: { name: "دیجی‌کالا", href: "/company/digikala" },
    date: "۲ روز پیش",
    rating: 5,
    text: "خرید از دیجی‌کالا همیشه تجربه خوبی بوده. ارسال سریع، بسته‌بندی عالی و پشتیبانی پاسخگو. واقعاً راضی‌ام.",
    status: "published",
  },
  {
    id: "r2",
    shop: { name: "کیک خونگی آرزو", href: "/shop/arezoo_cake" },
    date: "۵ روز پیش",
    rating: 4,
    text: "کیک تولد سفارش دادم، خوشمزه بود و سر وقت رسید. تزئینش هم تمیز و دقیق بود. تجربه خوبی بود.",
    status: "pending",
  },
  {
    id: "r3",
    shop: { name: "گجت‌شاپ", href: "/shop/gadget_shop_ir" },
    date: "۱ هفته پیش",
    rating: 2,
    text: "محصول با تاخیر زیادی رسید و بسته‌بندی هم آسیب دیده بود. پشتیبانی هم درست جواب نداد. راضی نبودم.",
    status: "published",
  },
  {
    id: "r4",
    shop: { name: "آرایشی ریحانه", href: "/shop/reyhaneh_beauty" },
    date: "۲ هفته پیش",
    rating: 1,
    text: "این نظر به دلیل رعایت‌نشدن قوانین انتشار نظرات رد شد — متن توهین‌آمیز بود.",
    status: "rejected",
  },
  {
    id: "r5",
    shop: { name: "خانه زیبای من", href: "/shop/my_beautiful_home" },
    date: "۳ هفته پیش",
    rating: 5,
    text: "چند تا قاب دکوری و گلدون سفارش دادم. کیفیت ساخت بالا و بسته‌بندی فوق‌العاده. دقیقاً همونی بود که می‌خواستم.",
    status: "published",
  },
];

export type ProfileStats = {
  /** نظرات — total reviews written. */
  reviews: number;
  /** مفید بود — "helpful" votes received on those reviews. */
  helpful: number;
  /** فالوور — followers of this reviewer. */
  followers: number;
};

/** Mock dashboard counters. `reviews` mirrors `myReviews` so the two agree. */
export const profileStats: ProfileStats = {
  reviews: myReviews.length,
  helpful: 48,
  followers: 12,
};
