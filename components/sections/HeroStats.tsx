"use client";

import { useEffect, useRef, useState } from "react";

type Stat = { value: number; suffix?: string; label: string };

const stats: Stat[] = [
  { value: 12428, label: "نظر تایید شده" },
  { value: 3420, label: "کسب‌وکار" },
  { value: 98, suffix: "٪", label: "رضایت کاربران" },
];

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function useCountUp(target: number, duration = 1800) {
  const [v, setV] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setV(target);
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const p = Math.min(1, (now - startRef.current) / duration);
      setV(Math.round(easeOutCubic(p) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return v;
}

function StatItem({ stat }: { stat: Stat }) {
  const v = useCountUp(stat.value);
  return (
    <li className="hero-stat">
      <span className="hero-stat-value">
        {v.toLocaleString("fa-IR")}
        {stat.suffix ?? ""}
      </span>
      <span className="hero-stat-label">{stat.label}</span>
    </li>
  );
}

export function HeroStats() {
  return (
    <ul className="hero-stats" aria-label="آمار پلتفرم">
      {stats.map((s) => (
        <StatItem key={s.label} stat={s} />
      ))}
    </ul>
  );
}
