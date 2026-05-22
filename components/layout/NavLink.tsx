"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const base =
  "relative inline-flex items-center text-sm font-medium min-h-11 px-3 " +
  "transition-colors duration-200 hover:text-strong " +
  "after:content-[''] after:absolute after:bottom-1.5 after:left-1/2 after:-translate-x-1/2 " +
  "after:h-0.5 after:rounded-sm after:bg-mint after:shadow-[0_0_24px_rgba(91,230,178,0.35)] " +
  "after:transition-[width] after:duration-300 after:ease-[cubic-bezier(0.4,0,0.2,1)] " +
  "hover:after:w-[22px]";

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
    <Link
      href={href}
      className={`${base} ${
        isActive
          ? "text-strong font-semibold after:w-[22px]"
          : "text-muted after:w-0"
      }`}
    >
      {children}
    </Link>
  );
}
