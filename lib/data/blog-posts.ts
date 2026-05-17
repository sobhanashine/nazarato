export type BlogPost = {
  href: string;
  date: string;
  title: string;
  excerpt: string;
  image: string;
};

export const blogPosts: BlogPost[] = [
  { href: "/blog/1", date: "۱۲ اردیبهشت ۱۴۰۳", title: "چطور بهترین کسب‌وکار را انتخاب کنیم", excerpt: "راهنمایی برای انتخاب هوشمندانه‌تر بر اساس نظرات واقعی مشتریان", image: "/images/real-images/blog-image.png" },
  { href: "/blog/2", date: "۸ اردیبهشت ۱۴۰۳", title: "راهنمای کامل خواندن نظرات آنلاین", excerpt: "نکاتی که پیش از اعتماد به نظرات آنلاین باید بدانید", image: "/images/real-images/blog-image.png" },
  { href: "/blog/3", date: "۳ اردیبهشت ۱۴۰۳", title: "اهمیت نظرات مشتریان در دنیای دیجیتال", excerpt: "چرا نظرات کاربران برای رشد کسب‌وکارها حیاتی است", image: "/images/real-images/blog-image.png" },
  { href: "/blog/4", date: "۲۸ فروردین ۱۴۰۳", title: "بهترین برندهای ایرانی در سال ۱۴۰۳", excerpt: "معرفی برترین برندهای داخلی بر اساس رضایت مشتریان", image: "/images/real-images/blog-image.png" },
];
