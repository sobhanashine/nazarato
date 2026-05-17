"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({
  href,
  matchPrefix,
  children,
}: {
  href: string;
  matchPrefix?: string;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const prefix = matchPrefix ?? href;
  const isActive = pathname === prefix || pathname.startsWith(`${prefix}/`);

  return (
    <Link href={href} className={`nav-link${isActive ? " active-link" : ""}`}>
      {children}
    </Link>
  );
}
