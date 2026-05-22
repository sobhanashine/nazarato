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
import { useRef, useState } from "react";
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
  const [list, setList] = useState(reviews);
  const [pending, setPending] = useState<MyReview | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  function askDelete(review: MyReview) {
    setPending(review);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
    setPending(null);
  }

  function confirmDelete() {
    if (pending) setList((prev) => prev.filter((r) => r.id !== pending.id));
    closeDialog();
  }

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
                <button
                  type="button"
                  onClick={() => askDelete(review)}
                  className={`${actionBtn} border-rose-400/35 text-rose-300 hover:bg-rose-400/12`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
                  </svg>
                  حذف
                </button>
              </div>
            </li>
          );
        })}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby="delete-review-title"
        onCancel={closeDialog}
        className="m-auto w-[min(92vw,380px)] rounded-glass border border-glass-border bg-[#0e1320] p-0 text-strong backdrop:bg-black/65 backdrop:backdrop-blur-sm"
      >
        <div className="flex flex-col gap-3 p-5 sm:p-6">
          <h2
            id="delete-review-title"
            className="text-[1.05rem] font-black text-strong"
          >
            حذف این نظر؟
          </h2>
          <p className="text-[0.85rem] leading-[1.9] text-muted">
            {pending
              ? `نظر شما درباره «${pending.shop.name}» برای همیشه حذف می‌شود. این کار قابل بازگشت نیست.`
              : ""}
          </p>
          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={closeDialog}
              className="rounded-full border border-glass-border bg-glass px-4 py-2 text-[0.83rem] font-semibold text-muted transition-colors hover:text-strong"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="rounded-full border border-rose-400/45 bg-rose-400/15 px-4 py-2 text-[0.83rem] font-bold text-rose-200 transition-colors hover:bg-rose-400/25"
            >
              حذف نظر
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
