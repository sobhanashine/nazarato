/**
 * A registered business as a horizontal glass card.
 * New for pages-master.md §5.2 — used on `/search`, `/categories/[slug]`,
 * `/saved`, `/admin/businesses`. Links to `/company/[slug]`.
 *
 * `score` is an average (e.g. "۴.۲"), so it renders as a numeral next to a
 * single star rather than as `<RatingStars />`, which only takes whole ratings.
 */

import Link from "next/link";
import { LocationIcon, ShieldCheckIcon, StarIcon } from "@/components/icons";
import { GLASS } from "@/components/ui/styles";
import type { Business } from "@/lib/data/businesses";

export function BusinessCard({ business }: { business: Business }) {
  const b = business;
  return (
    <Link
      href={`/company/${b.slug}`}
      className={`${GLASS} flex items-center gap-4 px-[1.35rem] py-5 cursor-pointer transition-[transform,background,border-color] duration-300 ease-out hover:bg-glass-hover hover:border-glass-border-hi hover:-translate-y-[2px]`}
    >
      <div
        className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center text-white text-[1.3rem] font-bold leading-none shrink-0 shadow-[0_6px_18px_-4px_rgba(0,0,0,0.45)]"
        style={{ background: b.color }}
      >
        {b.initial}
      </div>
      <div className="min-w-0 flex flex-col gap-[3px]">
        <span className="inline-flex items-center gap-1.5 text-[0.95rem] font-semibold text-strong whitespace-nowrap overflow-hidden text-ellipsis">
          {b.name}
          {b.verified && (
            <span
              className="inline-flex w-[14px] h-[14px] text-mint [filter:drop-shadow(0_0_6px_rgba(91,230,178,0.55))] shrink-0 [&_svg]:w-[14px] [&_svg]:h-[14px]"
              aria-label="کسب‌وکار تایید شده"
              title="تایید شده"
            >
              <ShieldCheckIcon />
            </span>
          )}
        </span>
        <span className="inline-flex items-center gap-1 text-[0.8rem] text-muted whitespace-nowrap overflow-hidden text-ellipsis [&>svg]:w-[12px] [&>svg]:h-[12px] [&>svg]:shrink-0 [&>svg]:opacity-80">
          <LocationIcon />
          {b.category} · {b.city}
        </span>
        <div className="flex items-center gap-1.5 mt-[2px] [&>svg]:w-[14px] [&>svg]:h-[14px] [&>svg]:text-saffron [&>svg]:shrink-0 [&>svg]:[fill:currentColor] [&>svg]:[filter:drop-shadow(0_0_4px_rgba(245,181,68,0.45))]">
          <StarIcon />
          <span className="tabular-nums text-[0.9rem] font-bold text-strong leading-none">
            {b.score}
          </span>
          <span className="tabular-nums text-[0.78rem] text-muted font-normal not-italic">
            ({b.reviews} نظر)
          </span>
        </div>
      </div>
    </Link>
  );
}
