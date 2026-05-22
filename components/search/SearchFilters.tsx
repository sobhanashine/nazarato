/**
 * Sidebar filters for `/search`. Every control is a plain `<Link>` — the page
 * is URL-driven, so a filter change is just a navigation. No client JS.
 *
 * Rendered twice by the page: inside a `<details>` accordion on mobile and a
 * sticky `<aside>` on desktop.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import {
  RATING_OPTIONS,
  searchHref,
  toggleCategory,
  type SearchQuery,
} from "@/lib/search";

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-2.5 text-[13px] font-bold text-strong">{title}</h3>
      <ul className="flex flex-col gap-0.5">{children}</ul>
    </div>
  );
}

const rowBase =
  "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13.5px] transition-colors";

/** A checkbox-style toggle row (square indicator). */
function CheckRow({
  active,
  label,
  href,
}: {
  active: boolean;
  label: string;
  href: string;
}) {
  return (
    <li>
      <Link
        href={href}
        scroll={false}
        className={`${rowBase} ${
          active ? "text-strong" : "text-muted hover:bg-glass hover:text-strong"
        }`}
      >
        <span
          aria-hidden
          className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors ${
            active
              ? "border-mint bg-mint text-[#06231b]"
              : "border-glass-border-hi"
          }`}
        >
          {active && (
            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
              <path
                d="M3.5 8.5l3 3 6-7"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        {label}
      </Link>
    </li>
  );
}

/** A radio-style choice row (round indicator) — used for single-pick rating. */
function RadioRow({
  active,
  label,
  href,
}: {
  active: boolean;
  label: string;
  href: string;
}) {
  return (
    <li>
      <Link
        href={href}
        scroll={false}
        aria-current={active ? "true" : undefined}
        className={`${rowBase} ${
          active ? "text-strong" : "text-muted hover:bg-glass hover:text-strong"
        }`}
      >
        <span
          aria-hidden
          className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors ${
            active ? "border-mint" : "border-glass-border-hi"
          }`}
        >
          {active && <span className="h-2.5 w-2.5 rounded-full bg-mint" />}
        </span>
        {label}
      </Link>
    </li>
  );
}

export function SearchFilters({
  query,
  categories,
}: {
  query: SearchQuery;
  categories: string[];
}) {
  // Categories don't apply to IG shops — hide the group on that tab.
  const showCategories = query.type !== "insta" && categories.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {showCategories && (
        <FilterGroup title="دسته‌بندی">
          {categories.map((c) => (
            <CheckRow
              key={c}
              active={query.categories.includes(c)}
              label={c}
              href={searchHref(query, {
                categories: toggleCategory(query.categories, c),
              })}
            />
          ))}
        </FilterGroup>
      )}

      <FilterGroup title="امتیاز">
        {RATING_OPTIONS.map((o) => (
          <RadioRow
            key={o.value}
            active={query.minRating === o.value}
            label={o.label}
            href={searchHref(query, { minRating: o.value })}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="فیلترهای دیگر">
        <CheckRow
          active={query.reviewedOnly}
          label="فقط دارای نظر"
          href={searchHref(query, { reviewedOnly: !query.reviewedOnly })}
        />
        <CheckRow
          active={query.verifiedOnly}
          label="فقط تأیید شده"
          href={searchHref(query, { verifiedOnly: !query.verifiedOnly })}
        />
      </FilterGroup>
    </div>
  );
}
