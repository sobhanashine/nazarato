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
import { submitReview, type WriteReviewState } from "./actions";

const initial: WriteReviewState = { ok: false };

const BODY_MIN = 30;
const BODY_MAX = 2000;
const TITLE_MAX = 80;

/** `proof_type` options — mirror the company-side values in `actions.ts`. */
const PROOF_TYPES = [
  { value: "invoice", label: "فاکتور خرید" },
  { value: "sms", label: "پیامک تأیید سفارش" },
  { value: "tracking", label: "کد رهگیری پستی" },
  { value: "receipt", label: "رسید پرداخت" },
];

const fa = (n: number) => n.toLocaleString("fa-IR");

const LABEL = "text-[13px] font-bold text-strong";
const OPTIONAL = "font-normal text-muted";
const HINT = "text-[12px] leading-[1.9] text-muted";
const ERR_TEXT = "text-[12px] font-bold text-pomegr";
const FIELD =
  "w-full rounded-xl border bg-white/[0.03] px-4 py-3.5 text-[16px] text-white " +
  "placeholder:text-white/25 outline-none backdrop-blur-md transition-colors";

/** Field border colour — red when the field carries an error. */
function fieldBorder(invalid: boolean): string {
  return invalid
    ? "border-pomegr/55 bg-pomegr/[0.05]"
    : "border-glass-border focus:border-mint focus:bg-mint/[0.06]";
}

/**
 * The `/company/[slug]/write-review` form — a single-page, vertically-stepped
 * review submission. State lives here (controlled title/body for live counters,
 * `rating`/`hover` for the star selector); all validation is re-done in
 * `submitReview` on the server. On success a flash toast is stashed and the
 * client navigates to the company profile.
 */
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
  const [body, setBody] = useState("");
  const [proofName, setProofName] = useState<string | null>(null);
  const proofInput = useRef<HTMLInputElement>(null);

  // Success → stash the toast so it survives the navigation, then go.
  useEffect(() => {
    if (state.ok && state.redirectUrl) {
      setFlash("نظرت ثبت شد و پس از بررسی منتشر می‌شود.");
      router.push(state.redirectUrl);
    }
  }, [state.ok, state.redirectUrl, router]);

  const fe = state.fieldErrors ?? {};
  // Hover previews the rating; falls back to the committed value. The whole
  // row recolours to the shown rating's palette — red at 1★, mint at 5★.
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

        {/* 1 — Rating selector. Each target is 48×48 (≥ 44×44 UX rule); the
            stars carry the same per-rating gradient + glow as <RatingStars>. */}
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
                          <linearGradient
                            id={gradId}
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="1"
                          >
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

        {/* 2 — Title (optional). */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <label htmlFor="title" className={LABEL}>
              عنوان
            </label>
            <span
              className={`text-[11px] ${
                title.length > TITLE_MAX ? "text-pomegr" : "text-muted"
              }`}
            >
              {fa(title.length)}/{fa(TITLE_MAX)}
            </span>
          </div>
          <input
            id="title"
            name="title"
            type="text"
            maxLength={TITLE_MAX}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="در یک جمله، تجربه‌ات را خلاصه کن"
            className={`${FIELD} ${fieldBorder(Boolean(fe.title))}`}
          />
          {fe.title && <p className={ERR_TEXT}>{fe.title}</p>}
        </div>

        {/* 3 — Body (required, 30–2000 chars). */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <label htmlFor="body" className={LABEL}>
              متن نظر
            </label>
            <span
              className={`text-[11px] ${
                bodyInvalid ? "text-pomegr" : "text-muted"
              }`}
            >
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
            className={`${FIELD} resize-y leading-[1.9] ${fieldBorder(
              Boolean(fe.body),
            )}`}
          />
          {fe.body ? (
            <p className={ERR_TEXT}>{fe.body}</p>
          ) : (
            <p className={HINT}>حداقل {fa(BODY_MIN)} کاراکتر.</p>
          )}
        </div>

        {/* 5 — Purchase date (optional). */}
        <div className="flex flex-col gap-2">
          <label htmlFor="purchaseDate" className={LABEL}>
            تاریخ خرید <span className={OPTIONAL}>(اختیاری)</span>
          </label>
          <input
            id="purchaseDate"
            name="purchaseDate"
            type="date"
            className={`${FIELD} [color-scheme:dark] ${fieldBorder(
              Boolean(fe.purchaseDate),
            )}`}
          />
          {fe.purchaseDate && <p className={ERR_TEXT}>{fe.purchaseDate}</p>}
        </div>

        {/* 6 — Proof of purchase (optional → eligible for «نقد تأییدشده»). */}
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
                <span className="truncate text-[13px] font-bold text-mint">
                  {proofName}
                </span>
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
                  onChange={(e) =>
                    setProofName(e.target.files?.[0]?.name ?? null)
                  }
                  className="sr-only"
                />
              </label>
            )}

            {proofName && (
              <div className="flex flex-col gap-2">
                <label htmlFor="proofType" className={LABEL}>
                  نوع سند
                </label>
                <select
                  id="proofType"
                  name="proofType"
                  defaultValue=""
                  className={`${FIELD} [color-scheme:dark] ${fieldBorder(
                    Boolean(fe.proof),
                  )}`}
                >
                  <option value="" disabled>
                    یک گزینه را انتخاب کن
                  </option>
                  {PROOF_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {fe.proof && <p className={`${ERR_TEXT} mt-2`}>{fe.proof}</p>}
        </div>

        {state.error && (
          <div className="flex items-start gap-3 rounded-xl border border-pomegr/30 bg-pomegr/10 p-3.5 text-[13.5px] font-medium text-white">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pomegr/20 text-pomegr">
              !
            </span>
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
