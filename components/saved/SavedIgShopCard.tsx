import Link from "next/link";
import { StarIcon } from "@/components/icons";
import { GLASS } from "@/components/ui/styles";
import type { InstagramShop } from "@/lib/data/instagram-shops";
import { BookmarkButton } from "@/components/ui/BookmarkButton";

type SavedIgShopCardProps = {
  shop: InstagramShop;
};

export function SavedIgShopCard({ shop: s }: SavedIgShopCardProps) {
  return (
    <div className="group relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-glass-border bg-glass/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia-500/40 hover:bg-glass-hover hover:shadow-[0_8px_30px_-4px_rgba(214,41,118,0.15)]">
      
      {/* Clickable Area */}
      <Link href={s.href} className="absolute inset-0 z-0 rounded-2xl" aria-label={`مشاهده پروفایل ${s.name}`} />

      {/* Main Info */}
      <div className="relative z-10 flex items-center gap-4 min-w-0">
        <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full bg-[conic-gradient(from_45deg,#feda75_0%,#fa7e1e_20%,#d62976_45%,#962fbf_70%,#4f5bd5_90%,#feda75_100%)] p-[3px] shadow-[0_6px_20px_rgba(214,41,118,0.3)] transition-transform duration-300 group-hover:scale-105 group-hover:rotate-[5deg]">
          <div
            className="flex h-full w-full items-center justify-center rounded-full border-[2.5px] border-[#0a0e18] text-[1.4rem] font-bold text-white shadow-inner"
            style={{ background: s.color }}
          >
            {s.initial}
          </div>
        </div>
        
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[1.05rem] font-bold text-strong transition-colors group-hover:text-fuchsia-400">
              {s.name}
            </span>
            <span
              className="inline-flex shrink-0 text-lapis drop-shadow-[0_0_6px_rgba(123,137,255,0.6)] [&>svg]:h-[15px] [&>svg]:w-[15px]"
              title="تایید شده"
            >
              <svg viewBox="0 0 14 14" aria-hidden>
                <path d="M7 .8l1.6 1.4 2.1-.2.6 2 1.9 1-.8 2 .8 2-1.9 1-.6 2-2.1-.2L7 13.2 5.4 11.8l-2.1.2-.6-2-1.9-1 .8-2-.8-2 1.9-1 .6-2 2.1.2z" fill="currentColor" />
                <path d="M4.4 7.1l1.9 1.8 3.3-3.6" fill="none" stroke="#06121f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
          
          <span className="text-[0.85rem] text-muted/90 ltr text-right opacity-90 truncate" dir="ltr">
            {s.handle}
          </span>
        </div>
      </div>

      {/* Stats & Actions */}
      <div className="relative z-10 flex items-center justify-between sm:justify-end gap-5 border-t border-glass-border/50 pt-3 sm:border-t-0 sm:pt-0 pl-1 sm:pl-0">
        <div className="flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1.5 backdrop-blur-sm">
          <StarIcon className="h-4 w-4 text-saffron drop-shadow-[0_0_6px_rgba(245,181,68,0.5)]" />
          <span className="text-[0.95rem] font-bold text-strong leading-none tracking-tight">
            {s.score}
          </span>
          <span className="text-[0.8rem] text-muted/90">
            ({s.reviews})
          </span>
        </div>

        {/* The remove bookmark button */}
        <div className="relative z-20 shrink-0">
          <BookmarkButton 
            businessSlug={s.slug} 
            initialIsBookmarked={true} 
            className="group/btn relative flex h-10 w-10 items-center justify-center rounded-xl border border-glass-border bg-glass transition-all hover:border-rose-500/40 hover:bg-rose-500/15"
          />
        </div>
      </div>
    </div>
  );
}
