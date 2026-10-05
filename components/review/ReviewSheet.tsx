"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { STAR_PATH } from "@/components/ui/RatingStars";
import { useSessionStatus } from "@/components/layout/useSessionStatus";
import { BTN_PRIMARY } from "@/components/ui/styles";
import type { Business } from "@/lib/data/businesses";
import { submitQuickReview } from "./actions";

export type ReviewPrefill = { slug: string; name: string };

/** Existing loopback-only adapter; public submissions keep the server action. */
export type LocalReviewPreview = {
  initialValue?: { rating: number; body: string };
  submit: typeof submitQuickReview;
};

/** Unsent text stays in provider memory, never in new browser storage. */
export type ReviewDraft = {
  business: ReviewPrefill;
  rating: number;
  body: string;
  step: "rate" | "write";
};

type Step = "pick" | "rate" | "write" | "done";
type Selected = ReviewPrefill & { meta: string };
const BODY_MIN = 10;
const BODY_MAX = 2000;
const RATING_LABELS = ["خیلی بد", "بد", "متوسط", "خوب", "عالی"];
const SECONDARY = "inline-flex min-h-11 items-center justify-center rounded-xl border border-glass-border bg-canvas px-4 py-2 text-sm font-semibold text-strong transition-colors hover:border-mint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint";
const fa = (value: number) => value.toLocaleString("fa-IR");

function toSelected(business: Business): Selected {
  return { slug: business.slug, name: business.name, meta: business.category + " · " + business.city };
}

function resolveSelected(prefill: ReviewPrefill | null, businesses: Business[]): Selected | null {
  if (!prefill) return null;
  const business = businesses.find(item => item.slug === prefill.slug);
  return business ? toSelected(business) : { ...prefill, meta: "" };
}

export function ReviewSheet({
  isOpen,
  onClose,
  prefill,
  businesses,
  localPreview,
  initialDraft,
  onDraftChange,
  onDraftClear,
  getDraft,
}: {
  isOpen: boolean;
  onClose: () => void;
  prefill: ReviewPrefill | null;
  businesses: Business[];
  localPreview?: LocalReviewPreview;
  initialDraft?: ReviewDraft;
  onDraftChange?: (draft: ReviewDraft) => void;
  onDraftClear?: (slug: string) => void;
  getDraft?: (slug: string) => ReviewDraft | undefined;
}) {
  const hasPicker = !prefill;
  const [step, setStep] = useState<Step>(initialDraft?.step ?? (hasPicker ? "pick" : "rate"));
  const [selected, setSelected] = useState<Selected | null>(() =>
    resolveSelected(initialDraft?.business ?? prefill, businesses),
  );
  const [rating, setRating] = useState(initialDraft?.rating ?? localPreview?.initialValue?.rating ?? 0);
  const [body, setBody] = useState(initialDraft?.body ?? localPreview?.initialValue?.body ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [confirmClose, setConfirmClose] = useState(false);
  const [viewport, setViewport] = useState<{ height: number; top: number }>();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const session = useSessionStatus();
  const localOnly = localPreview !== undefined;
  const loggedIn = localOnly || session?.loggedIn === true;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isOpen) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";
    titleRef.current?.focus({ preventScroll: true });

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const visualViewport = window.visualViewport;
    const update = () => setViewport({
      height: visualViewport?.height ?? window.innerHeight,
      top: visualViewport?.offsetTop ?? 0,
    });
    update();
    visualViewport?.addEventListener("resize", update);
    visualViewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      visualViewport?.removeEventListener("resize", update);
      visualViewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && dialogRef.current?.open) titleRef.current?.focus({ preventScroll: true });
  }, [isOpen, step, confirmClose, loggedIn]);

  useEffect(() => {
    if (!isOpen || !selected || step === "done" || (rating === 0 && body.length === 0)) return;
    onDraftChange?.({
      business: { slug: selected.slug, name: selected.name },
      rating,
      body,
      step: step === "write" ? "write" : "rate",
    });
  }, [isOpen, selected, rating, body, step, onDraftChange]);

  const requestClose = useCallback(() => {
    if (submitting) return;
    if (step !== "done" && selected && (rating > 0 || body.length > 0)) {
      setConfirmClose(true);
    } else {
      onClose();
    }
  }, [submitting, step, selected, rating, body, onClose]);

  const discardAndClose = () => {
    if (selected) onDraftClear?.(selected.slug);
    setSelected(null);
    setRating(0);
    setBody("");
    onClose();
  };

  const selectBusiness = (business: Business) => {
    const saved = getDraft?.(business.slug);
    setSelected(toSelected(business));
    setRating(saved?.rating ?? 0);
    setBody(saved?.body ?? "");
    setSubmitError(undefined);
    setStep(saved?.step ?? "rate");
  };

  const handleSubmit = async () => {
    if (!selected || submitting || rating < 1 || rating > 5 || body.trim().length < BODY_MIN) return;
    setSubmitting(true);
    setSubmitError(undefined);
    const formData = new FormData();
    formData.set("slug", selected.slug);
    formData.set("rating", String(rating));
    formData.set("body", body);
    try {
      const result = await (localPreview?.submit ?? submitQuickReview)({ ok: false }, formData);
      if (result.ok) {
        onDraftClear?.(selected.slug);
        setStep("done");
      } else {
        setSubmitError(result.error || "تجربه ثبت نشد. متن تو حفظ شده؛ دوباره تلاش کن.");
      }
    } catch (error: unknown) {
      console.error("[ReviewSheet] submit failed", { slug: selected.slug, error });
      setSubmitError("تجربه ثبت نشد. متن تو حفظ شده؛ دوباره تلاش کن.");
    } finally {
      setSubmitting(false);
    }
  };

  const canGoBack = loggedIn && (step === "write" || (step === "rate" && hasPicker));
  const title = confirmClose
    ? "پیش‌نویست را نگه داریم؟"
    : step === "done"
      ? (localOnly ? "در این مرورگر ذخیره شد" : "تجربه‌ات ثبت شد")
      : "ثبت تجربه";
  const progress = hasPicker
    ? ({ pick: "۱ از ۳", rate: "۲ از ۳", write: "۳ از ۳", done: "" } as const)[step]
    : ({ pick: "", rate: "۱ از ۲", write: "۲ از ۲", done: "" } as const)[step];

  return (
    <dialog
      ref={dialogRef}
      aria-label="ثبت نظر"
      aria-describedby="review-context"
      onKeyDown={event => {
        if (event.key !== "Tab" || event.defaultPrevented) return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]',
        )).filter(element => element.tabIndex >= 0 && element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first || !last) {
          event.preventDefault();
          titleRef.current?.focus();
          return;
        }
        const active = document.activeElement;
        const isControl = active instanceof HTMLElement && controls.includes(active);
        if (event.shiftKey && (active === first || !isControl)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (active === last || !isControl)) {
          event.preventDefault();
          first.focus();
        }
      }}
      onCancel={event => {
        event.preventDefault();
        if (confirmClose) setConfirmClose(false);
        else requestClose();
      }}
      className="fixed inset-x-0 top-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-strong backdrop:bg-[#1F3029]/45"
      style={viewport ? { height: viewport.height, top: viewport.top } : undefined}
    >
      <div
        className="flex h-full items-end justify-center p-2 sm:items-center sm:p-6"
        onClick={event => {
          if (event.target === event.currentTarget) requestClose();
        }}
      >
        <div className="flex max-h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-glass-border bg-glass shadow-xl sm:max-w-[480px]">
          <div className="flex shrink-0 items-start gap-3 border-b border-glass-border px-4 py-3">
            {canGoBack && !confirmClose ? (
              <button
                type="button"
                aria-label="مرحله قبل"
                disabled={submitting}
                onClick={() => setStep(step === "write" ? "rate" : "pick")}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted hover:bg-canvas focus-visible:outline-2 focus-visible:outline-mint disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </button>
            ) : null}
            <div className="min-w-0 flex-1 py-1">
              <h2 ref={titleRef} tabIndex={-1} className="text-lg font-bold leading-7 focus:outline-none">{title}</h2>
              <p id="review-context" className="mt-1 text-sm leading-6 text-muted">
                {selected ? selected.name : "کافه یا رستورانی را که تجربه کرده‌ای انتخاب کن."}
              </p>
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="بستن"
              disabled={submitting}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted hover:bg-canvas focus-visible:outline-2 focus-visible:outline-mint disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            {confirmClose ? (
              <div>
                <p className="text-sm leading-7 text-muted">می‌توانی بعداً در همین صفحه ادامه بدهی. پیش‌نویس ارسال نشده و با تازه‌کردن صفحه یا بستن این تب از بین می‌رود.</p>
                <div className="mt-5 flex flex-col gap-3">
                  <button type="button" onClick={() => setConfirmClose(false)} className={BTN_PRIMARY + " min-h-11 w-full justify-center px-4 py-3"}>ادامه نوشتن</button>
                  <button type="button" onClick={onClose} className={SECONDARY}>بستن و نگه‌داشتن پیش‌نویس</button>
                  <button type="button" onClick={discardAndClose} className="min-h-11 rounded-xl px-4 py-2 text-sm font-semibold text-pomegr underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-pomegr">حذف پیش‌نویس</button>
                </div>
              </div>
            ) : !localOnly && session === null ? (
              <p role="status" className="py-8 text-sm text-muted">در حال بررسی ورود…</p>
            ) : !loggedIn ? (
              <AuthGate />
            ) : (
              <>
                {step !== "done" ? <p className="mb-4 text-xs font-semibold text-muted" aria-live="polite">مرحلهٔ {progress}</p> : null}
                {step === "pick" ? <PickStep businesses={businesses} onPick={selectBusiness} /> : null}
                {step === "rate" && selected ? (
                  <RateStep rating={rating} onPick={setRating} onContinue={() => setStep("write")} />
                ) : null}
                {step === "write" && selected ? (
                  <WriteStep
                    rating={rating}
                    body={body}
                    onChange={setBody}
                    onSubmit={handleSubmit}
                    pending={submitting}
                    error={submitError}
                    localOnly={localOnly}
                  />
                ) : null}
                {step === "done" ? (
                  <div>
                    <div role="status" className="rounded-xl border border-mint/25 bg-mint/5 p-4 text-sm leading-7 text-strong">
                      {localOnly
                        ? "این تجربه فقط در همین مرورگر ذخیره شده و نظر عمومی نیست."
                        : "تجربه‌ات دریافت شد و در انتظار بررسی است. هنوز منتشر نشده."}
                    </div>
                    <button type="button" onClick={onClose} className={BTN_PRIMARY + " mt-5 min-h-11 w-full justify-center px-4 py-3"}>بازگشت به صفحه</button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}

function AuthGate() {
  const [returnPath, setReturnPath] = useState("/?review=1");
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("review", "1");
    setReturnPath(url.pathname + url.search + url.hash);
  }, []);
  const publicLoginClosed = process.env.NODE_ENV === "production";
  return (
    <div>
      <h3 className="text-base font-bold text-strong">ثبت تجربه با ورود</h3>
      <p className="mt-2 text-sm leading-7 text-muted">
        {publicLoginClosed
          ? "در نسخهٔ عمومی در حال آماده‌سازی است. می‌توانی اطلاعات کافه‌ها را بدون ورود ببینی."
          : "برای ثبت تجربه وارد حساب شو؛ بعد به همین صفحه برمی‌گردی."}
      </p>
      <Link href={"/login?next=" + encodeURIComponent(returnPath)} className={SECONDARY + " mt-5 w-full"}>ورود به حساب</Link>
    </div>
  );
}

function PickStep({ businesses, onPick }: { businesses: Business[]; onPick: (business: Business) => void }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized
      ? businesses.filter(business => (business.name + " " + business.category + " " + business.city).toLowerCase().includes(normalized))
      : businesses.slice(0, 8);
  }, [query, businesses]);
  if (businesses.length === 0) {
    return <p className="rounded-xl border border-glass-border bg-canvas p-4 text-sm leading-7 text-muted">هنوز کسب‌وکاری برای ثبت تجربه در فهرست عمومی نداریم. بعد از انتشار اطلاعات، این بخش فعال می‌شود.</p>;
  }
  return (
    <div>
      <label htmlFor="review-business" className="block text-sm font-semibold text-strong">نام کافه یا رستوران</label>
      <input
        id="review-business"
        type="search"
        value={query}
        onChange={event => setQuery(event.target.value)}
        placeholder="نام جایی که رفتی"
        aria-label="جست‌وجوی کسب‌وکار"
        className="mt-2 min-h-12 w-full rounded-xl border border-glass-border bg-canvas px-3 py-3 text-base text-strong placeholder:text-muted focus:outline-2 focus:outline-mint"
      />
      {results.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {results.map(business => (
            <li key={business.slug}>
              <button type="button" onClick={() => onPick(business)} className="flex min-h-14 w-full flex-col items-start rounded-xl border border-glass-border px-4 py-3 text-start hover:bg-canvas focus-visible:outline-2 focus-visible:outline-mint">
                <span className="break-words text-sm font-bold text-strong">{business.name}</span>
                <span className="mt-1 text-sm text-muted">{business.category} · {business.city}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p role="status" className="mt-4 text-sm leading-7 text-muted">با این نام چیزی پیدا نشد؛ نام کوتاه‌تر یا املای دیگری را امتحان کن.</p>
      )}
    </div>
  );
}

function RateStep({ rating, onPick, onContinue }: { rating: number; onPick: (rating: number) => void; onContinue: () => void }) {
  return (
    <div>
      <h3 className="text-base font-bold text-strong">چقدر راضی بودی؟</h3>
      <p className="mt-2 text-sm leading-7 text-muted">امتیاز تجربهٔ خودت را انتخاب کن. قبل از ثبت می‌توانی آن را تغییر بدهی.</p>
      <div dir="ltr" role="radiogroup" aria-label="امتیاز" className="mt-5 flex justify-center gap-1 min-[360px]:gap-2">
        {[1, 2, 3, 4, 5].map(value => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={fa(value) + " ستاره"}
            tabIndex={rating === value || (!rating && value === 1) ? 0 : -1}
            onClick={() => onPick(value)}
            onKeyDown={event => {
              let next = value;
              if (event.key === "ArrowRight" || event.key === "ArrowDown") next = value === 5 ? 1 : value + 1;
              else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = value === 1 ? 5 : value - 1;
              else if (event.key === "Home") next = 1;
              else if (event.key === "End") next = 5;
              else return;
              event.preventDefault();
              onPick(next);
              event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next - 1]?.focus();
            }}
            className={"grid h-12 w-12 shrink-0 place-items-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint " + (value <= rating ? "bg-mint/10 text-mint" : "bg-canvas text-muted")}
          >
            <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden>
              <path d={STAR_PATH} fill={value <= rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>
      <p aria-live="polite" className="mt-4 min-h-7 text-center text-sm font-semibold text-strong">
        {rating ? fa(rating) + " از ۵ · " + RATING_LABELS[rating - 1] : "هنوز امتیازی انتخاب نشده"}
      </p>
      <button type="button" onClick={onContinue} disabled={!rating} className={BTN_PRIMARY + " mt-5 min-h-11 w-full justify-center px-4 py-3 disabled:opacity-50"}>ادامه</button>
    </div>
  );
}

function WriteStep({
  rating, body, onChange, onSubmit, pending, error, localOnly,
}: {
  rating: number;
  body: string;
  onChange: (body: string) => void;
  onSubmit: () => void;
  pending: boolean;
  error?: string;
  localOnly: boolean;
}) {
  const length = body.trim().length;
  const ready = length >= BODY_MIN && length <= BODY_MAX;
  return (
    <form onSubmit={event => { event.preventDefault(); onSubmit(); }} aria-busy={pending}>
      <p className="mb-4 text-sm font-semibold text-strong">امتیاز تو: {fa(rating)} از ۵ · {RATING_LABELS[rating - 1]}</p>
      <label htmlFor="review-body" className="block text-base font-bold text-strong">تجربه‌ات را تعریف کن</label>
      <p id="review-body-hint" className="mt-2 text-sm leading-7 text-muted">برای چه کاری رفتی؟ برخورد، کیفیت یا فضای آنجا چطور بود؟ اطلاعات شخصی خودت یا دیگران را ننویس.</p>
      <textarea
        id="review-body"
        name="body"
        aria-label="متن تجربه"
        aria-describedby="review-body-hint review-body-count"
        aria-invalid={error ? true : undefined}
        value={body}
        disabled={pending}
        onChange={event => onChange(event.target.value)}
        maxLength={BODY_MAX}
        rows={5}
        className="mt-3 w-full resize-y rounded-xl border border-glass-border bg-canvas px-3 py-3 text-base leading-8 text-strong placeholder:text-muted focus:outline-2 focus:outline-mint"
      />
      <p id="review-body-count" className="mt-2 text-sm text-muted" aria-live="polite">
        {length < BODY_MIN ? "حداقل " + fa(BODY_MIN) + " نویسه؛ " + fa(BODY_MIN - length) + " نویسهٔ دیگر بنویس." : fa(length) + " از " + fa(BODY_MAX) + " نویسه"}
      </p>
      {error ? <p role="alert" className="mt-3 rounded-xl border border-pomegr/30 bg-pomegr/5 p-3 text-sm leading-7 text-pomegr">{error}</p> : null}
      <button type="submit" disabled={pending || !ready} className={BTN_PRIMARY + " mt-5 min-h-11 w-full justify-center px-4 py-3 disabled:opacity-50"}>{pending ? "در حال ثبت…" : "ثبت نظر"}</button>
      <p className="mt-3 text-sm leading-7 text-muted">{localOnly ? "فقط در این مرورگر ذخیره می‌شود؛ نظر عمومی نیست." : "پس از بررسی منتشر می‌شود؛ ثبت به معنای انتشار فوری نیست."}</p>
    </form>
  );
}
