"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeftIcon } from "@/components/icons";
import { Container } from "@/components/ui/Container";
import { IgShopCard } from "@/components/ui/IgShopCard";
import { HIDE_SCROLL } from "@/components/ui/styles";
import { instagramShops, nicheTabs, type Niche } from "@/lib/data/instagram-shops";

export function InstagramShops() {
  const [active, setActive] = useState<Niche>("all");

  const visible = useMemo(
    () => instagramShops.filter((s) => active === "all" || s.niche === active),
    [active],
  );

  return (
    <section className="py-10">
      <Container>
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

        <div className={`flex gap-2 mb-7 overflow-x-auto pb-2 ${HIDE_SCROLL}`}>
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

        <div className={`flex gap-4 overflow-x-auto px-5 py-2 -mx-5 [scroll-snap-type:x_mandatory] [scroll-padding-inline:1.25rem] ${HIDE_SCROLL} [&>*]:flex-[0_0_82%] [&>*]:max-w-[320px] [&>*]:[scroll-snap-align:start] sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:p-0 sm:m-0 sm:[&>*]:flex-initial sm:[&>*]:max-w-none lg:grid-cols-4`}>
          {visible.map((s) => (
            <IgShopCard key={s.name} shop={s} />
          ))}
        </div>
      </Container>
    </section>
  );
}
