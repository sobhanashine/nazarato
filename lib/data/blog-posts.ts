export type Author = { name: string; initial: string; color?: string };

export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "subhead"; text: string }
  | { type: "quote"; text: string; author: string }
  | { type: "learn-list"; heading: string; items: string[] }
  | { type: "image"; src: string; alt?: string }
  | { type: "requirements"; heading: string; items: string[] }
  | { type: "html"; html: string };

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  author: Author;
  category: string;
  tags: string[];
  content: ContentBlock[];
};

const sharedContent: ContentBlock[] = [
  { type: "subhead", text: "حالا واقعا ما چرا بهترینیم؟" },
  {
    type: "paragraph",
    text: "انتخاب یک کسب‌وکار خوب فقط به برندِ بزرگ و تبلیغات پُررنگ خلاصه نمی‌شود. آنچه واقعاً اهمیت دارد، تجربهٔ کاربران واقعی است که پیش از شما با آن کسب‌وکار تعامل داشته‌اند. نظراتو دقیقاً همین مسیر را برایتان ساده می‌کند؛ از هزاران تجربهٔ ثبت‌شدهٔ کاربران فارسی‌زبان، تصویری شفاف از کیفیت خدمات، پشتیبانی و ارزش واقعی هر کسب‌وکار به دست می‌آوریم.",
  },
  {
    type: "paragraph",
    text: "وقتی پیش از خرید، نظرات افراد دیگر را می‌خوانید، در واقع از تجربهٔ آن‌ها به‌جای آزمون و خطای شخصی استفاده می‌کنید. این کار هم زمان شما را حفظ می‌کند و هم ریسک پشیمانی پس از خرید را کاهش می‌دهد.",
  },
  {
    type: "quote",
    text: "بهترین تبلیغ برای یک کسب‌وکار، نظر صادقانهٔ مشتری‌ای است که تجربهٔ خود را با دیگران به اشتراک می‌گذارد. اعتمادِ کاربر، با هیچ بنرِ تبلیغاتی‌ای ساخته نمی‌شود.",
    author: "سید ارشک حسینی",
  },
  {
    type: "learn-list",
    heading: "چیزایی که قراره یادبگیری:",
    items: [
      "چطور نظرات واقعی را از نظرات تبلیغاتی تشخیص دهید",
      "چه نکاتی هنگام خواندن یک نقد باید لحاظ شود",
      "چطور یک نظر مفید برای دیگران بنویسید",
      "اهمیت میانگین امتیاز در مقایسه با تعداد نظرات",
      "چه‌طور به نظراتِ منفی نگاه حرفه‌ای داشته باشید",
      "سنجش پشتیبانی و پاسخ‌گویی کسب‌وکار به مشتریان",
      "روش‌های مقایسهٔ چند کسب‌وکار با یکدیگر",
      "نقش زمان: نظرات قدیمی در مقایسه با نظرات تازه",
    ],
  },
  { type: "image", src: "/images/real-images/blog-image.png", alt: "" },
  {
    type: "requirements",
    heading: "نیازمندی‌ها",
    items: [
      "دسترسی به اینترنت پایدار برای جستجوی کسب‌وکار",
      "کمی صبر و حوصله برای خواندن چند نظر متفاوت",
      "ذهنیتِ باز برای پذیرفتنِ تجربهٔ متفاوت کاربران",
    ],
  },
];

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-choose-the-best-business",
    title: "چطور بهترین کسب‌وکار را انتخاب کنیم",
    excerpt: "راهنمایی برای انتخاب هوشمندانه‌تر بر اساس نظرات واقعی مشتریان",
    date: "۱۲ اردیبهشت ۱۴۰۳",
    image: "/images/real-images/blog-image.png",
    author: { name: "سید ارشک حسینی", initial: "س" },
    category: "راهنما",
    tags: ["راهنما", "خرید", "نظرات"],
    content: sharedContent,
  },
  {
    slug: "complete-guide-to-online-reviews",
    title: "راهنمای کامل خواندن نظرات آنلاین",
    excerpt: "نکاتی که پیش از اعتماد به نظرات آنلاین باید بدانید",
    date: "۸ اردیبهشت ۱۴۰۳",
    image: "/images/real-images/blog-image.png",
    author: { name: "نیلوفر حسینی", initial: "ن", color: "#1565C0" },
    category: "تحلیل",
    tags: ["تحلیل", "آموزش"],
    content: sharedContent,
  },
  {
    slug: "importance-of-customer-reviews",
    title: "اهمیت نظرات مشتریان در دنیای دیجیتال",
    excerpt: "چرا نظرات کاربران برای رشد کسب‌وکارها حیاتی است و چه تأثیری روی تصمیم خرید دارد",
    date: "۳ اردیبهشت ۱۴۰۳",
    image: "/images/real-images/blog-image.png",
    author: { name: "محمد رضایی", initial: "م", color: "#E65100" },
    category: "کسب‌وکار",
    tags: ["کسب‌وکار", "دیجیتال", "مشتری"],
    content: sharedContent,
  },
  {
    slug: "best-iranian-brands-1403",
    title: "بهترین برندهای ایرانی در سال ۱۴۰۳",
    excerpt: "معرفی برترین برندهای داخلی بر اساس رضایت مشتریان و کیفیت محصولات",
    date: "۲۸ فروردین ۱۴۰۳",
    image: "/images/real-images/blog-image.png",
    author: { name: "زهرا موسوی", initial: "ز", color: "#7B1FA2" },
    category: "برندها",
    tags: ["برندها", "ایرانی"],
    content: sharedContent,
  },
  {
    slug: "how-to-write-a-useful-review",
    title: "چگونه یک نظر مفید بنویسیم؟",
    excerpt: "اصول نوشتن نظری کاربردی که هم به کسب‌وکار و هم به کاربر دیگر کمک کند",
    date: "۲۱ فروردین ۱۴۰۳",
    image: "/images/real-images/blog-image.png",
    author: { name: "علی کریمی", initial: "ع", color: "#2E7D32" },
    category: "راهنما",
    tags: ["راهنما", "نوشتن"],
    content: sharedContent,
  },
];

export const getBlogPost = (slug: string): BlogPost | undefined =>
  blogPosts.find((p) => p.slug === slug);

export const getLatestPosts = (n: number = 3): BlogPost[] => blogPosts.slice(0, n);

/** Posts whose category exactly matches `name`. Case-sensitive (Persian has no case). */
export function filterPostsByCategory(
  posts: BlogPost[],
  name: string,
): BlogPost[] {
  return posts.filter((p) => p.category === name);
}

/** Posts that include `name` in their tags array. */
export function filterPostsByTag(
  posts: BlogPost[],
  name: string,
): BlogPost[] {
  return posts.filter((p) => p.tags.includes(name));
}

/**
 * Pick up to `limit` posts related to `currentSlug`.
 *
 * Scoring: +2 for same category, +1 per shared tag. Posts are ranked by
 * score (descending) and we keep the top `limit`. If we don't have enough
 * scored posts to fill the slot, we top up with the latest non-current
 * posts so the related-posts block is never empty.
 */
export function getRelatedPosts(
  posts: BlogPost[],
  currentSlug: string,
  limit = 3,
): BlogPost[] {
  const current = posts.find((p) => p.slug === currentSlug);
  if (!current) return posts.filter((p) => p.slug !== currentSlug).slice(0, limit);

  const scored = posts
    .filter((p) => p.slug !== currentSlug)
    .map((p) => {
      const sharedTags = p.tags.filter((t) => current.tags.includes(t)).length;
      const score = (p.category === current.category ? 2 : 0) + sharedTags;
      return { post: p, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.post);

  if (scored.length >= limit) return scored.slice(0, limit);
  // Top up with the latest non-current posts, skipping ones already picked.
  const seen = new Set(scored.map((p) => p.slug));
  const fillers = posts.filter(
    (p) => p.slug !== currentSlug && !seen.has(p.slug),
  );
  return [...scored, ...fillers].slice(0, limit);
}
