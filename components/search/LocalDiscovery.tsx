"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AREA_COOKIE, AREAS, parseArea, type SearchArea } from "@/lib/local-area";
import { searchHref, type SearchQuery } from "@/lib/search";
import { GLASS } from "@/components/ui/styles";

function rememberArea(area: SearchArea) {
  try {
    document.cookie = `${AREA_COOKIE}=${area}; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  } catch { /* Explicit links keep working when preference storage is disabled. */ }
}

export function LocalDiscovery({ query, categories, home = false }: { query: SearchQuery; categories: string[]; home?: boolean }) {
  const [area, setArea] = useState(query.area);
  const router = useRouter();
  const quickCategories = [...new Set(["کافه", ...categories])].slice(0, 8);
  return (
    <section aria-label="کشف محلی" className={`${GLASS} w-full ${home ? "max-w-[620px] p-4 text-start" : "mb-6 p-5 sm:p-6"}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[17px] font-extrabold text-strong">کسب‌وکارهای محدوده‌ات را پیدا کن</h2>
          <p className="mt-1 text-[13px] leading-7 text-muted">محدودهٔ شروع: رشت و گلسار؛ دسته را انتخاب کن و فهرست را ببین.</p>
        </div>
        <label className="flex shrink-0 items-center gap-3 text-[13px] text-muted">
          محدوده
          <select aria-label="محدودهٔ جستجو" value={area}
            className="min-h-11 rounded-xl border border-glass-border-hi bg-[#111725] px-3 py-2 text-[14px] text-strong focus:outline-2 focus:outline-mint"
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
      </div>
      <nav aria-label="دسته‌های این محدوده" className="mt-4 flex flex-wrap gap-2">
        {quickCategories.map(category => <Link key={category}
          href={searchHref(query, { area, q: "", type: "biz", categories: [category], minRating: 0, reviewedOnly: false, verifiedOnly: false })}
          onClick={() => rememberArea(area)}
          aria-current={query.categories.includes(category) ? "page" : undefined}
          className="inline-flex min-h-11 items-center rounded-full border border-mint/35 bg-mint/10 px-5 py-2 text-[14px] font-bold text-mint transition-colors hover:bg-mint/20 focus-visible:outline-2 focus-visible:outline-mint">
          {category}
        </Link>)}
      </nav>
    </section>
  );
}
