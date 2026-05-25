"use client";

/**
 * The "my reviews" list for `/profile/reviews`.
 *
 * Each row carries a status badge (text + colour — never colour alone, per the
 * a11y rule) and per-row actions. Delete opens a native `<dialog>` confirmation
 * (focus-trapped, Esc-closable for free) and, on confirm, removes the row.
 *
 * Removal is local state only: there is no `reviews` table yet (#17), so this
 * is a faithful UI mock of the delete flow. Wire a server action here once the
 * reviews backend exists.
 */
import Link from "next/link";
import { RatingStars } from "@/components/ui/RatingStars";
import { GLASS } from "@/components/ui/styles";
import type { MyReview, ReviewStatus } from "@/lib/data/profile";

/** Status badge styling — each carries a text label so colour is never the
 *  only signal. */
const STATUS_META: Record<
  ReviewStatus,
  { label: string; className: string }
> = {
  published: {
    label: "منتشر شده",
    className: "border-mint/40 bg-mint/12 text-mint",
  },
  pending: {
    label: "در انتظار بررسی",
    className: "border-amber-400/40 bg-amber-400/12 text-amber-300",
  },
  rejected: {
    label: "رد شده",
    className: "border-rose-400/40 bg-rose-400/12 text-rose-300",
  },
};

const actionBtn =
  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[0.78rem] font-semibold transition-colors duration-200 [&_svg]:h-[14px] [&_svg]:w-[14px]";

export function MyReviewsList({ reviews }: { reviews: MyReview[] }) {
  const list = reviews;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between gap-3">
        <h1 className="text-[1.15rem] font-black text-strong sm:text-[1.3rem]">
          نظرات من
        </h1>
        <span className="text-[0.8rem] tabular-nums text-muted">
          {list.length.toLocaleString("fa-IR")} نظر
        </span>
      </header>

      {list.length === 0 ? (
        <div
          className={`${GLASS} flex flex-col items-center gap-3 px-6 py-14 text-center`}
        >
          <p className="text-[1rem] font-bold text-strong">هنوز نظری ننوشتی</p>
          <p className="max-w-[36ch] text-[0.85rem] leading-[1.9] text-muted">
            اولین تجربه‌ات از یک کسب‌وکار را با بقیه به اشتراک بگذار.
          </p>
          <Link
            href="/categories"
            className="mt-1 inline-flex items-center rounded-full border border-mint/45 bg-mint/12 px-5 py-2.5 text-[0.85rem] font-semibold text-mint transition-colors hover:bg-mint/20"
          >
            پیدا کردن یک کسب‌وکار
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
        {list.map((review) => {
          const status = STATUS_META[review.status];
          return (
            <li
              key={review.id}
              className={`${GLASS} flex flex-col gap-3 p-4 sm:p-5`}
            >
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <Link
                  href={review.shop.href}
                  className="text-[0.95rem] font-bold text-strong hover:text-mint"
                >
                  {review.shop.name}
                </Link>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.72rem] font-semibold ${status.className}`}
                >
                  {status.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <RatingStars rating={review.rating} />
                <span className="text-[0.75rem] tabular-nums text-muted">
                  {review.date}
                </span>
              </div>

              <p className="text-[0.86rem] leading-[1.9] text-strong/85">
                {review.text}
              </p>

              {review.status === "rejected" && review.rejectionReason && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 text-[0.82rem] leading-[1.8] text-rose-300">
                  <div className="font-bold mb-1 flex items-center gap-1.5 text-rose-200">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 shrink-0 text-rose-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    علت عدم تأیید:
                  </div>
                  {review.rejectionReason}
                </div>
              )}

              <div className="flex items-center gap-2 border-t border-glass-border pt-3">
                <button
                  type="button"
                  disabled
                  title="ویرایش نظر پس از راه‌اندازی صفحه ثبت نظر فعال می‌شود"
                  className={`${actionBtn} cursor-not-allowed border-glass-border text-muted opacity-50`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z" />
                  </svg>
                  ویرایش
                </button>
              </div>
            </li>
          );
        })}
        </ul>
      )}

    </div>
  );
}
