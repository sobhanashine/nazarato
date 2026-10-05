"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AREA_COOKIE, AREAS, parseArea, type SearchArea } from "@/lib/local-area";
import { searchHref, type SearchQuery } from "@/lib/search";

function rememberArea(area: SearchArea) {
  try {
    document.cookie = `${AREA_COOKIE}=${area}; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  } catch { /* Explicit links still carry the selection when storage is disabled. */ }
}

export function LocalDiscovery({ query, categories, home = false, catalogStatus = "ready" }: {
  query: SearchQuery; categories: string[]; home?: boolean; catalogStatus?: "ready" | "unavailable";
}) {
  const [area, setArea] = useState(query.area);
  const router = useRouter();
  const quickCategories = [...new Set(categories)].slice(0, 8);
  return (
    <section aria-label="محدوده و نوع مکان" className={`w-full ${home ? "mt-4" : "mb-6 border-b border-glass-border pb-5"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-[13px] text-muted">
          محدوده
          <select aria-label="محدودهٔ جستجو" value={area} className="min-h-11 max-w-[205px] rounded-lg border border-glass-border bg-paper px-3 py-2 text-[16px] text-strong focus:outline-2 focus:outline-mint"
            onChange={event => {
              const next = parseArea(event.target.value);
              if (!next) return;
              setArea(next); rememberArea(next);
              if (home) router.refresh();
              else router.push(searchHref(query, { area: next }), { scroll: false });
            }}>
            {AREAS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        {home && <Link href={searchHref(query, { area, q: "", type: "biz" })} onClick={() => rememberArea(area)} className="inline-flex min-h-11 items-center text-[13px] font-semibold text-forest">دیدن فهرست <span aria-hidden className="ms-2">←</span></Link>}
      </div>
      {quickCategories.length > 0 && <nav aria-label="نوع مکان‌های موجود" className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {quickCategories.map(category => <Link key={category}
          href={searchHref(query, { area, q: "", type: "biz", categories: [category], minRating: 0, reviewedOnly: false, verifiedOnly: false })}
          onClick={() => rememberArea(area)} aria-current={query.categories.includes(category) ? "page" : undefined}
          className={`inline-flex min-h-11 items-center border-b-2 px-1 text-[14px] font-semibold ${query.categories.includes(category) ? "border-mint text-forest" : "border-transparent text-muted hover:text-forest"}`}>
          {category}
        </Link>)}
      </nav>}
      {catalogStatus === "unavailable" && <p role="status" className="mt-3 text-[13px] leading-6 text-pomegr">فهرست فعلاً در دسترس نیست. کمی بعد دوباره امتحان کن.</p>}
    </section>
  );
}
