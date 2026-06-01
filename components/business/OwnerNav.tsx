"use client";

/**
 * Owner-area navigation for the `(business)` route group.
 *
 * Mirrors `<ProfileNav />` but scoped to the owner shell: horizontal tab strip
 * on mobile, vertical sidebar on desktop. Active state matches `/business`
 * exactly so it doesn't also light up on `/business/reviews`.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { HIDE_SCROLL } from "@/components/ui/styles";

type Item = { href: string; label: string; icon: ReactNode; soon?: boolean };

function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 3v18h18" />
      <rect x="7" y="12" width="3" height="5" rx="0.5" />
      <rect x="12" y="8" width="3" height="9" rx="0.5" />
      <rect x="17" y="5" width="3" height="12" rx="0.5" />
    </svg>
  );
}
function IconStore() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M3 9v11h18V9" />
      <path d="M9 21V14h6v7" />
    </svg>
  );
}
function IconExternal() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 4h6v6" /><path d="M20 4L10 14" />
      <path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" />
    </svg>
  );
}

const items: Item[] = [
  { href: "/business", label: "نمای کلی", icon: <IconGrid /> },
  { href: "/business/reviews", label: "صندوق نظرات", icon: <IconChat /> },
  { href: "/business/insights", label: "آمار و تحلیل", icon: <IconChart /> },
  { href: "/business/profile", label: "ویرایش صفحه", icon: <IconStore /> },
];

const chipBase =
  "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-[0.85rem] font-semibold whitespace-nowrap transition-colors duration-200 lg:rounded-2xl [&_svg]:h-[18px] [&_svg]:w-[18px] [&_svg]:shrink-0 min-h-11";

interface OwnerNavProps {
  /** When the owner only has one business, link "مشاهده صفحه" straight to it. */
  publicHref?: string | null;
}

export function OwnerNav({ publicHref }: OwnerNavProps) {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="ناوبری پنل کسب‌وکار"
      className={`-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:p-0 ${HIDE_SCROLL}`}
    >
      {items.map((item) => {
        const active =
          item.href === "/business"
            ? pathname === "/business"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const disabled = item.soon && !active;
        return disabled ? (
          <span
            key={item.href}
            aria-disabled
            className={`${chipBase} cursor-not-allowed border-glass-border bg-glass text-muted opacity-60`}
            title="به‌زودی"
          >
            <span className="inline-flex">{item.icon}</span>
            {item.label}
            <span className="ms-1 rounded-full bg-glass-border px-1.5 py-0.5 text-[0.65rem] font-bold text-muted">
              به‌زودی
            </span>
          </span>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`${chipBase} ${
              active
                ? "border-mint/45 bg-mint/12 text-mint"
                : "border-glass-border bg-glass text-muted hover:text-strong"
            }`}
          >
            <span className="inline-flex">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}

      {publicHref ? (
        <Link
          href={publicHref}
          className={`${chipBase} border-lapis/30 bg-lapis/10 text-lapis hover:bg-lapis/15 lg:mt-2`}
        >
          <span className="inline-flex">
            <IconExternal />
          </span>
          مشاهده صفحه عمومی
        </Link>
      ) : null}
    </nav>
  );
}
