"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LocationIcon, SearchIcon, StarIcon } from "@/components/icons";
import { GLASS } from "@/components/ui/styles";
import type { Business } from "@/lib/data/businesses";

/**
 * Business picker for `/write-review`.
 *
 * The full business list arrives from the server; filtering is client-side —
 * the dataset is small fixture data, so an instant local `includes` match
 * beats a round-trip. Each result links to `/company/[slug]/write-review`,
 * where the actual form lives.
 */
export function WriteReviewPicker({
  businesses,
}: {
  businesses: Business[];
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return businesses;
    return businesses.filter((b) =>
      `${b.name} ${b.category} ${b.city}`.toLowerCase().includes(q),
    );
  }, [q, businesses]);

  return (
    <div className={`${GLASS} p-6 sm:p-8`}>
      <h1 className="text-[1.4rem] font-black tracking-tight text-strong">
        کدوم کسب‌وکار را نقد می‌کنی؟
      </h1>
      <p className="mt-2 text-[14px] leading-[1.9] text-muted">
        نام فروشگاه یا شرکت را جست‌وجو کن، انتخابش کن و تجربه‌ات را بنویس.
      </p>

      <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-glass-border bg-white/[0.03] px-3.5 backdrop-blur-md transition-colors focus-within:border-mint focus-within:bg-mint/[0.06]">
        <span className="text-muted [&_svg]:h-[18px] [&_svg]:w-[18px]" aria-hidden>
          <SearchIcon />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="مثلاً: دیجی‌کالا"
          aria-label="جست‌وجوی کسب‌وکار"
          autoFocus
          className="w-full bg-transparent py-3.5 text-[16px] text-white placeholder:text-white/25 outline-none [&::-webkit-search-cancel-button]:appearance-none"
        />
      </div>

      <p className="mt-5 text-[12px] font-bold text-muted">
        {q
          ? `${results.length.toLocaleString("fa-IR")} نتیجه`
          : "پیشنهادها"}
      </p>

      {results.length > 0 ? (
        <ul className="mt-2.5 flex flex-col gap-2">
          {results.map((b) => (
            <li key={b.slug}>
              <Link
                href={`/company/${b.slug}/write-review`}
                className="group flex items-center gap-3.5 rounded-xl border border-glass-border bg-white/[0.02] p-3 transition-colors hover:border-mint/40 hover:bg-mint/[0.06]"
              >
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-[1.1rem] font-bold text-white"
                  style={{ background: b.color }}
                  aria-hidden
                >
                  {b.initial}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-[0.95rem] font-bold text-strong">
                    {b.name}
                  </span>
                  <span className="flex items-center gap-2.5 text-[0.78rem] text-muted">
                    <span className="inline-flex items-center gap-1 [&_svg]:h-3 [&_svg]:w-3 [&_svg]:opacity-80">
                      <LocationIcon />
                      {b.category} · {b.city}
                    </span>
                    <span className="inline-flex items-center gap-1 [&_svg]:h-3 [&_svg]:w-3 [&_svg]:text-saffron [&_svg]:[fill:currentColor]">
                      <StarIcon />
                      {b.score}
                    </span>
                  </span>
                </span>
                <span
                  aria-hidden
                  className="shrink-0 text-[1.1rem] text-muted transition-[color,transform] duration-200 group-hover:-translate-x-1 group-hover:text-mint"
                >
                  ←
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-2.5 rounded-xl border border-dashed border-glass-border bg-white/[0.02] px-4 py-8 text-center">
          <p className="text-[0.92rem] font-bold text-strong">
            کسب‌وکاری پیدا نشد
          </p>
          <p className="mt-1.5 text-[13px] leading-[1.9] text-muted">
            با نام «{query.trim()}» نتیجه‌ای نبود — املای دیگری را امتحان کن.
          </p>
        </div>
      )}
    </div>
  );
}
