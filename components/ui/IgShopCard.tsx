import Link from "next/link";
import { ShieldCheckIcon, StarIcon } from "@/components/icons";
import { BookmarkButton } from "@/components/ui/BookmarkButton";
import { IgAvatar } from "@/components/ui/IgAvatar";
import type { InstagramShop } from "@/lib/data/instagram-shops";

type IgShopCardProps = {
  shop: InstagramShop;
  isBookmarked?: boolean;
};

export function IgShopCard({ shop, isBookmarked }: IgShopCardProps) {
  const hasReviews = shop.score !== "—" && shop.reviews !== "۰" && shop.reviews !== "0";
  return (
    <article className="flex h-full min-w-0 items-start gap-2 rounded-xl border border-glass-border bg-paper transition-colors hover:border-glass-border-hi">
      <Link href={shop.href} className="flex min-w-0 flex-1 items-start gap-3 p-4 sm:p-5">
        <IgAvatar initial={shop.initial} color={shop.color} />
        <span className="min-w-0 flex-1">
          <span className="flex items-start gap-2 text-base font-bold leading-7 text-strong">
            <span className="break-words">{shop.name}</span>
            {shop.verified && <span role="img" className="mt-1 shrink-0 text-forest" aria-label="فروشگاه تأیید شده"><ShieldCheckIcon className="h-4 w-4" aria-hidden /></span>}
          </span>
          <span className="mt-1 block break-all text-right text-sm leading-6 text-muted" dir="ltr">{shop.handle}</span>
          {hasReviews ? (
            <span className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-strong">
              <StarIcon className="h-4 w-4 fill-saffron text-saffron" aria-hidden />
              <span className="font-bold tabular-nums">{shop.score}</span>
              <span className="text-muted">از {shop.reviews} تجربه</span>
            </span>
          ) : <span className="mt-2 block text-[13px] leading-6 text-muted">هنوز تجربه‌ای منتشر نشده</span>}
        </span>
        <span aria-hidden className="mt-1 text-lg text-forest">←</span>
      </Link>
      {typeof isBookmarked === "boolean" && <BookmarkButton businessSlug={shop.slug} initialIsBookmarked={isBookmarked} className="my-3 me-2 h-11 w-11 shrink-0 text-forest" />}
    </article>
  );
}
