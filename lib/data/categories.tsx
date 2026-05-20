import type { ReactNode } from "react";

export type Category = {
  href: string;
  title: string;
  desc: string;
  icon: ReactNode;
};

export const categories: Category[] = [
  {
    href: "/categories/technology",
    title: "فناوری",
    desc: "شرکت‌های فناوری اطلاعات، استارتاپ‌های ایرانی و پلتفرم‌های دیجیتال",
    icon: (
      <svg className="relative z-[2] w-8 h-8 text-mint [filter:drop-shadow(0_0_8px_rgba(91,230,178,0.5))]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
        <path d="M14.763.075A.5.5 0 0 1 15 .5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V14h-1v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V10a.5.5 0 0 1 .342-.474L6 7.64V4.5a.5.5 0 0 1 .276-.447l8-4a.5.5 0 0 1 .487.022M6 8.694 1 10.36V15h5zM7 15h2v-1.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5V15h2V1.309l-7 3.5z" />
        <path d="M2 11h1v1H2zm2 0h1v1H4zm-2 2h1v1H2zm2 0h1v1H4zm4-4h1v1H8zm2 0h1v1h-1zm-2 2h1v1H8zm2 0h1v1h-1zm2-2h1v1h-1zm0 2h1v1h-1zM8 7h1v1H8zm2 0h1v1h-1zm2 0h1v1h-1zM8 5h1v1H8zm2 0h1v1h-1zm2 0h1v1h-1zm0-2h1v1h-1z" />
      </svg>
    ),
  },
  {
    href: "/categories/restaurant",
    title: "رستوران",
    desc: "بهترین رستوران‌ها، کافه‌ها، فست‌فودها و تجربه‌های غذایی",
    icon: (
      <svg className="relative z-[2] w-8 h-8 text-mint [filter:drop-shadow(0_0_8px_rgba(91,230,178,0.5))]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4" />
      </svg>
    ),
  },
  {
    href: "/categories/education",
    title: "آموزش",
    desc: "موسسات آموزشی، دوره‌های آنلاین، مدارس و دانشگاه‌ها",
    icon: (
      <svg className="relative z-[2] w-8 h-8 text-mint [filter:drop-shadow(0_0_8px_rgba(91,230,178,0.5))]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 13.18v4L12 21l7-3.82v-4L12 17zM12 3 1 9l11 6 9-4.91V17h2V9z" />
      </svg>
    ),
  },
  {
    href: "/categories/health",
    title: "سلامت",
    desc: "خدمات درمانی، داروخانه‌ها، کلینیک‌ها و پزشکان متخصص",
    icon: (
      <svg className="relative z-[2] w-8 h-8 text-mint [filter:drop-shadow(0_0_8px_rgba(91,230,178,0.5))]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53z" />
      </svg>
    ),
  },
  {
    href: "/categories/shopping",
    title: "خرید و فروشگاه",
    desc: "فروشگاه‌های آنلاین، بازارها و برندهای پوشاک و کالای ایرانی",
    icon: (
      <svg className="relative z-[2] w-8 h-8 text-mint [filter:drop-shadow(0_0_8px_rgba(91,230,178,0.5))]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49L19.13 5H6.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
      </svg>
    ),
  },
  {
    href: "/categories/finance",
    title: "خدمات مالی",
    desc: "بانک‌ها، بیمه، صرافی‌ها و سرویس‌های پرداخت و سرمایه‌گذاری",
    icon: (
      <svg className="relative z-[2] w-8 h-8 text-mint [filter:drop-shadow(0_0_8px_rgba(91,230,178,0.5))]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
      </svg>
    ),
  },
  {
    href: "/categories/travel",
    title: "سفر و گردشگری",
    desc: "آژانس‌های مسافرتی، هتل‌ها، تورها و رزرو بلیت و اقامتگاه",
    icon: (
      <svg className="relative z-[2] w-8 h-8 text-mint [filter:drop-shadow(0_0_8px_rgba(91,230,178,0.5))]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
      </svg>
    ),
  },
  {
    href: "/categories/beauty",
    title: "زیبایی و آرایش",
    desc: "سالن‌های زیبایی، آرایشگاه‌ها، کلینیک‌های پوست و برندهای آرایشی",
    icon: (
      <svg className="relative z-[2] w-8 h-8 text-mint [filter:drop-shadow(0_0_8px_rgba(91,230,178,0.5))]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z" />
      </svg>
    ),
  },
  {
    href: "/categories/automotive",
    title: "خودرو",
    desc: "نمایشگاه‌ها، تعمیرگاه‌ها، خدمات خودرو و قطعات یدکی",
    icon: (
      <svg className="relative z-[2] w-8 h-8 text-mint [filter:drop-shadow(0_0_8px_rgba(91,230,178,0.5))]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
      </svg>
    ),
  },
  {
    href: "/categories/sports",
    title: "ورزش و تناسب اندام",
    desc: "باشگاه‌های ورزشی، استخرها، فروشگاه‌های ورزشی و مربیان",
    icon: (
      <svg className="relative z-[2] w-8 h-8 text-mint [filter:drop-shadow(0_0_8px_rgba(91,230,178,0.5))]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L23 16.29z" />
      </svg>
    ),
  },
  {
    href: "/categories/entertainment",
    title: "سرگرمی",
    desc: "سینماها، کافه‌بازی‌ها، شهربازی‌ها و مراکز تفریحی",
    icon: (
      <svg className="relative z-[2] w-8 h-8 text-mint [filter:drop-shadow(0_0_8px_rgba(91,230,178,0.5))]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
      </svg>
    ),
  },
  {
    href: "/categories/real-estate",
    title: "املاک",
    desc: "آژانس‌های املاک، خرید و فروش و اجاره مسکن و دفاتر مشاور",
    icon: (
      <svg className="relative z-[2] w-8 h-8 text-mint [filter:drop-shadow(0_0_8px_rgba(91,230,178,0.5))]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
];
