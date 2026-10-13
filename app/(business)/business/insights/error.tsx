"use client";

export default function OwnerInsightsError({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-[48vh] place-items-center">
      <div className="w-full max-w-xl rounded-3xl border border-rose-300/20 bg-rose-300/[0.045] p-7 text-center sm:p-9">
        <span
          aria-hidden
          className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-rose-300/25 bg-rose-300/[0.08] text-rose-200"
        >
          !
        </span>
        <h1 className="mt-4 text-[1.2rem] font-black text-strong">
          تحلیل این لحظه آماده نشد
        </h1>
        <p className="mx-auto mt-2 max-w-[44ch] text-[0.82rem] leading-[1.9] text-muted">
          داده‌ای از بین نرفته است. اتصال را دوباره بررسی می‌کنیم؛ چند لحظه بعد دوباره تلاش کن.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 min-h-11 rounded-xl border border-rose-300/30 bg-rose-300/[0.08] px-5 text-[0.8rem] font-black text-rose-100 transition hover:bg-rose-300/[0.12]"
        >
          تلاش دوباره
        </button>
      </div>
    </main>
  );
}
