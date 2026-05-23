"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";
import { reviewsHref } from "./href";

export function ReviewsSortSelect({
  rating,
  category,
  ig,
  sort,
}: {
  rating: number;
  category: string;
  ig: boolean;
  sort: string;
}) {
  const router = useRouter();

  return (
    <label className="inline-flex items-center gap-2 text-[13px] text-muted">
      <span className="whitespace-nowrap">مرتب‌سازی:</span>
      <span className="relative">
        <select
          value={sort}
          onChange={(e) =>
            router.push(reviewsHref({ rating, category, ig, sort: e.target.value, page: 1 }))
          }
          className="appearance-none cursor-pointer rounded-xl border border-glass-border bg-[#10141f] py-2 ps-3 pe-8 text-[13px] font-medium text-strong outline-none transition-colors hover:border-mint/40 focus-visible:border-mint/60"
        >
          <option value="newest" className="bg-[#10141f] text-strong">جدیدترین</option>
          <option value="helpful" className="bg-[#10141f] text-strong">مفیدترین</option>
          <option value="controversial" className="bg-[#10141f] text-strong">بحث‌برانگیزترین</option>
        </select>
        <ChevronLeftIcon
          aria-hidden
          className="pointer-events-none absolute end-2.5 top-1/2 h-3 w-3 -translate-y-1/2 -rotate-90 text-muted"
        />
      </span>
    </label>
  );
}
