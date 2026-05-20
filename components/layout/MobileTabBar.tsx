"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string; icon: React.ReactNode };

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}
function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function IconBookmark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}
function IconPen() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}

const tabs: Tab[] = [
  { href: "/", label: "خانه", icon: <IconHome /> },
  { href: "/categories", label: "دسته‌ها", icon: <IconGrid /> },
  { href: "/saved", label: "ذخیره", icon: <IconBookmark /> },
  { href: "/profile", label: "پروفایل", icon: <IconUser /> },
];

const tabItemClass =
  "flex flex-col items-center justify-center gap-0.5 py-2 transition-colors duration-200 rounded-[14px] relative [&_svg]:w-[22px] [&_svg]:h-[22px]";

// Active-tab indicator — the mint nub that drops from the bar's top edge.
const tabActive =
  "text-strong before:content-[''] before:absolute before:-top-2 before:left-1/2 before:-translate-x-1/2 before:w-[26px] before:h-[3px] before:bg-mint before:rounded-b-full before:shadow-[0_0_12px_rgba(91,230,178,0.7)]";

export function MobileTabBar() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[200] px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pointer-events-none md:hidden"
      aria-label="ناوبری پایین"
    >
      <div className="pointer-events-auto grid grid-cols-[1fr_1fr_auto_1fr_1fr] items-center gap-2 px-2 py-[0.4rem] bg-[rgba(10,13,22,0.7)] backdrop-blur-[24px] backdrop-saturate-[180%] border border-glass-border rounded-[22px] shadow-[0_-8px_30px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]">
        {tabs.slice(0, 2).map((t) => {
          const active = isActive(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`${tabItemClass} ${active ? tabActive : "text-muted"}`}
            >
              <span className="inline-flex" aria-hidden>{t.icon}</span>
              <span className="text-[10.5px] font-medium">{t.label}</span>
            </Link>
          );
        })}

        <Link
          href="/write-review"
          className="relative w-14 h-14 -mt-6 grid place-items-center rounded-full bg-[linear-gradient(135deg,#5BE6B2_0%,#7B89FF_100%)] text-[#06231b] shadow-[0_12px_30px_-6px_rgba(91,230,178,0.7),0_0_0_4px_rgba(10,13,22,0.8),inset_0_1px_0_rgba(255,255,255,0.45)] transition-[transform,filter] duration-200 active:scale-95 hover:brightness-105"
          aria-label="نوشتن نظر"
        >
          <span
            aria-hidden
            className="absolute inset-[-8px] rounded-full bg-[radial-gradient(circle,rgba(91,230,178,0.45),transparent_70%)] blur-[10px] z-[-1] pointer-events-none animate-[fab-pulse_2.6s_ease-in-out_infinite] motion-reduce:animate-none"
          />
          <span className="inline-flex [&_svg]:w-[22px] [&_svg]:h-[22px]" aria-hidden>
            <IconPen />
          </span>
        </Link>

        {tabs.slice(2).map((t) => {
          const active = isActive(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`${tabItemClass} ${active ? tabActive : "text-muted"}`}
            >
              <span className="inline-flex" aria-hidden>{t.icon}</span>
              <span className="text-[10.5px] font-medium">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
