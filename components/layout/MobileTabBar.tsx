"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "کشف", icon: <><path d="m3 10 9-7 9 7v10H3z" /><path d="M9 20v-7h6v7" /></> },
  { href: "/search", label: "جستجو", icon: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></> },
  { href: "/about", label: "درباره", icon: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></> },
];

export function MobileTabBar() {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/login") || pathname === "/write-review" || pathname.endsWith("/write-review")) return null;
  return (
    <nav aria-label="ناوبری پایین" className="fixed inset-x-0 bottom-0 z-[200] border-t border-glass-border bg-paper pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="mx-auto grid h-16 max-w-lg grid-cols-3 px-3">
        {tabs.map(tab => {
          const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(`${tab.href}/`));
          return <Link key={tab.href} href={tab.href} aria-current={active ? "page" : undefined}
            className={`flex min-h-11 flex-col items-center justify-center gap-1 border-t-2 text-[12px] ${active ? "border-mint font-bold text-forest" : "border-transparent text-muted"}`}>
            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">{tab.icon}</svg>
            {tab.label}
          </Link>;
        })}
      </div>
    </nav>
  );
}
