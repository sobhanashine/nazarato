"use client";

import { useActionState } from "react";
import Link from "next/link";
import { BTN_PRIMARY, GLASS } from "@/components/ui/styles";
import { startOtp, type FormState } from "./actions";

const initial: FormState = { ok: false };

const FIELD_BASE =
  "w-full bg-transparent px-3 py-3.5 text-[16px] text-white placeholder:text-white/25 " +
  "outline-none";
const LABEL = "text-[13px] font-bold text-muted";
const ERR_TEXT = "text-[12px] font-bold text-pomegr";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(startOtp, initial);
  const phoneError = state.field === "phone" ? state.error : undefined;
  const formError = state.error && state.field !== "phone" ? state.error : undefined;

  return (
    <div className={`${GLASS} p-6 sm:p-8`}>
      <h1 className="text-[1.4rem] font-black tracking-tight text-strong">
        ورود یا ثبت‌نام
      </h1>
      <p className="mt-2 text-[14px] leading-[1.9] text-muted">
        شماره موبایلت را وارد کن تا کد تأیید برایت پیامک شود.
      </p>

      <form action={action} noValidate className="mt-6 space-y-4">
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
            className={`flex items-center rounded-xl border bg-white/[0.03] backdrop-blur-md transition-colors ${
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
              required
              className={FIELD_BASE}
            />
          </div>
        </div>

        <label className="flex items-start gap-2.5 text-[12.5px] leading-[1.8] text-muted">
          <input
            type="checkbox"
            name="terms"
            required
            className="mt-1 h-4 w-4 shrink-0 accent-mint"
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
          <div className="flex items-start gap-3 rounded-xl border border-pomegr/30 bg-pomegr/10 p-3.5 text-[13.5px] font-medium text-white">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pomegr/20 text-pomegr">
              !
            </span>
            {formError}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className={`${BTN_PRIMARY} w-full py-3.5 text-[15px] disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {pending ? "در حال ارسال…" : "ارسال کد"}
        </button>
      </form>
    </div>
  );
}
