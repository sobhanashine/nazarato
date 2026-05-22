const block = "rounded-glass border border-glass-border bg-glass";

/** Skeleton for the `/profile` dashboard — the `(user)` layout chrome stays. */
export default function ProfileLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-5" aria-hidden>
      <div className={`${block} h-[108px] w-full sm:h-[124px]`} />
      <div className="grid grid-cols-3 gap-3">
        <div className={`${block} h-[92px]`} />
        <div className={`${block} h-[92px]`} />
        <div className={`${block} h-[92px]`} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className={`${block} h-[88px]`} />
        <div className={`${block} h-[88px]`} />
        <div className={`${block} h-[88px]`} />
      </div>
      <span className="sr-only">در حال بارگذاری…</span>
    </div>
  );
}
