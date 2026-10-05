"use client";

import { useActionState } from "react";
import Link from "next/link";
import { BTN_PRIMARY } from "@/components/ui/styles";
import { startOtp, type FormState } from "./actions";

const initial: FormState = { ok: false };

const FIELD_BASE =
  "w-full bg-transparent px-3 py-3.5 text-[16px] text-strong placeholder:text-muted " +
  "outline-none";
const LABEL = "text-[13px] font-bold text-muted";
const ERR_TEXT = "text-[13px] font-medium text-pomegr";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(startOtp, initial);
  const phoneError = state.field === "phone" ? state.error : undefined;
  const formError = state.error && state.field !== "phone" ? state.error : undefined;

  return (
    <div className="border-y border-glass-border py-6 sm:rounded-lg sm:border sm:bg-paper sm:p-8">
      <h1 className="text-[1.4rem] font-bold text-strong">
        {process.env.NODE_ENV === "development" ? "ورود آزمایشی" : "ورود عمومی هنوز فعال نیست"}
      </h1>
      <p className="mt-2 text-[14px] leading-[1.9] text-muted">
        {process.env.NODE_ENV === "development" ? "این ورود آزمایشی است. پیامکی ارسال نمی‌شود؛ کد در محیط توسعه نمایش داده می‌شود." : "سامانهٔ پیامک هنوز متصل نشده است. اطلاعات منتشرشده را می‌توانی بدون حساب ببینی."}
      </p>

      {process.env.NODE_ENV === "development" && <form action={action} noValidate className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next} />

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <label htmlFor="phone" className={LABEL}>
              شماره موبایل
            </label>
            {phoneError && <span className={ERR_TEXT}>{phoneError}</span>}
          </div>
          <div
            dir="ltr"
            className={`flex items-center min-h-14 rounded-lg border bg-paper transition-colors ${
              phoneError
                ? "border-pomegr/55 bg-pomegr/[0.05]"
                : "border-glass-border focus-within:border-mint focus-within:bg-mint/[0.06]"
            }`}
          >
            <span className="select-none px-3 text-[15px] font-bold text-muted">
              98+
            </span>
            <span className="h-6 w-px bg-glass-border" aria-hidden />
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              dir="ltr"
              placeholder="912 345 6789"
              defaultValue={state.phone || ""}
              required
              className={FIELD_BASE}
            />
          </div>
        </div>

        <label className="flex min-h-11 items-start gap-2.5 py-2 text-[14px] leading-7 text-muted">
          <input
            type="checkbox"
            name="terms"
            required
            className="mt-1 h-5 w-5 shrink-0 accent-mint"
          />
          <span>
            <Link href="/terms" className="text-mint hover:underline">
              قوانین
            </Link>{" "}
            و{" "}
            <Link href="/privacy" className="text-mint hover:underline">
              حریم خصوصی
            </Link>{" "}
            نظراتو را خوانده‌ام و می‌پذیرم.
          </span>
        </label>

        {formError && (
          <div className="flex items-start gap-3 rounded-lg border border-pomegr/30 bg-pomegr/5 p-3.5 text-[13.5px] font-medium text-pomegr">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pomegr/20 text-pomegr">
              !
            </span>
            {formError}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className={`${BTN_PRIMARY} w-full min-h-12 py-3.5 text-[15px] disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {pending ? "در حال ارسال…" : "ارسال کد"}
        </button>
      </form>}
      {process.env.NODE_ENV !== "development" && <Link href="/search" className={`${BTN_PRIMARY} mt-6 min-h-12 w-full px-5 text-[15px]`}>جستجوی مکان</Link>}
    </div>
  );
}
