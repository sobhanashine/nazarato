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
          <h2>فروشگاه‌های <strong>اینستاگرامی</strong></h2>
          <div className="section-meta">
            <p>بهترین فروشگاه‌های اینستاگرامی بر اساس نظرات واقعی.</p>
            <Link href="/instagram-shops" className="see-all">
              <span>تمامی فروشگاه‌ها</span>
              <ArrowLeftIcon />
            </Link>
          </div>
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
                <span className="ig-shop-name">{s.name}</span>
                <span className="ig-handle">{s.handle}</span>
                <div className="ig-rating">
                  <StarIcon />
                  <span>{s.score}</span>
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
