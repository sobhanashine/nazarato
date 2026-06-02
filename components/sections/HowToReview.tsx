"use client";

/**
 * HowToReview — a landing section that teaches visitors how to leave a review.
 *
 * The right column is an "animation box": a phone-sized mock that auto-cycles
 * through the EXACT four steps of the real review wizard (`ReviewSheet`) —
 * pick → rate → write → done — reusing its copy, star visuals, and the shared
 * `review-*` keyframes. The left column lists the same steps and highlights
 * whichever one the box is currently showing. The CTA opens the real sheet.
 *
 * Respects `prefers-reduced-motion`: auto-advance is disabled and the step
 * dots become the way to move through the flow.
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useReviewSheet } from "@/components/review/ReviewSheetProvider";
import { Container } from "@/components/ui/Container";
import { STAR_PALETTES, STAR_PATH, type Rating } from "@/components/ui/RatingStars";

/** Mirrors `ReviewSheet`'s Step union (minus the implementation details). */
type StepKey = "pick" | "rate" | "write" | "done";

type StepGuide = {
  key: StepKey;
  /** Short label for the numbered guide on the right (RTL). */
  label: string;
  /** One-line "what you do" for the guide. */
  hint: string;
  /** The wizard's own heading for this step — shown inside the box. */
  title: string;
  /** The wizard's own subtitle for this step. */
  subtitle: string;
};

const STEPS: StepGuide[] = [
  {
    key: "pick",
    label: "کسب‌وکار را پیدا کن",
    hint: "اول جایی که ازش خرید کردی رو انتخاب کن.",
    title: "کجا خرید کردی؟",
    subtitle: "کسب‌وکاری که می‌خوای نقدش کنی رو پیدا کن.",
  },
  {
    key: "rate",
    label: "امتیاز بده",
    hint: "با یک ضربه روی ستاره‌ها، رضایتت رو مشخص کن.",
    title: "چه‌قدر راضی بودی؟",
    subtitle: "روی ستاره‌ها بزن — همین یک ضربه کافیه.",
  },
  {
    key: "write",
    label: "تجربه‌ات را بنویس",
    hint: "در چند جمله بنویس چی خوب بود و چی نه.",
    title: "تجربه‌ات رو تعریف کن",
    subtitle: "هرچی دقیق‌تر بنویسی، برای بقیه مفیدتره.",
  },
  {
    key: "done",
    label: "ثبت کن",
    hint: "نظرت بعد از یک بررسی کوتاه منتشر می‌شه.",
    title: "نظرت ثبت شد!",
    subtitle: "ممنون که به بقیه کمک کردی.",
  },
];

const CYCLE_MS = 2600;
const fa = (n: number) => n.toLocaleString("fa-IR");

export function HowToReview() {
  const { openReviewSheet } = useReviewSheet();
  const [active, setActive] = useState(0);
  const reduced = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = mq.matches;
    if (mq.matches) return; // don't auto-advance for reduced-motion users
    const id = setInterval(() => {
      setActive((a) => (a + 1) % STEPS.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  const step = STEPS[active];

  return (
    <section className="relative z-10 py-8 md:py-12" aria-labelledby="how-to-review-title">
      <Container>
        <div className="relative overflow-hidden rounded-[28px] border border-glass-border bg-gradient-to-l from-[#0b241c] via-[#09141b] to-glass/30 p-6 shadow-lg backdrop-blur-xl sm:p-10 md:p-12">
          <div aria-hidden className="pointer-events-none absolute -top-12 -left-12 h-48 w-48 rounded-full bg-mint/10 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-lapis/10 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
            {/* Right (RTL): the guide */}
            <div className="flex flex-col items-start text-right lg:col-span-6">
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-mint/20 bg-mint/10 px-3.5 py-1.5 text-[12.5px] font-bold tracking-wide text-mint">
                ثبت نظر در نظراتو
              </span>
              <h2
                id="how-to-review-title"
                className="mb-4 text-[1.8rem] font-black leading-[1.25] -tracking-[0.015em] text-strong sm:text-[2.2rem] md:text-[2.5rem]"
              >
                ثبت نظر فقط چند ثانیه طول می‌کشه
              </h2>
              <p className="mb-7 max-w-[560px] text-[14px] leading-[1.9] text-muted sm:text-[15.5px]">
                لازم نیست فرم طولانی پر کنی. در چهار قدم ساده تجربه‌ی خریدت رو ثبت کن
                و به هزاران خریدار دیگه کمک کن انتخاب بهتری داشته باشن.
              </p>

              <ol className="mb-8 w-full max-w-[520px] space-y-2.5">
                {STEPS.map((s, i) => {
                  const isActive = i === active;
                  return (
                    <li key={s.key}>
                      <button
                        type="button"
                        onClick={() => setActive(i)}
                        aria-current={isActive ? "step" : undefined}
                        className={`flex w-full items-start gap-3.5 rounded-2xl border p-3 text-right transition-colors duration-300 ${
                          isActive
                            ? "border-mint/35 bg-mint/[0.07]"
                            : "border-glass-border bg-white/[0.02] hover:border-glass-border-hi"
                        }`}
                      >
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[0.85rem] font-black transition-colors duration-300 ${
                            isActive
                              ? "bg-mint text-[#06231b]"
                              : "bg-white/[0.06] text-muted"
                          }`}
                          aria-hidden
                        >
                          {fa(i + 1)}
                        </span>
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className={`text-[0.95rem] font-bold ${isActive ? "text-strong" : "text-muted"}`}>
                            {s.label}
                          </span>
                          <span className="text-[0.8rem] leading-[1.7] text-muted">{s.hint}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              <button
                type="button"
                onClick={() => openReviewSheet()}
                className="inline-flex w-full items-center justify-center rounded-full bg-strong px-6 py-3.5 text-center text-[14.5px] font-extrabold text-[#06080f] shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-white active:scale-98 sm:w-auto"
              >
                همین حالا نظر بده
              </button>
            </div>

            {/* Left (RTL): the animation box */}
            <div className="flex justify-center lg:col-span-6">
              <ReviewFlowBox step={step} stepIndex={active} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ───────────────────────── animation box ───────────────────────── */

function ReviewFlowBox({ step, stepIndex }: { step: StepGuide; stepIndex: number }) {
  return (
    <div
      className="relative flex w-full max-w-[360px] flex-col overflow-hidden rounded-[26px] border border-glass-border bg-[#0b0f1a] shadow-[0_24px_70px_rgba(0,0,0,0.5)]"
      role="img"
      aria-label={`نمونه‌ی مرحله: ${step.label}`}
    >
      {/* Header: drag handle + progress dots (mirrors the real sheet) */}
      <div className="shrink-0 px-5 pt-3">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/15" aria-hidden />
        <div className="flex h-7 items-center justify-center gap-1.5" aria-hidden>
          {STEPS.map((s, i) => (
            <span
              key={s.key}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === stepIndex
                  ? "w-5 bg-mint"
                  : i < stepIndex
                    ? "w-1.5 bg-mint/55"
                    : "w-1.5 bg-white/15"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content area — fixed height so cards don't jump as steps cross-fade */}
      <div className="relative h-[290px] px-5 pb-6 pt-3">
        <div
          key={step.key}
          className="animate-[review-step_0.32s_ease-out] motion-reduce:animate-none"
        >
          <h3 className="text-center text-[1.15rem] font-black tracking-tight text-strong">
            {step.title}
          </h3>
          <p className="mt-1.5 text-center text-[12.5px] leading-[1.8] text-muted">
            {step.subtitle}
          </p>
          <div className="mt-4">
            {step.key === "pick" && <PickMock />}
            {step.key === "rate" && <RateMock />}
            {step.key === "write" && <WriteMock />}
            {step.key === "done" && <DoneMock />}
          </div>
        </div>
      </div>
    </div>
  );
}

function PickMock() {
  return (
    <div>
      <div className="flex items-center gap-2.5 rounded-xl border border-mint/40 bg-mint/[0.06] px-3.5 py-3">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <span className="text-[15px] text-white/80">دیجی‌کالا</span>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {[
          { name: "دیجی‌کالا", meta: "فروشگاه اینترنتی · تهران", color: "#E11D48", initial: "د" },
          { name: "اسنپ‌فود", meta: "سفارش غذا · تهران", color: "#7B89FF", initial: "ا" },
        ].map((b) => (
          <div
            key={b.name}
            className="flex items-center gap-3 rounded-xl border border-glass-border bg-white/[0.02] p-2.5"
          >
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-[0.95rem] font-bold text-white"
              style={{ background: b.color }}
              aria-hidden
            >
              {b.initial}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-[0.88rem] font-bold text-strong">{b.name}</span>
              <span className="truncate text-[0.72rem] text-muted">{b.meta}</span>
            </span>
          </div>
        ))}
      </ul>
    </div>
  );
}

const RATE = 5 as Rating;

function RateMock() {
  const palette = STAR_PALETTES[RATE];
  return (
    <div className="flex flex-col items-center">
      <div dir="ltr" className="mt-2 flex items-center justify-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className="flex h-12 w-12 items-center justify-center"
            style={{ animation: `review-star 0.4s ease-out ${(n - 1) * 0.08}s both` }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-9 w-9"
              style={{ filter: `drop-shadow(0 0 8px ${palette.glow})` }}
              aria-hidden
            >
              <defs>
                <linearGradient id={`htr-grad-${n}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={palette.light} />
                  <stop offset="55%" stopColor={palette.mid} />
                  <stop offset="100%" stopColor={palette.dark} />
                </linearGradient>
              </defs>
              <path d={STAR_PATH} fill={`url(#htr-grad-${n})`} />
            </svg>
          </span>
        ))}
      </div>
      <span
        className="mt-4 inline-block animate-[review-pop_0.3s_ease-out] text-[1.35rem] font-black motion-reduce:animate-none"
        style={{ color: palette.mid }}
      >
        عالی
      </span>
    </div>
  );
}

function WriteMock() {
  return (
    <div>
      <div className="rounded-xl border border-mint/30 bg-mint/[0.05] px-4 py-3 text-[13.5px] leading-[2] text-white/85">
        کیفیت محصول عالی بود، ارسال سریع و بسته‌بندی تمیز…
      </div>
      <div className="mt-2.5 flex items-center gap-3">
        <span className="shrink-0 text-[11px] font-bold text-mint">آماده‌ی ثبت</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-full rounded-full bg-mint" />
        </div>
      </div>
      <div className="mt-4 w-full rounded-full bg-[linear-gradient(135deg,#5BE6B2_0%,#3FBF92_100%)] py-3 text-center text-[14px] font-bold text-[#06231b]">
        ثبت نظر
      </div>
    </div>
  );
}

const SPARKS: { sx: string; sy: string; delay: string; color: string }[] = [
  { sx: "-40px", sy: "-30px", delay: "0.05s", color: "#5BE6B2" },
  { sx: "42px", sy: "-26px", delay: "0.12s", color: "#F5B544" },
  { sx: "-46px", sy: "18px", delay: "0.09s", color: "#7B89FF" },
  { sx: "44px", sy: "22px", delay: "0.16s", color: "#5BE6B2" },
];

function DoneMock() {
  return (
    <div className="flex flex-col items-center pt-4">
      <div className="relative grid h-24 w-24 place-items-center">
        <span
          className="absolute h-16 w-16 rounded-full border-2 border-mint animate-[review-ring_0.9s_ease-out] motion-reduce:hidden"
          aria-hidden
        />
        {SPARKS.map((s, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute h-2 w-2 rounded-full motion-reduce:hidden"
            style={
              {
                background: s.color,
                "--sx": s.sx,
                "--sy": s.sy,
                animation: `review-spark 0.85s ease-out ${s.delay} forwards`,
              } as CSSProperties
            }
          />
        ))}
        <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-mint/15 animate-[review-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:animate-none">
          <svg viewBox="0 0 52 52" className="h-10 w-10" aria-hidden>
            <path
              d="M14 27l8 8 16-18"
              fill="none"
              stroke="#5BE6B2"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 56,
                strokeDashoffset: 56,
                animation: "review-check 0.45s 0.3s ease-out forwards",
              }}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
