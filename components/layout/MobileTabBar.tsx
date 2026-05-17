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

export function MobileTabBar() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="tab-bar" aria-label="ناوبری پایین">
      <div className="tab-bar-inner">
        {tabs.slice(0, 2).map((t) => (
          <Link key={t.href} href={t.href} className={`tab-item${isActive(t.href) ? " is-active" : ""}`}>
            <span className="tab-ico" aria-hidden>{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </Link>
        ))}

        <Link href="/write-review" className="tab-fab" aria-label="نوشتن نظر">
          <span className="tab-fab-glow" aria-hidden />
          <span className="tab-fab-ico" aria-hidden><IconPen /></span>
        </Link>

        {tabs.slice(2).map((t) => (
          <Link key={t.href} href={t.href} className={`tab-item${isActive(t.href) ? " is-active" : ""}`}>
            <span className="tab-ico" aria-hidden>{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
