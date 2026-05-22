"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  STAR_PATH,
  STAR_PALETTES,
  type Rating,
} from "@/components/ui/RatingStars";
import { BTN_PRIMARY, GLASS } from "@/components/ui/styles";
import { setFlash } from "@/lib/flash";
import { TITLE_SUGGESTIONS } from "@/lib/data/reviews";
import { submitReview, type WriteReviewState } from "./actions";

const initial: WriteReviewState = { ok: false };

const BODY_MIN = 30;
const BODY_MAX = 2000;
const TITLE_MAX = 80;

const PROOF_TYPES = [
  { value: "invoice", label: "فاکتور خرید" },
  { value: "sms", label: "پیامک تأیید سفارش" },
  { value: "tracking", label: "کد رهگیری پستی" },
  { value: "receipt", label: "رسید پرداخت" },
];

const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

const CURRENT_JALALI_YEAR = 1405;
const JALALI_YEARS = Array.from({ length: 11 }, (_, i) => CURRENT_JALALI_YEAR - i);

function jalaliDaysInMonth(jm: number, jy: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  const r = jy % 33;
  return [1, 5, 9, 13, 17, 22, 26, 30].includes(r) ? 30 : 29;
}

function jalaliToIso(jy: number, jm: number, jd: number): string {
  const jy0 = jy - 979;
  const jMonthDays = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  let j_day = 365 * jy0 + Math.floor(jy0 / 33) * 8 + Math.floor((jy0 % 33 + 3) / 4);
  for (let i = 0; i < jm - 1; i++) j_day += jMonthDays[i];
  j_day += jd;

  const g_day = j_day + 79;
  let gy = 1600 + 400 * Math.floor(g_day / 146097);
  let g_rem = g_day % 146097;
  let leap = true;
  if (g_rem >= 36525) {
    g_rem--;
    gy += 100 * Math.floor(g_rem / 36524);
    g_rem %= 36524;
    if (g_rem >= 365) g_rem++;
    else leap = false;
  }
  gy += 4 * Math.floor(g_rem / 1461);
  g_rem %= 1461;
  if (g_rem >= 366) {
    leap = false;
    g_rem--;
    gy += Math.floor(g_rem / 365);
    g_rem %= 365;
  }
  const gMonths = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let rem = g_rem + 1;
  let gm = 0;
  for (gm = 0; gm < 12 && rem > gMonths[gm]; gm++) rem -= gMonths[gm];
  return `${gy}-${String(gm + 1).padStart(2, "0")}-${String(rem).padStart(2, "0")}`;
}

const fa = (n: number) => n.toLocaleString("fa-IR");

const LABEL = "text-[13px] font-bold text-strong";
const OPTIONAL = "font-normal text-muted";
const HINT = "text-[12px] leading-[1.9] text-muted";
const ERR_TEXT = "text-[12px] font-bold text-pomegr";
const FIELD =
  "w-full rounded-xl border bg-white/[0.03] px-4 py-3.5 text-[16px] text-white " +
  "placeholder:text-white/25 outline-none backdrop-blur-md transition-colors";

function fieldBorder(invalid: boolean): string {
  return invalid
    ? "border-pomegr/55 bg-pomegr/[0.05]"
    : "border-glass-border focus:border-mint focus:bg-mint/[0.06]";
}

export function WriteReviewForm({
  slug,
  businessName,
}: {
  slug: string;
  businessName: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(submitReview, initial);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [body, setBody] = useState("");
  const [proofName, setProofName] = useState<string | null>(null);
  const proofInput = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Jalali date state
  const [jYear, setJYear] = useState("");
  const [jMonth, setJMonth] = useState("");
  const [jDay, setJDay] = useState("");
  const isoDate =
    jYear && jMonth && jDay
      ? jalaliToIso(Number(jYear), Number(jMonth), Number(jDay))
      : "";

  const daysInSelectedMonth =
    jYear && jMonth
      ? jalaliDaysInMonth(Number(jMonth), Number(jYear))
      : 31;

  // Close suggestions popover on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    if (showSuggestions) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSuggestions]);

  useEffect(() => {
    if (state.ok && state.redirectUrl) {
      setFlash("نظرت ثبت شد و پس از بررسی منتشر می‌شود.");
      router.push(state.redirectUrl);
    }
  }, [state.ok, state.redirectUrl, router]);

  const fe = state.fieldErrors ?? {};
  const shownRating = hover || rating;
  const palette = shownRating ? STAR_PALETTES[shownRating as Rating] : null;
  const gradId = `wr-star-grad-${shownRating}`;
  const bodyLen = body.length;
  const bodyInvalid = bodyLen > 0 && (bodyLen < BODY_MIN || bodyLen > BODY_MAX);

  function clearProof() {
    if (proofInput.current) proofInput.current.value = "";
    setProofName(null);
  }

  return (
    <div className={`${GLASS} p-6 sm:p-8`}>
      <h1 className="text-[1.4rem] font-black tracking-tight text-strong">
        نوشتن نظر
      </h1>
      <p className="mt-2 text-[14px] leading-[1.9] text-muted">
        تجربه‌ات از{" "}
        <span className="font-bold text-strong">{businessName}</span> را با
        دیگران در میان بگذار.
      </p>

      <form action={action} noValidate className="mt-6 space-y-6">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="rating" value={rating || ""} />
        <input type="hidden" name="purchaseDate" value={isoDate} />

        {/* 1 — Rating */}
        <fieldset>
          <legend className={LABEL}>امتیاز شما</legend>
          <div
            role="radiogroup"
            aria-label="امتیاز"
            dir="ltr"
            className="mt-2 flex items-center gap-0.5"
          >
            {[1, 2, 3, 4, 5].map((n) => {
              const lit = n <= shownRating;
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${fa(n)} ستاره`}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onFocus={() => setHover(n)}
                  onBlur={() => setHover(0)}
                  className="flex h-12 w-12 items-center justify-center rounded-lg transition-transform duration-150 hover:scale-110"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-9 w-9"
                    style={
                      lit && palette
                        ? { filter: `drop-shadow(0 0 7px ${palette.glow})` }
                        : { opacity: 0.4 }
                    }
                    aria-hidden
                  >
                    {lit && palette ? (
                      <>
                        <defs>
                          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={palette.light} />
                            <stop offset="55%" stopColor={palette.mid} />
                            <stop offset="100%" stopColor={palette.dark} />
                          </linearGradient>
                        </defs>
                        <path d={STAR_PATH} fill={`url(#${gradId})`} />
                      </>
                    ) : (
                      <path
                        d={STAR_PATH}
                        fill="none"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="1.2"
                        strokeLinejoin="round"
                      />
                    )}
                  </svg>
                </button>
              );
            })}
          </div>
          {fe.rating && <p className={`${ERR_TEXT} mt-1.5`}>{fe.rating}</p>}
        </fieldset>

        {/* 2 — Title (required). The icon sits on the physical left as a real
            flex child — no absolute overlap — and toggles the suggestions menu. */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <label htmlFor="title" className={LABEL}>عنوان</label>
            <span className={`text-[11px] ${title.length > TITLE_MAX ? "text-pomegr" : "text-muted"}`}>
              {fa(title.length)}/{fa(TITLE_MAX)}
            </span>
          </div>
          <div ref={suggestionsRef} className="relative">
            <div
              className={`flex items-center rounded-xl border bg-white/[0.03] backdrop-blur-md transition-colors ${fieldBorder(
                Boolean(fe.title),
              )}`}
            >
              <input
                id="title"
                name="title"
                type="text"
                maxLength={TITLE_MAX}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="در یک جمله، تجربه‌ات را خلاصه کن"
                className="min-w-0 flex-1 bg-transparent py-3.5 pr-4 pl-1 text-[16px] text-white placeholder:text-white/25 outline-none"
              />
              <button
                type="button"
                aria-label="پیشنهاد عنوان"
                aria-expanded={showSuggestions}
                onClick={() => setShowSuggestions((v) => !v)}
                className={`m-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  showSuggestions
                    ? "bg-mint/20 text-mint"
                    : "text-muted hover:bg-white/[0.07] hover:text-mint"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                  <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" />
                </svg>
              </button>
            </div>
            {showSuggestions && (
              <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-[260px] overflow-y-auto rounded-xl border border-glass-border bg-[rgba(12,16,26,0.97)] shadow-[0_12px_36px_rgba(0,0,0,0.55)]">
                <p className="border-b border-glass-border px-4 py-2 text-[11px] font-bold text-muted">
                  یک پیشنهاد را انتخاب کن
                </p>
                {TITLE_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setTitle(s);
                      setShowSuggestions(false);
                    }}
                    className="block w-full px-4 py-2.5 text-right text-[13px] text-muted transition-colors hover:bg-mint/10 hover:text-mint"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          {fe.title && <p className={ERR_TEXT}>{fe.title}</p>}
        </div>

        {/* 3 — Body (required) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <label htmlFor="body" className={LABEL}>متن نظر</label>
            <span className={`text-[11px] ${bodyInvalid ? "text-pomegr" : "text-muted"}`}>
              {fa(bodyLen)}/{fa(BODY_MAX)}
            </span>
          </div>
          <textarea
            id="body"
            name="body"
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="چه چیزی خوب بود؟ چه چیزی می‌توانست بهتر باشد؟ هرچه دقیق‌تر بنویسی، برای بقیه مفیدتر است."
            className={`${FIELD} resize-y leading-[1.9] ${fieldBorder(Boolean(fe.body))}`}
          />
          {fe.body ? (
            <p className={ERR_TEXT}>{fe.body}</p>
          ) : (
            <p className={HINT}>حداقل {fa(BODY_MIN)} کاراکتر.</p>
          )}
        </div>

        {/* 4 — Purchase date — Persian (Jalali) calendar (optional).
            Three borderless selects share one bordered box — no dividers. */}
        <div className="flex flex-col gap-2">
          <span className={LABEL}>
            تاریخ خرید <span className={OPTIONAL}>(اختیاری)</span>
          </span>
          <div
            className={`flex items-center overflow-hidden rounded-xl border bg-white/[0.03] backdrop-blur-md transition-colors ${fieldBorder(
              Boolean(fe.purchaseDate),
            )}`}
          >
            <select
              value={jYear}
              onChange={(e) => {
                setJYear(e.target.value);
                setJDay("");
              }}
              aria-label="سال خرید"
              className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent px-2 py-3.5 text-center text-[15px] text-white outline-none [color-scheme:dark]"
            >
              <option value="">سال</option>
              {JALALI_YEARS.map((y) => (
                <option key={y} value={y}>
                  {fa(y)}
                </option>
              ))}
            </select>
            <select
              value={jMonth}
              onChange={(e) => {
                setJMonth(e.target.value);
                setJDay("");
              }}
              aria-label="ماه خرید"
              className="min-w-0 flex-[1.4] cursor-pointer appearance-none bg-transparent px-2 py-3.5 text-center text-[15px] text-white outline-none [color-scheme:dark]"
            >
              <option value="">ماه</option>
              {JALALI_MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={jDay}
              onChange={(e) => setJDay(e.target.value)}
              aria-label="روز خرید"
              disabled={!jMonth || !jYear}
              className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent px-2 py-3.5 text-center text-[15px] text-white outline-none [color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <option value="">روز</option>
              {Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1).map(
                (d) => (
                  <option key={d} value={d}>
                    {fa(d)}
                  </option>
                ),
              )}
            </select>
          </div>
          {fe.purchaseDate && <p className={ERR_TEXT}>{fe.purchaseDate}</p>}
        </div>

        {/* 5 — Proof of purchase (optional) */}
        <div className="rounded-xl border border-glass-border bg-white/[0.02] p-4">
          <p className={LABEL}>
            سند خرید <span className={OPTIONAL}>(اختیاری)</span>
          </p>
          <p className={`${HINT} mt-1`}>
            با بارگذاری فاکتور، پیامک تأیید یا کد رهگیری، نظرت پس از یک بررسی
            خصوصی به «نقد تأییدشده» ارتقا می‌یابد. بدون سند هم نظرت کاملاً معتبر
            است.
          </p>

          <div className="mt-3 flex flex-col gap-3">
            {proofName ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-mint/35 bg-mint/[0.06] px-4 py-3">
                <span className="truncate text-[13px] font-bold text-mint">{proofName}</span>
                <button
                  type="button"
                  onClick={clearProof}
                  className="shrink-0 text-[12px] font-bold text-muted hover:text-pomegr"
                >
                  حذف
                </button>
              </div>
            ) : (
              <label
                className={`flex cursor-pointer items-center justify-center rounded-xl border border-dashed px-4 py-3 text-[13px] font-bold transition-colors ${
                  fe.proof
                    ? "border-pomegr/55 text-pomegr"
                    : "border-glass-border text-muted hover:border-mint hover:text-mint"
                }`}
              >
                انتخاب فایل — تصویر یا PDF (حداکثر ۵ مگابایت)
                <input
                  ref={proofInput}
                  type="file"
                  name="proof"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setProofName(e.target.files?.[0]?.name ?? null)}
                  className="sr-only"
                />
              </label>
            )}

            {proofName && (
              <div className="flex flex-col gap-2">
                <label htmlFor="proofType" className={LABEL}>نوع سند</label>
                <select
                  id="proofType"
                  name="proofType"
                  defaultValue=""
                  className={`${FIELD} [color-scheme:dark] ${fieldBorder(Boolean(fe.proof))}`}
                >
                  <option value="" disabled>یک گزینه را انتخاب کن</option>
                  {PROOF_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {fe.proof && <p className={`${ERR_TEXT} mt-2`}>{fe.proof}</p>}
        </div>

        {state.error && (
          <div className="flex items-start gap-3 rounded-xl border border-pomegr/30 bg-pomegr/10 p-3.5 text-[13.5px] font-medium text-white">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pomegr/20 text-pomegr">!</span>
            {state.error}
          </div>
        )}

        <div className="space-y-2.5">
          <button
            type="submit"
            disabled={pending}
            className={`${BTN_PRIMARY} w-full py-3.5 text-[15px] disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {pending ? "در حال ثبت…" : "ثبت نظر"}
          </button>
          <p className={`${HINT} text-center`}>
            نظرت پس از بررسی توسط تیم نظراتو منتشر می‌شود.
          </p>
        </div>
      </form>
    </div>
  );
}
