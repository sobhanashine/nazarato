export type ReviewTitleCategory = {
  value: string;
  label: string;
};

export const REVIEW_TITLE_CATEGORIES: ReviewTitleCategory[] = [
  { value: "quality", label: "کیفیت محصول" },
  { value: "shipping", label: "ارسال و تحویل" },
  { value: "support", label: "خدمات پشتیبانی" },
  { value: "price", label: "قیمت و ارزش" },
  { value: "packaging", label: "بسته‌بندی" },
  { value: "authenticity", label: "اصالت محصول" },
  { value: "overall", label: "تجربه کلی" },
];

/** Suggested title templates per category × polarity (positive / negative). */
export const TITLE_SUGGESTIONS: Record<string, { pos: string; neg: string }> = {
  quality: { pos: "کیفیت محصول عالی بود", neg: "کیفیت محصول ضعیف بود" },
  shipping: { pos: "ارسال سریع و دقیق", neg: "تأخیر زیاد در ارسال" },
  support: { pos: "پشتیبانی عالی و پاسخگو", neg: "پشتیبانی ضعیف و بی‌پاسخ" },
  price: { pos: "قیمت مناسب و ارزش خوب", neg: "قیمت نامناسب برای این کیفیت" },
  packaging: { pos: "بسته‌بندی محکم و تمیز", neg: "بسته‌بندی ضعیف و آسیب‌پذیر" },
  authenticity: { pos: "محصول اصل و معتبر", neg: "محصول تقلبی و غیراصل" },
  overall: { pos: "تجربه خرید فوق‌العاده", neg: "تجربه خرید ناخوشایند" },
};

export type Review = {
  id: string;
  user: { name: string; initial: string; color: string };
  shop: { name: string; href: string };
  date: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  verified?: boolean;
  titleCategory?: string;
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
