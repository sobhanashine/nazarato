import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import { recentReviews, type Review } from "@/lib/data/reviews";

const STAR_PATH =
  "m12 16.3-3.7 2.825q-.275.225-.6.213t-.575-.188-.387-.475-.013-.65L8.15 13.4l-3.625-2.575q-.3-.2-.375-.525t.025-.6.35-.488.6-.212H9.6l1.45-4.8q.125-.35.388-.538T12 3.475t.563.188.387.537L14.4 9h4.475q.35 0 .6.213t.35.487.025.6-.375.525L15.85 13.4l1.425 4.625q.125.35-.012.65t-.388.475-.575.188-.6-.213z";

type StarPalette = { light: string; mid: string; dark: string; glow: string };
const STAR_PALETTES: Record<Review["rating"], StarPalette> = {
  5: { light: "#A8FFD6", mid: "#5BE6B2", dark: "#1E9A6F", glow: "rgba(91, 230, 178, 0.55)" },
  4: { light: "#E2F8A0", mid: "#BFE85B", dark: "#6FA82A", glow: "rgba(191, 232, 91, 0.55)" },
  3: { light: "#FFE0A0", mid: "#F5C144", dark: "#B07A12", glow: "rgba(245, 193, 68, 0.55)" },
  2: { light: "#FFD0A8", mid: "#FF9A52", dark: "#C25A18", glow: "rgba(255, 154, 82, 0.55)" },
  1: { light: "#FFC1C9", mid: "#FF7A8E", dark: "#B23446", glow: "rgba(255, 122, 142, 0.6)" },
};

function Stars({ rating }: { rating: Review["rating"] }) {
  const palette = STAR_PALETTES[rating];
  const gradId = `star-grad-${rating}`;
  return (
    <div
      className="review-stars-plain flex gap-[2px] shrink-0"
      data-rating={rating}
      dir="ltr"
      role="img"
      aria-label={`${rating} از ۵`}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const lit = i < rating;
        return (
          <svg
            key={i}
            viewBox="0 0 24 24"
            className="w-[18px] h-[18px] sm:w-5 sm:h-5 shrink-0"
            style={
              lit
                ? { filter: `drop-shadow(0 0 6px ${palette.glow})` }
                : { opacity: 0.4 }
            }
            aria-hidden
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={palette.light} />
                <stop offset="55%" stopColor={palette.mid} />
                <stop offset="100%" stopColor={palette.dark} />
              </linearGradient>
            </defs>
            {lit ? (
              <path d={STAR_PATH} fill={`url(#${gradId})`} />
            ) : (
              <path
                d={STAR_PATH}
                fill="none"
                stroke={palette.mid}
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            )}
          </svg>
        );
      })}
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
            ثبت‌شده توسط کاربران.
          </p>
        </div>

        <div className="flex items-stretch gap-4 overflow-x-auto px-5 py-2 -mx-5 [scroll-snap-type:x_mandatory] [scroll-padding-inline:1.25rem] hide-scroll [&>*]:flex-[0_0_85%] [&>*]:max-w-[340px] [&>*]:[scroll-snap-align:start] sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:p-0 sm:m-0 sm:[&>*]:flex-initial sm:[&>*]:max-w-none lg:grid-cols-3">
          {recentReviews.map((r) => (
            <article
              key={r.id}
              className="glass review-card flex flex-col gap-[0.85rem] p-3.5 sm:p-6 transition-[transform,background,border-color,box-shadow] duration-300 min-w-0 h-full hover:-translate-y-[3px] hover:border-glass-border-hi"
            >
              <div className="flex flex-row items-center justify-between gap-3 min-w-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="relative w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold shrink-0 shadow-[0_6px_18px_-4px_rgba(0,0,0,0.45),0_0_24px_-4px_var(--avatar-glow,rgba(255,122,142,0.35))]"
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
                    className="inline-flex items-center gap-[0.3rem] text-[0.72rem] sm:text-[0.75rem] font-medium text-muted whitespace-nowrap bg-transparent border border-transparent rounded-full cursor-pointer [&>svg]:w-[12px] [&>svg]:h-[12px] sm:[&>svg]:w-[13px] sm:[&>svg]:h-[13px] [&>svg]:shrink-0"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z" />
                      <path d="M7 11l4-8a2 2 0 0 1 3 1.7V9h5a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 17.6 20H7" />
                    </svg>
                    مفید بود
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
