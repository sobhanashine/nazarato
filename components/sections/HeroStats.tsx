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
    <li className="relative flex flex-col items-center gap-1 [&+li]:before:content-[''] [&+li]:before:absolute [&+li]:before:-right-1 [&+li]:before:top-[15%] [&+li]:before:bottom-[15%] [&+li]:before:w-px [&+li]:before:bg-glass-border">
      <span className="hero-stat-value text-[1.1rem] sm:text-[1.4rem] font-extrabold text-strong -tracking-[0.01em]">
        {v.toLocaleString("fa-IR")}
        {stat.suffix ?? ""}
      </span>
      <span className="text-[11.5px] sm:text-[13px] text-muted">{stat.label}</span>
    </li>
  );
}

export function HeroStats() {
  return (
    <ul
      className="grid grid-cols-3 gap-2 w-full max-w-[620px] mt-6 px-5 py-4 bg-glass border border-glass-border rounded-[18px] backdrop-blur-[14px] backdrop-saturate-[160%] list-none"
      aria-label="آمار پلتفرم"
    >
      {stats.map((s) => (
        <StatItem key={s.label} stat={s} />
      ))}
    </ul>
  );
}
