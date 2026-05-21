/**
 * An Instagram shop as a horizontal glass card with the IG gradient ring.
 * Lifted from the inline `<Link>` in `InstagramShops.tsx` — see pages-master.md §5.2.
 * Used on `/instagram-shops`, `/shop/[handle]`, `/saved`.
 */

import Link from "next/link";
import { StarIcon } from "@/components/icons";
import { GLASS } from "@/components/ui/styles";
import type { InstagramShop } from "@/lib/data/instagram-shops";

export function IgShopCard({ shop }: { shop: InstagramShop }) {
  const s = shop;
  return (
    <Link
      href={s.href}
      className={`${GLASS} flex items-center gap-4 px-[1.35rem] py-5 cursor-pointer transition-[transform,background,border-color] duration-300 ease-out hover:bg-glass-hover hover:border-glass-border-hi hover:-translate-y-[2px]`}
    >
      <div className="w-[60px] h-[60px] rounded-full p-[3px] [background:conic-gradient(from_45deg,#feda75_0%,#fa7e1e_20%,#d62976_45%,#962fbf_70%,#4f5bd5_90%,#feda75_100%)] flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(214,41,118,0.35)]">
        <div
          className="w-full h-full rounded-full border-[2.5px] border-[#0a0e18] flex items-center justify-center text-white text-[1.2rem] font-bold leading-none"
          style={{ background: s.color }}
        >
          {s.initial}
        </div>
      </div>
      <div className="min-w-0 flex flex-col gap-[3px]">
        <span className="inline-flex items-center gap-1.5 text-[0.95rem] font-semibold text-strong whitespace-nowrap overflow-hidden text-ellipsis">
          {s.name}
          <span
            className="inline-flex w-[14px] h-[14px] text-lapis [filter:drop-shadow(0_0_6px_rgba(123,137,255,0.55))] shrink-0 [&_svg]:w-[14px] [&_svg]:h-[14px]"
            aria-label="فروشگاه تایید شده"
            title="تایید شده"
          >
            <svg viewBox="0 0 14 14" aria-hidden>
              <path d="M7 .8l1.6 1.4 2.1-.2.6 2 1.9 1-.8 2 .8 2-1.9 1-.6 2-2.1-.2L7 13.2 5.4 11.8l-2.1.2-.6-2-1.9-1 .8-2-.8-2 1.9-1 .6-2 2.1.2z" fill="currentColor" />
              <path d="M4.4 7.1l1.9 1.8 3.3-3.6" fill="none" stroke="#06121f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </span>
        <span className="text-[0.8rem] text-muted ltr text-right whitespace-nowrap overflow-hidden text-ellipsis opacity-90" dir="ltr">
          {s.handle}
        </span>
        <div className="flex items-center gap-1.5 mt-[2px] [&>svg]:w-[14px] [&>svg]:h-[14px] [&>svg]:text-saffron [&>svg]:shrink-0 [&>svg]:[fill:currentColor] [&>svg]:[filter:drop-shadow(0_0_4px_rgba(245,181,68,0.45))]">
          <StarIcon />
          <span className="tabular-nums text-[0.9rem] font-bold text-strong leading-none">
            {s.score}
          </span>
          <span className="tabular-nums text-[0.78rem] text-muted font-normal not-italic">
            ({s.reviews} نظر)
          </span>
        </div>
      </div>
    </Link>
  );
}
