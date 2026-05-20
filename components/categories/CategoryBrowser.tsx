"use client";

import { useMemo, useState } from "react";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { CloseIcon, SearchIcon } from "@/components/icons";
import { GLASS } from "@/components/ui/styles";
import { categories } from "@/lib/data/categories";

export function CategoryBrowser() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) => c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="relative">
      {/* Search Section */}
      <div className="mb-10 md:mb-14">
        <div className="relative mx-auto w-full max-w-2xl p-4 md:p-6 bg-glass border border-glass-border-hi rounded-glass shadow-[var(--shadow-sm)] backdrop-blur-[18px] backdrop-saturate-[160%]">
          <div className="relative group">
            <span
              className="absolute z-10 start-5 top-1/2 -translate-y-1/2 flex items-center text-mint pointer-events-none transition-transform duration-300 group-focus-within:scale-110"
              aria-hidden
            >
              <SearchIcon className="w-5 h-5" />
            </span>
            <input
              id="category-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی دسته‌بندی (مثلاً: پوشاک)..."
              className="w-full h-[58px] md:h-[64px] ps-14 pe-14 text-base md:text-[17px] font-medium text-strong placeholder:text-muted/60 bg-glass-strong/30 border border-glass-border rounded-2xl outline-none transition-all duration-300 focus:border-mint/60 focus:bg-glass-strong/50 focus:shadow-[0_0_0_5px_rgba(91,230,178,0.12)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="پاک کردن جستجو"
                className="absolute z-10 end-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-xl text-muted transition-all duration-200 hover:text-pomegr hover:bg-pomegr/10"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Popular Search Tags */}
          <div className="mt-4 flex flex-wrap items-center gap-2 px-1">
            <span className="text-[12px] font-semibold text-muted/80 ml-2">جستجوهای داغ:</span>
            {["پوشاک", "زیبایی", "خوراکی", "دیجیتال"].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setQuery(tag)}
                className="px-3 py-1.5 rounded-lg bg-glass-strong/40 border border-glass-border text-[12px] font-medium text-muted hover:text-mint hover:border-mint/30 hover:bg-mint/5 transition-all duration-200"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-[18px] font-bold text-strong mb-1">
            {query.trim() ? "نتایج جستجو" : "همه دسته‌بندی‌ها"}
          </h3>
          <p className="text-[13px] text-muted" aria-live="polite">
            نمایش {filtered.length} دسته‌بندی از مجموع {categories.length} مورد
          </p>
        </div>
        {query.trim() && (
          <button
            onClick={() => setQuery("")}
            className="text-[13px] font-medium text-mint hover:underline self-start md:self-center"
          >
            مشاهده همه دسته‌بندی‌ها
          </button>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {filtered.map((c) => (
            <CategoryCard key={c.href} category={c} compact />
          ))}
        </div>
      ) : (
        <div className={`${GLASS} flex flex-col items-center text-center py-14 px-6`}>
          <span className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-glass border border-glass-border text-muted [&_svg]:w-5 [&_svg]:h-5">
            <SearchIcon />
          </span>
          <p className="text-[15px] font-semibold text-strong mb-1.5">
            دسته‌بندی‌ای پیدا نشد
          </p>
          <p className="text-[13px] text-muted leading-[1.7]">
            عبارت دیگری امتحان کن یا جستجو را پاک کن.
          </p>
        </div>
      )}
    </div>
  );
}
