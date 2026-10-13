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

// Editorial guides explain the current product; they contain no pilot findings.
export const blogPosts: BlogPost[] = [
  {
    "slug": "how-to-choose-the-best-business",
    "title": "برای انتخاب یک مکان، از کجا شروع کنیم؟",
    "excerpt": "نام و نشانی، زمان تجربه و دلیل مراجعه را کنار هم بخوان.",
    "category": "راهنما",
    "tags": [
      "راهنما",
      "انتخاب",
      "رشت"
    ],
    "content": [
      {
        "type": "paragraph",
        "text": "برای پیدا کردن کافه یا رستوران، محدوده را انتخاب کن و نام یا نشانی را جستجو کن. صفحهٔ مکان به آشنایی اولیه کمک می‌کند؛ اطلاعات پایه به معنی تأیید کیفیت یا مالکیت نیست."
      },
      {
        "type": "subhead",
        "text": "چه چیزی برای تو مهم است؟"
      },
      {
        "type": "paragraph",
        "text": "پیش از انتخاب، دلیل رفتنت را روشن کن. برای گفت‌وگو می‌روی یا غذا؟ تجربه‌ای را بخوان که زمان و زمینه‌اش به نیاز تو نزدیک باشد. اگر دادهٔ کافی نیست، نتیجهٔ قطعی نگیریم."
      },
      {
        "type": "learn-list",
        "heading": "سه چیز را جدا بخوان",
        "items": [
          "نام، نشانی و راه تماس: اطلاعات اولیهٔ مکان.",
          "شرح مراجعه: تجربهٔ شخصی نویسنده در یک زمان مشخص.",
          "تأیید مالکیت: بررسی مستقل ارتباط مالک با صفحه."
        ]
      },
      {
        "type": "paragraph",
        "text": "فهرست عمومی نظراتو از رشت شروع می‌شود و با اطلاعات بررسی‌شده کامل خواهد شد. نبود امتیاز یا تجربه را صریح نمایش می‌دهیم."
      }
    ],
    "date": "۱۲ مهر ۱۴۰۵",
    "image": "",
    "author": {
      "name": "نظراتو",
      "initial": "ن"
    }
  },
  {
    "slug": "complete-guide-to-online-reviews",
    "title": "یک تجربهٔ مفید چه جزئیاتی دارد؟",
    "excerpt": "زمان مراجعه، دلیل رفتن و مثال مشخص به نفر بعد کمک می‌کند.",
    "category": "آموزش",
    "tags": [
      "آموزش",
      "تجربه"
    ],
    "content": [
      {
        "type": "paragraph",
        "text": "یک تجربهٔ مفید، داستان همان مراجعه است. بگو چه زمانی رفتی، برای چه کاری و چه چیزی مشاهده کردی. امتیاز به‌تنهایی این زمینه را نشان نمی‌دهد."
      },
      {
        "type": "learn-list",
        "heading": "پیش از نوشتن",
        "items": [
          "صفحه و نشانی را با مکان مراجعه تطبیق بده.",
          "یک اتفاق یا مثال مشخص را توضیح بده.",
          "چیزی که خودت دیدی را از شنیده‌ها جدا کن.",
          "اطلاعات خصوصی کارکنان یا مشتریان دیگر را ننویس."
        ]
      },
      {
        "type": "paragraph",
        "text": "اگر چیزی خوب نبود، توضیح بده چه اتفاقی افتاد و چه انتظاری داشتی. اگر چیزی خوب بود، بگو دقیقاً کدام قسمت تجربه به کارت آمد."
      },
      {
        "type": "paragraph",
        "text": "در وضعیت فعلی، ثبت عمومی تجربه به آماده‌شدن ورود پیامکی وابسته است. ذخیره در پیش‌نمایش محلی فقط در مرورگر انجام می‌شود و انتشار عمومی نیست."
      }
    ],
    "date": "۱۲ مهر ۱۴۰۵",
    "image": "",
    "author": {
      "name": "نظراتو",
      "initial": "ن"
    }
  },
  {
    "slug": "importance-of-customer-reviews",
    "title": "از تجربهٔ مشتری تا یک اقدام مشخص",
    "excerpt": "مسیر در حال توسعهٔ نظراتو برای شنیدن، فهمیدن و بررسی یک تغییر.",
    "category": "کسب‌وکار",
    "tags": [
      "کسب‌وکار",
      "مشتری"
    ],
    "content": [
      {
        "type": "paragraph",
        "text": "مالک به چیزی بیش از یک امتیاز نیاز دارد: مشتری چه تجربه‌ای داشته، مسئله کجاست و کدام تغییر را می‌توان امتحان کرد؟"
      },
      {
        "type": "learn-list",
        "heading": "مسیر محصول نظراتو",
        "items": [
          "تجربه‌های مستقیم مشتری با زمینهٔ مراجعه.",
          "شناخت موضوع‌های تکرارشونده، همراه تجربه‌های پشتیبان.",
          "انتخاب یک اقدام عملی توسط مالک.",
          "بررسی تجربه‌های بعدی برای فهم نتیجهٔ تغییر."
        ]
      },
      {
        "type": "paragraph",
        "text": "تحلیل موضوعات و سنجش تغییر در حال توسعه‌اند. این متن گزارش یک پایلوت یا نتیجهٔ آماده نیست؛ مسیر طراحی محصول را توضیح می‌دهد."
      },
      {
        "type": "paragraph",
        "text": "برای معرفی کافه یا رستوران در رشت یا گفت‌وگو دربارهٔ پایلوت، نام، محدوده و راه تماس عمومی را از فرم تماس بفرست. این معرفی به‌تنهایی مالکیت را تأیید نمی‌کند."
      }
    ],
    "date": "۱۲ مهر ۱۴۰۵",
    "image": "",
    "author": {
      "name": "نظراتو",
      "initial": "ن"
    }
  },
  {
    "slug": "best-iranian-brands-1403",
    "title": "چرا یک امتیاز برای انتخاب کافی نیست؟",
    "excerpt": "تعداد تجربه‌ها، زمان و جزئیات را هم ببین؛ هر امتیاز به یک زمینه مربوط است.",
    "category": "تحلیل",
    "tags": [
      "تحلیل",
      "انتخاب"
    ],
    "content": [
      {
        "type": "paragraph",
        "text": "امتیاز می‌تواند یک نشانه باشد، اما توضیح نمی‌دهد نویسنده برای چه کاری مراجعه کرده یا چه چیزی برای او مهم بوده است. برای انتخاب خودت، متن و زمینه را هم بخوان."
      },
      {
        "type": "learn-list",
        "heading": "کنار امتیاز بررسی کن",
        "items": [
          "چند تجربه منتشر شده است؟ نبود تجربه را با رضایت اشتباه نگیر.",
          "تجربه چه زمانی رخ داده است؟",
          "دلیل مراجعه چه بوده و آیا به نیاز تو نزدیک است؟",
          "نویسنده چه مشاهدهٔ مشخصی بیان کرده است؟"
        ]
      },
      {
        "type": "paragraph",
        "text": "نظراتو برای مکان بدون تجربهٔ منتشرشده امتیازی نمی‌سازد. ترتیب فهرست مکان‌ها نیز به‌تنهایی به معنی توصیهٔ شخصی یا رتبه‌بندی کیفیت نیست."
      }
    ],
    "date": "۱۲ مهر ۱۴۰۵",
    "image": "",
    "author": {
      "name": "نظراتو",
      "initial": "ن"
    }
  },
  {
    "slug": "how-to-write-a-useful-review",
    "title": "اطلاعات مکان نیاز به اصلاح دارد؟",
    "excerpt": "لینک صفحه، مورد نادرست و یک منبع عمومی برای اصلاح را بفرست.",
    "category": "راهنما",
    "tags": [
      "راهنما",
      "اطلاعات"
    ],
    "content": [
      {
        "type": "paragraph",
        "text": "اگر نام، نشانی یا راه تماس یک مکان نادرست است، لینک صفحه و موردی که باید اصلاح شود را از فرم تماس بفرست. یک منبع عمومی روشن، بررسی را آسان‌تر می‌کند."
      },
      {
        "type": "learn-list",
        "heading": "برای اصلاح اطلاعات",
        "items": [
          "لینک صفحهٔ مکان در نظراتو.",
          "اطلاعات فعلی و مقدار پیشنهادی.",
          "لینک منبع عمومی یا توضیح روشن دربارهٔ مشاهدهٔ خودت."
        ]
      },
      {
        "type": "paragraph",
        "text": "برای این درخواست، رمز، مدرک هویتی یا اطلاعات خصوصی مشتریان لازم نیست. اصلاح اطلاعات، تجربهٔ مشتری و تأیید مالکیت مسیرهای جداگانه‌ای دارند."
      }
    ],
    "date": "۱۲ مهر ۱۴۰۵",
    "image": "",
    "author": {
      "name": "نظراتو",
      "initial": "ن"
    }
  }
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
