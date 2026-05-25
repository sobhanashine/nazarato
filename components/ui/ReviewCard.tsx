/**
 * A single user review as a glass card.
 * Lifted from the inline `<article>` in `RecentReviews.tsx` — see pages-master.md §5.2.
 * Used on `/reviews`, `/company/[slug]/reviews`, `/profile/reviews`, `/users/[username]`.
 */

import Link from "next/link";
import { RatingStars } from "@/components/ui/RatingStars";
import type { Review } from "@/lib/data/reviews";
import { HelpfulButton } from "@/components/ui/HelpfulButton";

// Soft diagonal gradient surface — was `.review-card` (overrode `.glass`).
const reviewCard =
  "relative border border-glass-border rounded-glass backdrop-blur-[18px] backdrop-saturate-[160%] " +
  "bg-[linear-gradient(155deg,rgba(123,137,255,0.07)_0%,rgba(255,255,255,0.035)_38%,rgba(91,230,178,0.045)_100%),linear-gradient(180deg,rgba(20,26,42,0.55),rgba(12,16,28,0.55))] " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.06),-22px_22px_40px_-18px_rgba(0,0,0,0.55),-12px_12px_24px_-14px_rgba(91,230,178,0.10)] " +
  "hover:bg-[linear-gradient(155deg,rgba(123,137,255,0.10)_0%,rgba(255,255,255,0.05)_38%,rgba(91,230,178,0.07)_100%),linear-gradient(180deg,rgba(24,30,48,0.6),rgba(14,18,32,0.6))] " +
  "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),-28px_28px_50px_-20px_rgba(0,0,0,0.6),-14px_14px_28px_-14px_rgba(91,230,178,0.16)]";

export function ReviewCard({ review }: { review: Review }) {
  const r = review;
  return (
    <article
      className={`${reviewCard} flex flex-col gap-[0.85rem] p-3.5 sm:p-6 transition-[transform,background,border-color,box-shadow] duration-300 min-w-0 h-full hover:-translate-y-[3px] hover:border-glass-border-hi`}
    >
      <div className="flex flex-row items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link
            href={`/users/${r.user.username || r.user.id}`}
            className="relative w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold shrink-0 shadow-[0_6px_18px_-4px_rgba(0,0,0,0.45),0_0_24px_-4px_var(--avatar-glow,rgba(255,122,142,0.35))] hover:scale-105 transition-transform duration-200 cursor-pointer"
            style={{ background: r.user.color, ["--avatar-glow" as string]: r.user.color }}
          >
            {r.user.initial}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-mint text-[#06231b] grid place-items-center shadow-[0_0_0_2px_#161e27,0_0_10px_rgba(91,230,178,0.7)]"
              aria-label="کاربر تایید شده"
              title="کاربر تایید شده"
            >
              <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" aria-hidden>
                <path d="M2.5 6.2l2.4 2.3 4.6-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/users/${r.user.username || r.user.id}`}
                className="text-[0.95rem] font-semibold text-strong whitespace-nowrap overflow-hidden text-ellipsis hover:text-mint transition-colors cursor-pointer"
              >
                {r.user.name}
              </Link>
              {r.verified && (
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-mint/35 bg-mint/10 px-2 py-0.5 text-[0.68rem] font-bold text-mint shrink-0 shadow-[0_0_10px_rgba(91,230,178,0.2)]"
                  title="نقد تأییدشده با مدرک خرید"
                >
                  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  نقد تأییدشده
                </span>
              )}
            </div>
            <Link
              href={r.shop.href}
              className="text-[0.8rem] text-mint font-medium whitespace-nowrap overflow-hidden text-ellipsis block mt-[2px]"
            >
              {r.shop.name}
            </Link>
          </div>
        </div>
        <RatingStars rating={r.rating} />
      </div>
      <p className="text-[0.88rem] leading-[1.8] text-strong opacity-[0.86] line-clamp-3 min-h-[calc(0.88rem*1.8*3)] flex-1">
        {r.text}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 pt-3 border-t border-glass-border mt-auto">
        <span className="tabular-nums text-[0.75rem] text-muted whitespace-nowrap shrink-0">
          {r.date}
        </span>
        <div className="inline-flex items-center gap-1 sm:gap-1.5 shrink-0 min-w-0">
          <HelpfulButton
            reviewId={r.id}
            initialCount={r.helpful_count || 0}
            initialVoted={r.has_voted || false}
          />
        </div>
      </div>
    </article>
  );
}
