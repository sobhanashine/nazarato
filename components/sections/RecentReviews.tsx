import Link from "next/link";
import { ArrowLeftIcon, StarIcon } from "@/components/icons";
import { recentReviews, type Review } from "@/lib/data/reviews";

function Stars({ rating }: { rating: Review["rating"] }) {
  return (
    <div
      className="review-stars flex gap-[3px] shrink-0 self-start"
      data-rating={rating}
      dir="ltr"
      role="img"
      aria-label={`${rating} از ۵`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`star-chip w-[20px] h-[20px] sm:w-[22px] sm:h-[22px] rounded-md grid place-items-center shrink-0 [&>svg]:w-[11px] [&>svg]:h-[11px] sm:[&>svg]:w-3 sm:[&>svg]:h-3 [&>svg]:[fill:currentColor] ${
            i < rating
              ? "is-on border border-transparent [&>svg]:text-[#1a0f00]"
              : "bg-white/[0.04] border border-glass-border [&>svg]:text-white/[0.18]"
          }`}
        >
          <StarIcon />
        </span>
      ))}
    </div>
  );
}

export function RecentReviews() {
  return (
    <section className="py-10">
      <div className="container">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <h2 className="text-[0.98rem] sm:text-[1.35rem] lg:text-[1.7rem] font-extrabold text-strong leading-[1.3] -tracking-[0.015em] min-w-0">
              نظرات{" "}
              <strong className="font-[inherit] bg-[linear-gradient(135deg,#5BE6B2_0%,#7B89FF_100%)] bg-clip-text text-transparent">
                اخیر
              </strong>{" "}
              فروشگاه‌های آنلاین
            </h2>
            <Link
              href="/reviews"
              className="inline-flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[13px] font-semibold text-mint whitespace-nowrap shrink-0 transition-[color,opacity] duration-200 hover:text-[#7BFFC9] [&_svg]:w-[11px] [&_svg]:h-[11px] sm:[&_svg]:w-[14px] sm:[&_svg]:h-[14px] [&_svg]:shrink-0"
            >
              <span>تمامی نظرات</span>
              <ArrowLeftIcon />
            </Link>
          </div>
          <p className="text-[13px] sm:text-[14.5px] text-muted leading-[1.6]">
            آخرین نظرات ثبت‌شده توسط کاربران درباره فروشگاه‌های آنلاین.
          </p>
        </div>

        <div className="flex items-stretch gap-4 overflow-x-auto px-5 py-2 -mx-5 [scroll-snap-type:x_mandatory] [scroll-padding-inline:1.25rem] hide-scroll [&>*]:flex-[0_0_85%] [&>*]:max-w-[340px] [&>*]:[scroll-snap-align:start] sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:p-0 sm:m-0 sm:[&>*]:flex-initial sm:[&>*]:max-w-none lg:grid-cols-3">
          {recentReviews.map((r) => (
            <article
              key={r.id}
              className="glass flex flex-col gap-[0.85rem] p-6 transition-[transform,background,border-color] duration-300 min-w-0 h-full hover:-translate-y-[3px] hover:bg-glass-hover hover:border-glass-border-hi"
            >
              <div className="flex flex-col items-start gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3 min-w-0">
                <div className="flex items-center gap-3 min-w-0 w-full sm:flex-auto sm:w-auto">
                  <div
                    className="relative w-11 h-11 rounded-full flex items-center justify-center text-white text-base font-bold shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_12px_rgba(0,0,0,0.35)]"
                    style={{ background: r.user.color }}
                  >
                    {r.user.initial}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-mint text-[#06231b] grid place-items-center shadow-[0_0_0_2px_#0a0e18,0_0_10px_rgba(91,230,178,0.6)] [&_svg]:w-2.5 [&_svg]:h-2.5"
                      aria-label="کاربر تایید شده"
                      title="کاربر تایید شده"
                    >
                      <svg viewBox="0 0 12 12" aria-hidden>
                        <path d="M2.5 6.2l2.4 2.3 4.6-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[0.95rem] font-semibold text-strong whitespace-nowrap overflow-hidden text-ellipsis">
                      {r.user.name}
                    </div>
                    <Link
                      href={r.shop.href}
                      className="text-[0.8rem] text-mint font-medium whitespace-nowrap overflow-hidden text-ellipsis block mt-[2px]"
                    >
                      {r.shop.name}
                    </Link>
                  </div>
                </div>
                <Stars rating={r.rating} />
              </div>
              <p className="text-[0.88rem] leading-[1.8] text-strong opacity-[0.86] line-clamp-3 min-h-[calc(0.88rem*1.8*3)] flex-1">
                {r.text}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 pt-3 border-t border-glass-border mt-auto">
                <span className="review-date text-[0.75rem] text-muted whitespace-nowrap shrink-0">
                  {r.date}
                </span>
                <div className="inline-flex items-center gap-1 sm:gap-1.5 shrink-0 min-w-0">
                  <button
                    type="button"
                    className="inline-flex items-center gap-[0.3rem] px-2 py-1 text-[0.72rem] sm:text-[0.75rem] font-medium text-muted whitespace-nowrap bg-transparent border border-transparent rounded-full cursor-pointer transition-[color,background,border-color] duration-200 hover:text-mint hover:bg-mint/10 hover:border-mint/25 [&>svg]:w-[12px] [&>svg]:h-[12px] sm:[&>svg]:w-[13px] sm:[&>svg]:h-[13px] [&>svg]:shrink-0"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z" />
                      <path d="M7 11l4-8a2 2 0 0 1 3 1.7V9h5a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 17.6 20H7" />
                    </svg>
                    مفید بود
                  </button>
                  <button
                    type="button"
                    aria-label="گزارش تخلف"
                    className="inline-flex items-center gap-[0.3rem] px-2 py-1 text-[0.72rem] sm:text-[0.75rem] font-medium text-[#FF7A8E] whitespace-nowrap bg-transparent border border-transparent rounded-full cursor-pointer transition-[color,background,border-color] duration-200 hover:text-[#FF8FA0] hover:bg-[rgba(232,72,88,0.10)] hover:border-[rgba(232,72,88,0.35)] [&>svg]:w-[12px] [&>svg]:h-[12px] sm:[&>svg]:w-[13px] sm:[&>svg]:h-[13px] [&>svg]:shrink-0"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M4 21V4l8 2 8-2v12l-8 2-8-2" />
                      <path d="M4 21V13" />
                    </svg>
                    گزارش تخلف
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
