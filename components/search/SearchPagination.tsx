/**
 * URL-driven pagination for `/search`. Server-rendered `<Link>`s — unlike the
 * blog's stateful client `Pagination`, page state lives entirely in the URL.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { searchHref, type SearchQuery } from "@/lib/search";

const cell =
  "h-10 min-w-10 px-2 rounded-full inline-flex items-center justify-center " +
  "text-[0.95rem] tabular-nums border transition-colors duration-200 [&_svg]:h-3.5 [&_svg]:w-3.5";
const idle =
  "border-glass-border bg-glass text-strong hover:border-mint/50 hover:text-mint hover:bg-glass-hover";
const current =
  "border-transparent font-bold text-[#06231b] " +
  "bg-[linear-gradient(135deg,#5BE6B2_0%,#3FBF92_100%)] " +
  "shadow-[0_6px_18px_-4px_rgba(91,230,178,0.55),inset_0_1px_0_rgba(255,255,255,0.45)]";
const disabled = "border-glass-border bg-glass text-muted opacity-40";

export function SearchPagination({
  query,
  page,
  totalPages,
}: {
  query: SearchQuery;
  page: number;
  totalPages: number;
}) {
  const fa = (n: number) => n.toLocaleString("fa-IR");
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  // RTL: "previous" sits on the right (ChevronRight), "next" on the left.
  const step = (target: number, label: string, icon: ReactNode, enabled: boolean) =>
    enabled ? (
      <Link
        href={searchHref(query, { page: target })}
        scroll={false}
        aria-label={label}
        className={`${cell} ${idle}`}
      >
        {icon}
      </Link>
    ) : (
      <span aria-hidden className={`${cell} ${disabled}`}>
        {icon}
      </span>
    );

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-2"
      aria-label="صفحه‌بندی نتایج"
    >
      {step(page - 1, "صفحه قبلی", <ChevronRightIcon />, page > 1)}

      {pages.map((p) =>
        p === page ? (
          <span
            key={p}
            aria-current="page"
            aria-label={`صفحه ${fa(p)}`}
            className={`${cell} ${current}`}
          >
            {fa(p)}
          </span>
        ) : (
          <Link
            key={p}
            href={searchHref(query, { page: p })}
            scroll={false}
            aria-label={`صفحه ${fa(p)}`}
            className={`${cell} ${idle}`}
          >
            {fa(p)}
          </Link>
        ),
      )}

      {step(page + 1, "صفحه بعدی", <ChevronLeftIcon />, page < totalPages)}
    </nav>
  );
}
