"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({ href, matchPrefix, children }: { href: string; matchPrefix?: string; children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const prefix = matchPrefix ?? href;
  const active = pathname === prefix || (prefix !== "/" && pathname.startsWith(`${prefix}/`));
  return (
    <Link href={href} aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-11 items-center border-b-2 px-2 text-[14px] transition-colors duration-150 hover:text-forest ${active ? "border-mint font-bold text-forest" : "border-transparent text-muted"}`}>
      {children}
    </Link>
  );
}
