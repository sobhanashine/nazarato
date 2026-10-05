"use client";

/**
 * The one interactive control on `/search` — a native `<select>` that
 * navigates to a new sort URL on change. Everything else (tabs, filters,
 * chips, pagination) is a plain server-rendered `<Link>`.
 */

import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";
import {
  SORT_OPTIONS,
  searchHref,
  type SearchQuery,
  type SortKey,
} from "@/lib/search";

export function SortSelect({ query }: { query: SearchQuery }) {
  const router = useRouter();

  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted">
      <span className="whitespace-nowrap">مرتب‌سازی:</span>
      <span className="relative">
        <select
          value={query.sort}
          onChange={(e) =>
            router.push(searchHref(query, { sort: e.target.value as SortKey }))
          }
          className="min-h-11 appearance-none cursor-pointer rounded-lg border border-glass-border bg-paper py-2 ps-3 pe-8 text-base font-medium text-strong transition-colors hover:border-mint/40 focus-visible:border-mint"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronLeftIcon
          aria-hidden
          className="pointer-events-none absolute end-2.5 top-1/2 h-3 w-3 -translate-y-1/2 -rotate-90 text-muted"
        />
      </span>
    </label>
  );
}
