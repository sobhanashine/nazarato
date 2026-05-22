const block = "rounded-glass border border-glass-border bg-glass";

/** Skeleton for `/profile/reviews` — the `(user)` layout chrome stays. */
export default function MyReviewsLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-4" aria-hidden>
      <div className={`${block} h-7 w-32`} />
      <div className="flex flex-col gap-3">
        <div className={`${block} h-[156px]`} />
        <div className={`${block} h-[156px]`} />
        <div className={`${block} h-[156px]`} />
      </div>
      <span className="sr-only">در حال بارگذاری…</span>
    </div>
  );
}
