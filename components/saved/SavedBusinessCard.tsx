import Link from "next/link";
import { LocationIcon, ShieldCheckIcon, StarIcon } from "@/components/icons";
import { GLASS } from "@/components/ui/styles";
import type { Business } from "@/lib/data/businesses";
import { BookmarkButton } from "@/components/ui/BookmarkButton";

type SavedBusinessCardProps = {
  business: Business;
};

export function SavedBusinessCard({ business: b }: SavedBusinessCardProps) {
  return (
    <div className="group relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-glass-border bg-glass/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-mint/40 hover:bg-glass-hover hover:shadow-[0_8px_30px_-4px_rgba(91,230,178,0.15)]">
      
      {/* Clickable Area covering the whole card except the explicit buttons */}
      <Link href={`/company/${b.slug}`} className="absolute inset-0 z-0 rounded-2xl" aria-label={`مشاهده پروفایل ${b.name}`} />

      {/* Main Info */}
      <div className="relative z-10 flex items-center gap-4 min-w-0">
        <div
          className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-[18px] text-[1.4rem] font-bold text-white shadow-inner transition-transform duration-300 group-hover:scale-105"
          style={{ 
            background: `linear-gradient(135deg, ${b.color}dd 0%, ${b.color} 100%)`,
            boxShadow: `0 8px 24px -6px ${b.color}80, inset 0 2px 4px rgba(255,255,255,0.2)`
          }}
        >
          {b.initial}
        </div>
        
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[1.05rem] font-bold text-strong transition-colors group-hover:text-mint">
              {b.name}
            </span>
            {b.verified && (
              <span
                className="inline-flex shrink-0 text-mint drop-shadow-[0_0_8px_rgba(91,230,178,0.6)] [&>svg]:h-[15px] [&>svg]:w-[15px]"
                title="تایید شده"
              >
                <ShieldCheckIcon />
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-[0.82rem] text-muted opacity-90">
            <span className="inline-flex items-center gap-1 [&>svg]:h-[13px] [&>svg]:w-[13px] [&>svg]:opacity-80">
              <LocationIcon />
              {b.category} · {b.city}
            </span>
          </div>
        </div>
      </div>

      {/* Stats & Actions */}
      <div className="relative z-10 flex items-center justify-between sm:justify-end gap-5 border-t border-glass-border/50 pt-3 sm:border-t-0 sm:pt-0 pl-1 sm:pl-0">
        <div className="flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1.5 backdrop-blur-sm">
          <StarIcon className="h-4 w-4 text-saffron drop-shadow-[0_0_6px_rgba(245,181,68,0.5)]" />
          <span className="text-[0.95rem] font-bold text-strong leading-none tracking-tight">
            {b.score}
          </span>
          <span className="text-[0.8rem] text-muted/90">
            ({b.reviews})
          </span>
        </div>

        {/* The remove bookmark button */}
        <div className="relative z-20 shrink-0">
          <BookmarkButton 
            businessSlug={b.slug} 
            initialIsBookmarked={true} 
            className="group/btn relative flex h-10 w-10 items-center justify-center rounded-xl border border-glass-border bg-glass transition-all hover:border-rose-500/40 hover:bg-rose-500/15"
          />
        </div>
      </div>
    </div>
  );
}
