export type Niche = "all" | "clothing" | "food" | "beauty" | "decor" | "digital";

export type InstagramShop = {
  href: string;
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
  { href: "#", niche: "clothing", name: "مانتو سارا", handle: "@manto_sara", initial: "م", color: "#8B5CF6", score: "۴.۸", reviews: "۳۲۵" },
  { href: "#", niche: "clothing", name: "لباس مجلسی نیکا", handle: "@nika_fashion", initial: "ل", color: "#EC4899", score: "۴.۶", reviews: "۱۸۹" },
  { href: "#", niche: "food", name: "کیک خونگی آرزو", handle: "@arezoo_cake", initial: "ک", color: "#F59E0B", score: "۴.۹", reviews: "۴۵۶" },
  { href: "#", niche: "food", name: "غذای خانگی مامان", handle: "@maman_food_ir", initial: "غ", color: "#EF4444", score: "۴.۷", reviews: "۲۱۲" },
  { href: "#", niche: "beauty", name: "آرایشی ریحانه", handle: "@reyhaneh_beauty", initial: "آ", color: "#F472B6", score: "۴.۵", reviews: "۳۷۸" },
  { href: "#", niche: "beauty", name: "پوست و مو گلاره", handle: "@golareh_skin", initial: "پ", color: "#A855F7", score: "۴.۳", reviews: "۱۵۶" },
  { href: "#", niche: "decor", name: "خانه زیبای من", handle: "@my_beautiful_home", initial: "خ", color: "#14B8A6", score: "۴.۴", reviews: "۲۸۹" },
  { href: "#", niche: "digital", name: "گجت‌شاپ", handle: "@gadget_shop_ir", initial: "گ", color: "#3B82F6", score: "۴.۶", reviews: "۴۱۲" },
];
