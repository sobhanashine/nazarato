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
    <section className="section-wrap">
      <div className="container">
        <div className="section-head">
          <div className="section-head-row">
            <h2>فروشگاه‌های <strong>اینستاگرامی</strong></h2>
            <Link href="/instagram-shops" className="see-all">
              <span>تمامی فروشگاه‌ها</span>
              <ArrowLeftIcon />
            </Link>
          </div>
          <p className="section-desc">بهترین فروشگاه‌های اینستاگرامی بر اساس نظرات واقعی.</p>
        </div>

        <div className="ig-tabs">
          {nicheTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`ig-tab${active === t.id ? " active" : ""}`}
              onClick={() => setActive(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="ig-grid">
          {visible.map((s) => (
            <Link key={s.name} href={s.href} className="ig-card">
              <div className="ig-avatar">
                <div className="ig-avatar-inner" style={{ background: s.color }}>{s.initial}</div>
              </div>
              <div className="ig-info">
                <span className="ig-shop-name">
                  {s.name}
                  <span className="ig-verified" aria-label="فروشگاه تایید شده" title="تایید شده">
                    <svg viewBox="0 0 14 14" aria-hidden>
                      <path d="M7 .8l1.6 1.4 2.1-.2.6 2 1.9 1-.8 2 .8 2-1.9 1-.6 2-2.1-.2L7 13.2 5.4 11.8l-2.1.2-.6-2-1.9-1 .8-2-.8-2 1.9-1 .6-2 2.1.2z" fill="currentColor" />
                      <path d="M4.4 7.1l1.9 1.8 3.3-3.6" fill="none" stroke="#06121f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
                <span className="ig-handle">{s.handle}</span>
                <div className="ig-rating">
                  <StarIcon />
                  <span className="ig-score-num">{s.score}</span>
                  <span className="ig-review-count">({s.reviews} نظر)</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
