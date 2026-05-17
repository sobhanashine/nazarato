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
      <svg className="cat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
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
      <svg className="cat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4" />
      </svg>
    ),
  },
  {
    href: "/categories/education",
    title: "آموزش",
    desc: "موسسات آموزشی، دوره‌های آنلاین، مدارس و دانشگاه‌ها",
    icon: (
      <svg className="cat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 13.18v4L12 21l7-3.82v-4L12 17zM12 3 1 9l11 6 9-4.91V17h2V9z" />
      </svg>
    ),
  },
  {
    href: "/categories/health",
    title: "سلامت",
    desc: "خدمات درمانی، داروخانه‌ها، کلینیک‌ها و پزشکان متخصص",
    icon: (
      <svg className="cat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53z" />
      </svg>
    ),
  },
];
