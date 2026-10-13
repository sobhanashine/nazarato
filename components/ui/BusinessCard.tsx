import Link from "next/link";
import { LocationIcon, ShieldCheckIcon, StarIcon } from "@/components/icons";
import type { Business } from "@/lib/data/businesses";
import { BookmarkButton } from "@/components/ui/BookmarkButton";

export function BusinessCard({ business: b, isBookmarked }: { business: Business; isBookmarked?: boolean }) {
  const hasReviews = b.score !== "—" && b.reviews !== "۰" && b.reviews !== "0";
  return (
    <article className="relative flex h-full min-w-0 items-start gap-2 rounded-xl border border-glass-border bg-paper transition-colors hover:border-glass-border-hi">
      <Link href={`/company/${b.slug}`} className="flex min-w-0 flex-1 items-start gap-3 p-4 sm:p-5">
        <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-mint/15 bg-mint/5 text-xl font-bold text-forest">{b.initial}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-base font-bold leading-7 text-strong">
            <span className="break-words">{b.name}</span>
            {b.verified && <ShieldCheckIcon className="h-4 w-4 shrink-0 text-forest" aria-label="کسب‌وکار تأیید شده" />}
          </span>
          <span className="mt-1 flex items-start gap-1 text-sm leading-6 text-muted">
            <LocationIcon className="mt-1 h-3.5 w-3.5 shrink-0" />
            <span>{b.category} · {b.city}</span>
          </span>
          {b.address && <span dir="auto" className="mt-1 block line-clamp-2 break-words text-sm leading-6 text-muted">{b.address}</span>}
          {hasReviews ? <span className="mt-2 flex items-center gap-1.5 text-sm text-strong">
            <StarIcon className="h-4 w-4 fill-saffron text-saffron" />
            <span className="font-bold tabular-nums">{b.score}</span>
            <span className="text-muted">از {b.reviews} تجربه</span>
          </span> : <span className="mt-2 block text-[13px] leading-6 text-muted">هنوز تجربه‌ای منتشر نشده</span>}
        </span>
        <span aria-hidden className="mt-1 text-lg text-forest">←</span>
      </Link>
      {typeof isBookmarked === "boolean" && <BookmarkButton businessSlug={b.slug} initialIsBookmarked={isBookmarked} className="my-3 me-2 h-11 w-11 shrink-0 text-forest" />}
    </article>
  );
}
