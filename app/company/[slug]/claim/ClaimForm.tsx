"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BTN_PRIMARY, GLASS } from "@/components/ui/styles";
import { setFlash } from "@/lib/flash";
import { submitClaim, type SubmitClaimState } from "./actions";

const initial: SubmitClaimState = { ok: false };

const NOTES_MAX = 1000;

const PROOF_OPTIONS = [
  {
    value: "domain_email",
    label: "ایمیل کاری روی دامنه‌ی کسب‌وکار",
    hint: "مثال: yourname@yourcompany.ir — همان دامنه‌ی سایت رسمی.",
  },
  {
    value: "document",
    label: "بارگذاری سند رسمی",
    hint: "پروانه‌ی کسب، روزنامه رسمی، نامه‌ی رسمی شرکت یا فاکتور رسمی.",
  },
  {
    value: "other",
    label: "روش دیگر",
    hint: "اگر هیچ‌کدام مناسب نیست، توضیحت را در فیلد یادداشت بنویس و مدرک پیوست کن.",
  },
] as const;

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

export function ClaimForm({
  slug,
  businessName,
  defaultPhone,
  previousRejection,
}: {
  slug: string;
  businessName: string;
  defaultPhone: string;
  previousRejection: string | null;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(submitClaim, initial);

  const [proofType, setProofType] = useState<string>("");
  const [proofName, setProofName] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const proofInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok && state.redirectUrl) {
      setFlash("درخواست ادعای مالکیت ثبت شد و در حال بررسی است.");
      router.push(state.redirectUrl);
    }
  }, [state.ok, state.redirectUrl, router]);

  const fe = state.fieldErrors ?? {};

  function clearProof() {
    if (proofInput.current) proofInput.current.value = "";
    setProofName(null);
  }

  const fileNeeded = proofType === "document" || proofType === "other";
  const notesLen = notes.length;

  return (
    <div className={`${GLASS} p-6 sm:p-8`}>
      {previousRejection && (
        <div className="mb-5 rounded-xl border border-pomegr/40 bg-pomegr/[0.06] p-4">
          <p className="text-[0.82rem] font-bold text-pomegr">
            درخواست قبلی شما رد شد.
          </p>
          <p className="mt-1 text-[0.82rem] leading-[1.9] text-muted">
            دلیل: {previousRejection}
          </p>
        </div>
      )}

      {state.error && (
        <div className="mb-5 rounded-xl border border-pomegr/45 bg-pomegr/[0.06] p-4">
          <p className="text-[0.85rem] font-bold text-pomegr">{state.error}</p>
        </div>
      )}

      <form action={action} noValidate className="space-y-6">
        <input type="hidden" name="slug" value={slug} />

        {/* 1 — Proof type */}
        <fieldset>
          <legend className={LABEL}>چطور می‌خواهی مالکیت را اثبات کنی؟</legend>
          <div className="mt-3 flex flex-col gap-2.5">
            {PROOF_OPTIONS.map((opt) => {
              const active = proofType === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                    active
                      ? "border-mint/55 bg-mint/[0.08]"
                      : "border-glass-border bg-white/[0.02] hover:border-glass-border-hi"
                  }`}
                >
                  <input
                    type="radio"
                    name="proofType"
                    value={opt.value}
                    checked={active}
                    onChange={(e) => setProofType(e.target.value)}
                    className="mt-1 h-4 w-4 shrink-0 accent-mint"
                  />
                  <span className="min-w-0">
                    <span className="block text-[0.92rem] font-bold text-strong">
                      {opt.label}
                    </span>
                    <span className="mt-1 block text-[0.8rem] leading-[1.8] text-muted">
                      {opt.hint}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          {fe.proofType && <p className={`${ERR_TEXT} mt-2`}>{fe.proofType}</p>}
        </fieldset>

        {/* 2a — Domain email (only when proofType=domain_email) */}
        {proofType === "domain_email" && (
          <div className="flex flex-col gap-2">
            <label htmlFor="proofEmail" className={LABEL}>
              ایمیل کاری
            </label>
            <input
              id="proofEmail"
              name="proofEmail"
              type="email"
              dir="ltr"
              placeholder="you@yourcompany.ir"
              className={`${FIELD} text-left ${fieldBorder(Boolean(fe.proofEmail))}`}
            />
            {fe.proofEmail ? (
              <p className={ERR_TEXT}>{fe.proofEmail}</p>
            ) : (
              <p className={HINT}>
                به این ایمیل یک پیام تأیید می‌فرستیم تا آدرس واقعی بودنش را
                بررسی کنیم.
              </p>
            )}
          </div>
        )}

        {/* 2b — Proof file (only when proofType=document|other) */}
        {fileNeeded && (
          <div className="flex flex-col gap-2">
            <span className={LABEL}>بارگذاری مدرک</span>
            <input
              ref={proofInput}
              type="file"
              name="proof"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setProofName(e.target.files?.[0]?.name ?? null)}
              className="sr-only"
              id="claim-proof"
            />
            <div
              className={`flex items-center justify-between gap-3 rounded-xl border bg-white/[0.03] px-4 py-3 ${fieldBorder(
                Boolean(fe.proof),
              )}`}
            >
              <div className="min-w-0">
                <p className="truncate text-[0.85rem] font-semibold text-strong">
                  {proofName ?? "هنوز فایلی انتخاب نشده"}
                </p>
                <p className={HINT}>JPG / PNG / WebP / PDF — تا ۵ مگابایت.</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {proofName && (
                  <button
                    type="button"
                    onClick={clearProof}
                    className="rounded-full border border-glass-border bg-glass px-3 py-2 text-[0.78rem] font-bold text-muted hover:text-strong"
                  >
                    حذف
                  </button>
                )}
                <label
                  htmlFor="claim-proof"
                  className="cursor-pointer rounded-full border border-mint/45 bg-mint/10 px-4 py-2 text-[0.8rem] font-bold text-mint hover:bg-mint/20"
                >
                  انتخاب فایل
                </label>
              </div>
            </div>
            {fe.proof && <p className={ERR_TEXT}>{fe.proof}</p>}
          </div>
        )}

        {/* 3 — Contact phone */}
        <div className="flex flex-col gap-2">
          <label htmlFor="contactPhone" className={LABEL}>
            شماره تماس
          </label>
          <input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            dir="ltr"
            defaultValue={defaultPhone}
            placeholder="+989121234567"
            className={`${FIELD} text-left ${fieldBorder(Boolean(fe.contactPhone))}`}
          />
          {fe.contactPhone ? (
            <p className={ERR_TEXT}>{fe.contactPhone}</p>
          ) : (
            <p className={HINT}>
              ممکن است برای تکمیل بررسی با این شماره تماس بگیریم.
            </p>
          )}
        </div>

        {/* 4 — Notes */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <label htmlFor="notes" className={LABEL}>
              توضیحات <span className={OPTIONAL}>(اختیاری)</span>
            </label>
            <span
              className={`text-[11px] ${
                notesLen > NOTES_MAX ? "text-pomegr" : "text-muted"
              }`}
            >
              {fa(notesLen)}/{fa(NOTES_MAX)}
            </span>
          </div>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="هر اطلاعاتی که به بازبینی کمک می‌کند — مثلاً سمت شما در شرکت، شماره ثبت، یا توضیح در مورد مدرک پیوست‌شده."
            className={`${FIELD} resize-y leading-[1.9] ${fieldBorder(Boolean(fe.notes))}`}
          />
          {fe.notes && <p className={ERR_TEXT}>{fe.notes}</p>}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row-reverse sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={pending}
            className={`${BTN_PRIMARY} w-full justify-center px-6 py-3 text-[0.92rem] sm:w-auto sm:py-2.5 disabled:opacity-60`}
          >
            {pending ? "در حال ارسال..." : "ثبت درخواست"}
          </button>
          <p className="text-[12px] leading-[1.9] text-muted">
            با ثبت درخواست، تأیید می‌کنی که مدرک ارائه‌شده واقعی است و در صورت
            خلاف، درخواست شما رد خواهد شد.
          </p>
        </div>

        {/* Hidden field so user understands what they're claiming */}
        <p className="sr-only">{businessName}</p>
      </form>
    </div>
  );
}
