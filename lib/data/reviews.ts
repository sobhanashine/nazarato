export type Review = {
  id: string;
  user: { name: string; initial: string; color: string };
  shop: { name: string; href: string };
  date: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
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
    rating: 5,
    text: "کیفیت پارچه عالی و دوخت تمیز. سایزبندی دقیق بود و دقیقاً همون رنگی که عکسش رو دیده بودم رسید. حتماً دوباره خرید می‌کنم.",
  },
  {
    id: "3",
    user: { name: "زهرا موسوی", initial: "ز", color: "#F59E0B" },
    shop: { name: "کیک خونگی آرزو", href: "/shop/arezoo_cake" },
    date: "۴ روز پیش",
    rating: 5,
    text: "کیک تولد سفارش دادم، خیلی خوشمزه و تازه بود. تزئین هم دقیقاً مطابق سفارش انجام شد. ممنون از خانم آرزو.",
  },
  {
    id: "4",
    user: { name: "علی کریمی", initial: "ع", color: "#3B82F6" },
    shop: { name: "گجت‌شاپ", href: "/shop/gadget_shop_ir" },
    date: "۵ روز پیش",
    rating: 4,
    text: "هندزفری اصل و گارانتی‌دار خریدم. ارسال سریع و قیمت مناسب. فقط بسته‌بندی می‌تونست بهتر باشه.",
  },
  {
    id: "5",
    user: { name: "محمد رضایی", initial: "م", color: "#EC4899" },
    shop: { name: "آرایشی ریحانه", href: "/shop/reyhaneh_beauty" },
    date: "۱ هفته پیش",
    rating: 4,
    text: "محصولات اصل و قیمت مناسب. تنوع برندها خوبه ولی کاش پیج پاسخگوتر باشه به سوالات قبل از خرید.",
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
