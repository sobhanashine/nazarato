"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeftIcon, StarIcon } from "@/components/icons";
import { instagramShops, nicheTabs, type Niche } from "@/lib/data/instagram-shops";

export function InstagramShops() {
  const [active, setActive] = useState<Niche>("all");

  const visible = useMemo(
    () => instagramShops.filter((s) => active === "all" || s.niche === active),
    [active],
  );

  return (
    <section className="py-10">
      <div className="container">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <h2 className="text-[0.98rem] sm:text-[1.35rem] lg:text-[1.7rem] font-extrabold text-strong leading-[1.3] -tracking-[0.015em] min-w-0">
              فروشگاه‌های{" "}
              <strong className="font-[inherit] bg-[linear-gradient(135deg,#5BE6B2_0%,#7B89FF_100%)] bg-clip-text text-transparent">
                اینستاگرامی
              </strong>
            </h2>
            <Link
              href="/instagram-shops"
              className="inline-flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[13px] font-semibold text-mint whitespace-nowrap shrink-0 transition-[color,opacity] duration-200 hover:text-[#7BFFC9] [&_svg]:w-[11px] [&_svg]:h-[11px] sm:[&_svg]:w-[14px] sm:[&_svg]:h-[14px] [&_svg]:shrink-0"
            >
              <span>تمامی فروشگاه‌ها</span>
              <ArrowLeftIcon />
            </Link>
          </div>
          <p className="text-[13px] sm:text-[14.5px] text-muted leading-[1.6]">
            بهترین فروشگاه‌های اینستاگرامی بر اساس نظرات واقعی.
          </p>
        </div>

        <div className="flex gap-2 mb-7 overflow-x-auto pb-2 hide-scroll">
          {nicheTabs.map((t) => {
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActive(t.id)}
                className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-full border backdrop-blur-[10px] text-[0.85rem] font-medium cursor-pointer whitespace-nowrap shrink-0 transition-all duration-200 ${
                  isActive
                    ? "bg-[linear-gradient(135deg,rgba(91,230,178,0.24),rgba(91,230,178,0.08))] text-strong border-mint/55 shadow-[0_0_24px_rgba(91,230,178,0.22),inset_0_1px_0_rgba(255,255,255,0.1)]"
                    : "bg-glass border-glass-border text-muted hover:border-mint/45 hover:text-strong"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-4 overflow-x-auto px-5 py-2 -mx-5 [scroll-snap-type:x_mandatory] [scroll-padding-inline:1.25rem] hide-scroll [&>*]:flex-[0_0_82%] [&>*]:max-w-[320px] [&>*]:[scroll-snap-align:start] sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:p-0 sm:m-0 sm:[&>*]:flex-initial sm:[&>*]:max-w-none lg:grid-cols-4">
          {visible.map((s) => (
            <Link
              key={s.name}
              href={s.href}
              className="glass flex items-center gap-4 px-[1.35rem] py-5 cursor-pointer transition-[transform,background,border-color] duration-300 ease-out hover:bg-glass-hover hover:border-glass-border-hi hover:-translate-y-[2px]"
            >
              <div
                className="w-[60px] h-[60px] rounded-full p-[3px] [background:conic-gradient(from_45deg,#feda75_0%,#fa7e1e_20%,#d62976_45%,#962fbf_70%,#4f5bd5_90%,#feda75_100%)] flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(214,41,118,0.35)]"
              >
                <div
                  className="w-full h-full rounded-full border-[2.5px] border-[#0a0e18] flex items-center justify-center text-white text-[1.2rem] font-bold leading-none"
                  style={{ background: s.color }}
                >
                  {s.initial}
                </div>
              </div>
              <div className="min-w-0 flex flex-col gap-[3px]">
                <span className="inline-flex items-center gap-1.5 text-[0.95rem] font-semibold text-strong whitespace-nowrap overflow-hidden text-ellipsis">
                  {s.name}
                  <span
                    className="inline-flex w-[14px] h-[14px] text-lapis [filter:drop-shadow(0_0_6px_rgba(123,137,255,0.55))] shrink-0 [&_svg]:w-[14px] [&_svg]:h-[14px]"
                    aria-label="فروشگاه تایید شده"
                    title="تایید شده"
                  >
                    <svg viewBox="0 0 14 14" aria-hidden>
                      <path d="M7 .8l1.6 1.4 2.1-.2.6 2 1.9 1-.8 2 .8 2-1.9 1-.6 2-2.1-.2L7 13.2 5.4 11.8l-2.1.2-.6-2-1.9-1 .8-2-.8-2 1.9-1 .6-2 2.1.2z" fill="currentColor" />
                      <path d="M4.4 7.1l1.9 1.8 3.3-3.6" fill="none" stroke="#06121f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
                <span className="text-[0.8rem] text-muted ltr text-right whitespace-nowrap overflow-hidden text-ellipsis opacity-90" dir="ltr">
                  {s.handle}
                </span>
                <div className="flex items-center gap-1.5 mt-[2px] [&>svg]:w-[14px] [&>svg]:h-[14px] [&>svg]:text-saffron [&>svg]:shrink-0 [&>svg]:[fill:currentColor] [&>svg]:[filter:drop-shadow(0_0_4px_rgba(245,181,68,0.45))]">
                  <StarIcon />
                  <span className="ig-score-num text-[0.9rem] font-bold text-strong leading-none">
                    {s.score}
                  </span>
                  <span className="ig-review-count text-[0.78rem] text-muted font-normal not-italic">
                    ({s.reviews} نظر)
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
