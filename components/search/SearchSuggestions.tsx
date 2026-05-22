/**
 * The live-typeahead dropdown panel — shared by the `/search` search box
 * (`SearchBox`) and the homepage hero (`HeroSearch`). Presentational only:
 * the parent owns the input state and decides when to render this.
 *
 * Lists every matching business — companies and Instagram shops alike.
 * Positioned `absolute` — the parent must be a positioned (`relative`) element.
 */

import Link from "next/link";
import { StarIcon } from "@/components/icons";
import type { SearchSuggestion } from "@/lib/search";

export function SearchSuggestions({
  suggestions,
}: {
  suggestions: SearchSuggestion[];
}) {
  return (
    <div
      onMouseDown={(e) => e.preventDefault()}
      className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-glass-border-hi bg-[#10141f] text-right shadow-[var(--shadow-lg)]"
    >
      {suggestions.length > 0 ? (
        <ul aria-label="کسب‌وکارهای پیشنهادی">
          {suggestions.map((s) => (
            <li key={`${s.href}-${s.name}`}>
              <Link
                href={s.href}
                className="flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-glass-hover"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[0.95rem] font-bold leading-none text-white"
                  style={{ background: s.color }}
                >
                  {s.initial}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-strong">
                    {s.name}
                  </span>
                  <span
                    dir="auto"
                    className="block truncate text-[11.5px] text-muted"
                  >
                    {s.meta}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1 text-[12px] font-bold text-strong [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:text-saffron">
                  <StarIcon />
                  <span className="tabular-nums">{s.score}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-3 text-[12.5px] leading-[1.7] text-muted">
          کسب‌وکاری با این نام نیست — برای جستجوی کامل Enter بزن.
        </p>
      )}
    </div>
  );
}
