"use client";

/**
 * Account-area navigation for the `(user)` route group.
 *
 * One component, two shapes: a horizontal scrolling tab strip on mobile and a
 * vertical sidebar on desktop (`lg:`). Active state is derived from the path —
 * `/profile` matches exactly so it doesn't also light up on `/profile/reviews`.
 * Ends with a sign-out action (a `<form>` so it works without JS).
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { logout } from "@/app/(user)/actions";
import { HIDE_SCROLL } from "@/components/ui/styles";

type Item = { href: string; label: string; icon: ReactNode };

function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function IconStar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3.5l2.7 5.5 6 .9-4.35 4.23 1.03 5.97L12 17.77 6.62 20.6l1.03-5.97L3.3 9.9l6-.9z" />
    </svg>
  );
}
function IconBookmark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
    </svg>
  );
}
function IconGear() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 13.5a7.8 7.8 0 0 0 0-3l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2.6-1.5L14 1h-4l-.4 2.5A7.6 7.6 0 0 0 7 5L4.6 4l-2 3.4 2 1.6a7.8 7.8 0 0 0 0 3l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2.6 1.5L10 23h4l.4-2.5a7.6 7.6 0 0 0 2.6-1.5l2.4 1 2-3.4z" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 17l-5-5 5-5" /><path d="M5 12h12" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

const items: Item[] = [
  { href: "/profile", label: "نمای کلی", icon: <IconGrid /> },
  { href: "/profile/reviews", label: "نظرات من", icon: <IconStar /> },
  { href: "/saved", label: "ذخیره‌شده‌ها", icon: <IconBookmark /> },
  { href: "/settings", label: "تنظیمات", icon: <IconGear /> },
];

/** Shared chip shape — colours are appended per state. */
const chipBase =
  "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-[0.85rem] font-semibold whitespace-nowrap transition-colors duration-200 lg:rounded-2xl [&_svg]:h-[18px] [&_svg]:w-[18px] [&_svg]:shrink-0";

interface ProfileNavProps {
  userRole?: string;
}

export function ProfileNav({ userRole }: ProfileNavProps) {
  const pathname = usePathname() ?? "";

  const navItems = [...items];
  if (userRole === "admin") {
    navItems.push({
      href: "/admin/moderation",
      label: "پنل مدیریت",
      icon: <IconShield />,
    });
  }

  return (
    <nav
      aria-label="ناوبری حساب کاربری"
      className={`-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:p-0 ${HIDE_SCROLL}`}
    >
      {navItems.map((item) => {
        const active =
          item.href === "/profile"
            ? pathname === "/profile"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
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

      <form action={logout} className="contents">
        <button
          type="submit"
          className={`${chipBase} border-rose-400/30 bg-rose-400/10 text-rose-300 hover:bg-rose-400/20 hover:text-rose-200 lg:mt-2`}
        >
          <span className="inline-flex">
            <IconLogout />
          </span>
          خروج از حساب
        </button>
      </form>
    </nav>
  );
}
