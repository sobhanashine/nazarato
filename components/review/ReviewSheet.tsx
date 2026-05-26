"use client";

/**
 * ReviewSheet — the animated bottom-sheet review wizard.
 *
 * Opened from the mobile tab-bar FAB (see `ReviewSheetProvider`). A guided,
 * one-thing-per-screen flow built for the fewest possible taps:
 *
 *   pick business → rate (auto-advances) → write → success
 *
 * There is no title field. The sheet slides up on mobile / scales in on
 * desktop, each step cross-fades, and submission ends on a celebratory
 * success screen. A fresh instance mounts per open (keyed in the provider),
 * so wizard + action state always start clean.
 */

import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { STAR_PALETTES, STAR_PATH, type Rating } from "@/components/ui/RatingStars";
import { useSessionStatus } from "@/components/layout/useSessionStatus";
import { BTN_PRIMARY } from "@/components/ui/styles";
import type { Business } from "@/lib/data/businesses";
import { submitQuickReview, type QuickReviewState } from "./actions";
import { VoiceDictateButton } from "./VoiceDictateButton";

/** A business the sheet can open with already selected (skips the picker). */
export type ReviewPrefill = { slug: string; name: string };

type Step = "pick" | "rate" | "write" | "done";

/** Minimal business shape the wizard carries between steps. */
type Selected = {
  slug: string;
  name: string;
  initial: string;
  color: string;
  meta: string;
};

const BODY_MIN = 30;
const BODY_MAX = 2000;
const EXIT_MS = 400;
const AUTO_ADVANCE_MS = 850;

const RATING_LABELS = ["خیلی بد", "بد", "متوسط", "خوب", "عالی"];

const fa = (n: number) => n.toLocaleString("fa-IR");

const initial: QuickReviewState = { ok: false };

function toSelected(b: Business): Selected {
  return {
    slug: b.slug,
    name: b.name,
    initial: b.initial,
    color: b.color,
    meta: `${b.category} · ${b.city}`,
  };
}

function resolveSelected(
  prefill: ReviewPrefill | null,
  businesses: Business[],
): Selected | null {
  if (!prefill) return null;
  const full = businesses.find((b) => b.slug === prefill.slug);
  if (full) return toSelected(full);
  return {
    slug: prefill.slug,
    name: prefill.name,
    initial: prefill.name.trim().charAt(0) || "؟",
    color: "#7B89FF",
    meta: "",
  };
}

export function ReviewSheet({
  isOpen,
  onClose,
  prefill,
  businesses,
}: {
  isOpen: boolean;
  onClose: () => void;
  prefill: ReviewPrefill | null;
  businesses: Business[];
}) {
  const hasPicker = !prefill;

  const [present, setPresent] = useState(true);
  const [visible, setVisible] = useState(false);

  const [step, setStep] = useState<Step>(hasPicker ? "pick" : "rate");
  const [selected, setSelected] = useState<Selected | null>(() =>
    resolveSelected(prefill, businesses),
  );
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");

  const [state, formAction, pending] = useActionState(submitQuickReview, initial);
  const session = useSessionStatus();
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Enter: flip to visible on the next frame so the CSS transition runs.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Exit: when the provider closes us, play the out-transition then unmount.
  useEffect(() => {
    if (!isOpen) {
      setVisible(false);
      const t = setTimeout(() => setPresent(false), EXIT_MS);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Lock body scroll while open; always restore on close / unmount. (The
  // component renders null after the exit animation but stays mounted, so the
  // restore must key off `isOpen`, not unmount alone.)
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Escape closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Successful submit → celebrate.
  useEffect(() => {
    if (state.ok) setStep("done");
  }, [state.ok]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  const flow: Step[] = useMemo(
    () => (hasPicker ? ["pick", "rate", "write"] : ["rate", "write"]),
    [hasPicker],
  );
  const stepIndex = flow.indexOf(step);

  const pickRating = useCallback((n: number) => {
    setRating(n);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => setStep("write"), AUTO_ADVANCE_MS);
  }, []);

  const canGoBack =
    step === "write" || (step === "rate" && hasPicker);

  const goBack = useCallback(() => {
    if (step === "write") setStep("rate");
    else if (step === "rate") setStep("pick");
  }, [step]);

  if (!present) return null;

  const loggedIn = session?.loggedIn === true;
  const showChrome = loggedIn && step !== "done";

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="ثبت نظر"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="بستن"
        tabIndex={-1}
        onClick={onClose}
        className={`absolute inset-0 cursor-default bg-black/65 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel */}
      <div
        className={`relative flex max-h-[93dvh] w-full flex-col overflow-hidden border border-glass-border bg-[#0b0f1a] shadow-[0_-24px_70px_rgba(0,0,0,0.65)] transition-[transform,opacity] duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)] rounded-t-[26px] sm:max-w-[460px] sm:rounded-[26px] motion-reduce:transition-none ${
          visible
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-full opacity-0 sm:translate-y-0 sm:scale-95"
        }`}
      >
        {/* Header */}
        <div className="shrink-0 px-5 pt-3">
          <div
            className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/15 sm:hidden"
            aria-hidden
          />
          <div className="flex h-9 items-center justify-between gap-3">
            {showChrome && canGoBack ? (
              <button
                type="button"
                onClick={goBack}
                aria-label="مرحله قبل"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/[0.07] hover:text-strong"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            ) : (
              <span className="w-9" aria-hidden />
            )}

            {showChrome ? (
              <div className="flex items-center gap-1.5" aria-hidden>
                {flow.map((s, i) => (
                  <span
                    key={s}
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
            ) : (
              <span aria-hidden />
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/[0.07] hover:text-strong"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3">
          {session === null ? (
            <LoadingState />
          ) : !loggedIn ? (
            <AuthGate />
          ) : (
            <div
              key={step}
              className="animate-[review-step_0.32s_ease-out] motion-reduce:animate-none"
            >
              {step === "pick" && (
                <PickStep
                  businesses={businesses}
                  onPick={(b) => {
                    setSelected(toSelected(b));
                    setStep("rate");
                  }}
                />
              )}

              {step === "rate" && selected && (
                <RateStep
                  selected={selected}
                  rating={rating}
                  onPick={pickRating}
                />
              )}

              {step === "write" && selected && (
                <WriteStep
                  selected={selected}
                  rating={rating}
                  body={body}
                  setBody={setBody}
                  formAction={formAction}
                  pending={pending}
                  error={state.error}
                />
              )}

              {step === "done" && (
                <DoneStep name={selected?.name ?? ""} onClose={onClose} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── sub-views ─────────────────────────── */

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-mint"
        aria-hidden
      />
      <p className="text-[13px] text-muted">یک لحظه…</p>
    </div>
  );
}

function AuthGate() {
  // Return the user to the current page with `?review=1` so
  // `ReviewSheetAutoOpen` re-opens the sheet after login — works for every
  // entry point (FAB, `/company/[slug]`, `/shop/[handle]`, etc.) without the
  // wizard needing to know which kind of business it has.
  const [returnPath, setReturnPath] = useState("/?review=1");
  useEffect(() => {
    setReturnPath(`${window.location.pathname}?review=1`);
  }, []);

  return (
    <div className="flex flex-col items-center py-8 text-center">
      <span
        className="grid h-16 w-16 place-items-center rounded-2xl bg-mint/12 text-mint"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z" />
        </svg>
      </span>
      <h2 className="mt-5 text-[1.15rem] font-black text-strong">
        برای ثبت نظر وارد شو
      </h2>
      <p className="mt-2 text-[13.5px] leading-[2] text-muted">
        با شماره موبایلت در چند ثانیه وارد می‌شوی و بعد می‌توانی تجربه‌ات را
        ثبت کنی.
      </p>
      <Link
        href={`/login?next=${encodeURIComponent(returnPath)}`}
        className={`${BTN_PRIMARY} mt-6 w-full py-3.5 text-[15px]`}
      >
        ورود به حساب
      </Link>
    </div>
  );
}

function PickStep({
  businesses,
  onPick,
}: {
  businesses: Business[];
  onPick: (b: Business) => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return businesses.slice(0, 8);
    return businesses.filter((b) =>
      `${b.name} ${b.category} ${b.city}`.toLowerCase().includes(q),
    );
  }, [q, businesses]);

  return (
    <div>
      <h2 className="text-[1.2rem] font-black tracking-tight text-strong">
        کجا خرید کردی؟
      </h2>
      <p className="mt-1.5 text-[13px] leading-[1.9] text-muted">
        کسب‌وکاری که می‌خوای نقدش کنی رو پیدا کن.
      </p>

      <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-glass-border bg-white/[0.03] px-3.5 transition-colors focus-within:border-mint focus-within:bg-mint/[0.06]">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="مثلاً: دیجی‌کالا"
          aria-label="جست‌وجوی کسب‌وکار"
          autoFocus
          className="w-full bg-transparent py-3 text-[16px] text-white placeholder:text-white/25 outline-none [&::-webkit-search-cancel-button]:appearance-none"
        />
      </div>

      {results.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {results.map((b) => (
            <li key={b.slug}>
              <button
                type="button"
                onClick={() => onPick(b)}
                className="group flex w-full items-center gap-3 rounded-xl border border-glass-border bg-white/[0.02] p-2.5 text-right transition-colors hover:border-mint/40 hover:bg-mint/[0.06]"
              >
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-[1rem] font-bold text-white"
                  style={{ background: b.color }}
                  aria-hidden
                >
                  {b.initial}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-[0.92rem] font-bold text-strong">
                    {b.name}
                  </span>
                  <span className="truncate text-[0.76rem] text-muted">
                    {b.category} · {b.city}
                  </span>
                </span>
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-muted transition-[color,transform] group-hover:translate-x-[-3px] group-hover:text-mint" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-glass-border bg-white/[0.02] px-4 py-8 text-center">
          <p className="text-[0.9rem] font-bold text-strong">کسب‌وکاری پیدا نشد</p>
          <p className="mt-1.5 text-[12.5px] leading-[1.9] text-muted">
            با نام «{query.trim()}» نتیجه‌ای نبود — املای دیگری را امتحان کن.
          </p>
        </div>
      )}
    </div>
  );
}

function BusinessChip({ selected }: { selected: Selected }) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-glass-border bg-white/[0.03] py-1.5 pr-1.5 pl-4">
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[0.85rem] font-bold text-white"
        style={{ background: selected.color }}
        aria-hidden
      >
        {selected.initial}
      </span>
      <span className="truncate text-[13px] font-bold text-strong">
        {selected.name}
      </span>
    </div>
  );
}

function RateStep({
  selected,
  rating,
  onPick,
}: {
  selected: Selected;
  rating: number;
  onPick: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || rating;
  const palette = shown ? STAR_PALETTES[shown as Rating] : null;

  return (
    <div className="flex flex-col items-center text-center">
      <BusinessChip selected={selected} />

      <h2 className="mt-6 text-[1.2rem] font-black tracking-tight text-strong">
        چه‌قدر راضی بودی؟
      </h2>
      <p className="mt-1.5 text-[13px] text-muted">
        روی ستاره‌ها بزن — همین یک ضربه کافیه.
      </p>

      <div
        key={rating}
        dir="ltr"
        role="radiogroup"
        aria-label="امتیاز"
        className="mt-5 flex items-center justify-center gap-1"
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const lit = n <= shown;
          const litPalette = STAR_PALETTES[(shown || 1) as Rating];
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${fa(n)} ستاره`}
              onClick={() => onPick(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="flex h-[58px] w-[58px] items-center justify-center rounded-xl transition-transform duration-150 hover:scale-110 active:scale-95"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-11 w-11"
                style={
                  lit && rating >= n
                    ? {
                        filter: `drop-shadow(0 0 8px ${litPalette.glow})`,
                        animation: `review-star 0.4s ease-out ${(n - 1) * 0.06}s both`,
                      }
                    : lit
                      ? { filter: `drop-shadow(0 0 8px ${litPalette.glow})` }
                      : { opacity: 0.32 }
                }
                aria-hidden
              >
                {lit ? (
                  <>
                    <defs>
                      <linearGradient id={`rs-grad-${n}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={litPalette.light} />
                        <stop offset="55%" stopColor={litPalette.mid} />
                        <stop offset="100%" stopColor={litPalette.dark} />
                      </linearGradient>
                    </defs>
                    <path d={STAR_PATH} fill={`url(#rs-grad-${n})`} />
                  </>
                ) : (
                  <path
                    d={STAR_PATH}
                    fill="none"
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            </button>
          );
        })}
      </div>

      <div className="mt-4 h-8">
        {shown > 0 && (
          <span
            key={shown}
            className="inline-block animate-[review-pop_0.3s_ease-out] text-[1.35rem] font-black motion-reduce:animate-none"
            style={{ color: palette?.mid }}
          >
            {RATING_LABELS[shown - 1]}
          </span>
        )}
      </div>
    </div>
  );
}

function WriteStep({
  selected,
  rating,
  body,
  setBody,
  formAction,
  pending,
  error,
}: {
  selected: Selected;
  rating: number;
  body: string;
  setBody: (v: string) => void;
  formAction: (formData: FormData) => void;
  pending: boolean;
  error?: string;
}) {
  const len = body.trim().length;
  const ready = len >= BODY_MIN;
  const progress = Math.min(len / BODY_MIN, 1) * 100;

  return (
    <div>
      <div className="flex justify-center">
        <BusinessChip selected={selected} />
      </div>

      <h2 className="mt-5 text-center text-[1.2rem] font-black tracking-tight text-strong">
        تجربه‌ات رو تعریف کن
      </h2>
      <p className="mt-1.5 text-center text-[13px] leading-[1.9] text-muted">
        هرچی دقیق‌تر بنویسی، برای بقیه مفیدتره.
      </p>

      <form action={formAction} className="mt-4">
        <input type="hidden" name="slug" value={selected.slug} />
        <input type="hidden" name="rating" value={rating || ""} />

        <textarea
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={BODY_MAX}
          rows={6}
          autoFocus
          placeholder="مثلاً: کیفیت محصول عالی بود، ارسال سریع و بسته‌بندی تمیز…"
          className="w-full resize-none rounded-xl border border-glass-border bg-white/[0.03] px-4 py-3.5 text-[16px] leading-[2] text-white placeholder:text-white/25 outline-none transition-colors focus:border-mint focus:bg-mint/[0.05]"
        />

        {/* Action row: counter · progress bar · mic (trailing in RTL) */}
        <div className="mt-2.5 flex items-center gap-3">
          <span
            className={`shrink-0 text-[11px] font-bold ${
              ready ? "text-mint" : "text-muted"
            }`}
          >
            {ready ? "آماده‌ی ثبت" : `${fa(len)} از ${fa(BODY_MIN)}`}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-[width,background-color] duration-300 ${
                ready ? "bg-mint" : "bg-saffron"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <VoiceDictateButton
            onAppend={(t) =>
              setBody(body.length > 0 ? `${body.trimEnd()} ${t}` : t)
            }
          />
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-pomegr/30 bg-pomegr/10 p-3 text-[13px] font-medium text-white">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pomegr/20 text-pomegr">
              !
            </span>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending || !ready}
          className={`${BTN_PRIMARY} relative z-[1] mt-4 w-full py-3.5 text-[15px] disabled:cursor-not-allowed disabled:opacity-45`}
        >
          <span
            aria-hidden
            className="absolute inset-[-8px] rounded-full bg-[radial-gradient(circle,rgba(91,230,178,0.45),transparent_70%)] blur-[10px] z-[-1] pointer-events-none animate-[fab-pulse_2.6s_ease-in-out_infinite] motion-reduce:animate-none"
          />
          {pending ? "در حال ثبت…" : "ثبت نظر"}
        </button>
        <p className="mt-2.5 text-center text-[11.5px] leading-[1.9] text-muted">
          نظرت بعد از یک بررسی کوتاه منتشر می‌شه.
        </p>
      </form>
    </div>
  );
}

const SPARKS: { sx: string; sy: string; delay: string; color: string }[] = [
  { sx: "-46px", sy: "-34px", delay: "0.05s", color: "#5BE6B2" },
  { sx: "48px", sy: "-30px", delay: "0.12s", color: "#F5B544" },
  { sx: "-54px", sy: "20px", delay: "0.09s", color: "#7B89FF" },
  { sx: "52px", sy: "26px", delay: "0.16s", color: "#5BE6B2" },
  { sx: "0px", sy: "-56px", delay: "0.2s", color: "#F5B544" },
  { sx: "-12px", sy: "52px", delay: "0.14s", color: "#7B89FF" },
];

function DoneStep({ name, onClose }: { name: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3400);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="relative grid h-28 w-28 place-items-center">
        {/* expanding ring */}
        <span
          className="absolute h-20 w-20 rounded-full border-2 border-mint animate-[review-ring_0.9s_ease-out] motion-reduce:hidden"
          aria-hidden
        />
        {/* sparkles */}
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
        {/* check badge */}
        <div className="grid h-20 w-20 place-items-center rounded-full bg-mint/15 animate-[review-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:animate-none">
          <svg viewBox="0 0 52 52" className="h-11 w-11" aria-hidden>
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

      <h2 className="mt-5 text-[1.3rem] font-black text-strong">
        نظرت ثبت شد!
      </h2>
      <p className="mt-2 text-[13.5px] leading-[2] text-muted">
        {name ? (
          <>
            نظرت درباره‌ی{" "}
            <span className="font-bold text-strong">«{name}»</span> بعد از یک
            بررسی کوتاه منتشر می‌شه.
          </>
        ) : (
          "نظرت بعد از یک بررسی کوتاه منتشر می‌شه."
        )}{" "}
        ممنون که به بقیه کمک کردی.
      </p>

      <button
        type="button"
        onClick={onClose}
        className={`${BTN_PRIMARY} mt-6 w-full py-3.5 text-[15px]`}
      >
        باشه
      </button>
    </div>
  );
}
