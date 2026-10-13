import Link from "next/link";
import { RatingStars } from "@/components/ui/RatingStars";
import { HelpfulButton } from "@/components/ui/HelpfulButton";
import { GLASS } from "@/components/ui/styles";
import type { Review } from "@/lib/data/reviews";

export function ReviewCard({ review: r }: { review: Review }) {
  return (
    <article id={`review-${r.id}`} className={`${GLASS} flex h-full min-w-0 scroll-mt-24 flex-col p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mint/5 text-lg font-bold text-forest">{r.user.initial}</span>
          <div className="min-w-0">
            {r.user.id !== "unknown" && !r.user.id.startsWith("mock") && !r.user.id.startsWith("user-mock") ? <Link href={`/users/${r.user.username || r.user.id}`} className="inline-flex min-h-11 items-center break-words text-base font-bold text-strong hover:text-forest">{r.user.name}</Link> : <span className="text-base font-bold text-strong">{r.user.name}</span>}
            <Link href={r.shop.href} className="block break-words text-sm leading-6 text-forest">{r.shop.name}</Link>
          </div>
        </div>
        <div className="pt-3"><RatingStars rating={r.rating} /></div>
      </div>
      {r.verified && <p className="mt-3 text-xs font-semibold text-forest">تجربهٔ تأییدشده با مدرک</p>}
      <p className="my-4 flex-1 whitespace-pre-wrap break-words text-base leading-8 text-strong">{r.text}</p>
      {r.owner_response && <div className="mb-4 border-s-2 border-forest bg-mint/5 p-3"><p className="text-sm font-semibold text-forest">پاسخ {r.owner_response.business.name}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-strong">{r.owner_response.body}</p><p className="mt-2 text-xs text-muted">{r.owner_response.date}</p></div>}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-glass-border pt-3">
        <span className="text-[13px] tabular-nums text-muted">{r.date}</span>
        <HelpfulButton reviewId={r.id} initialCount={r.helpful_count || 0} initialVoted={r.has_voted || false} />
      </div>
    </article>
  );
}
