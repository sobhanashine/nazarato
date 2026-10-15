"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BTN_PRIMARY, GLASS } from "@/components/ui/styles";
import { setFlash } from "@/lib/flash";
import { completeProfile, resendOtp, verifyOtp, type FormState } from "../actions";

const initial: FormState = { ok: false };
const OTP_LEN = 6;
const RESEND_SECONDS = 60;

const fa = (n: number) => n.toLocaleString("fa-IR");
const toAscii = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
const onlyDigits = (s: string) => toAscii(s).replace(/\D/g, "");
/** Per-digit ASCII→Persian — for codes/phones, where grouping must NOT apply. */
const toFa = (s: string) => s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

const LABEL = "text-[13px] font-bold text-muted";
const ERR_TEXT = "text-[12px] font-bold text-pomegr";

/**
 * The `/login/verify` UI. Two phases in one client island:
 *  1. `code` — enter the 6-digit OTP.
 *  2. `name` — first-login display-name onboarding.
 * Phase 2 is reached only after the server confirms the code.
 */
export function VerifyForm({
  phone,
  next,
  devCode,
}: {
  phone: string;
  next: string;
  devCode: string | null;
}) {
  const [phase, setPhase] = useState<"code" | "name">("code");

  if (phase === "name") return <NameStep next={next} />;
  return (
    <CodeStep
      phone={phone}
      next={next}
      devCode={devCode}
      onVerified={() => setPhase("name")}
    />
  );
}

function CodeStep({
  phone,
  next,
  devCode,
  onVerified,
}: {
  phone: string;
  next: string;
  devCode: string | null;
  onVerified: () => void;
}) {
  const router = useRouter();
  const [state, action, verifying] = useActionState(verifyOtp, initial);
  const [resendState, resendAction, resending] = useActionState(
    resendOtp,
    initial,
  );

  const [cells, setCells] = useState<string[]>(() => Array(OTP_LEN).fill(""));
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const formRef = useRef<HTMLFormElement>(null);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const code = cells.join("");

  // A fresh server result clears the boxes. This adjusts state *during render*
  // — React's sanctioned alternative to a setState-in-effect, guarded so it
  // runs once per result (see react.dev/learn/you-might-not-need-an-effect).
  const [seenVerify, setSeenVerify] = useState(state);
  if (state !== seenVerify) {
    setSeenVerify(state);
    if (!state.ok && state.error && !state.reason) {
      setCells(Array(OTP_LEN).fill(""));
    }
  }
  const [seenResend, setSeenResend] = useState(resendState);
  if (resendState !== seenResend) {
    setSeenResend(resendState);
    if (resendState.ok) {
      setCells(Array(OTP_LEN).fill(""));
      setResendIn(RESEND_SECONDS);
    }
  }

  // Resend cooldown countdown.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Correct code → advance to the display-name step.
  useEffect(() => {
    if (state.ok) {
      if (state.redirectUrl) {
        setFlash("خوش آمدید! ورود با موفقیت انجام شد.");
        router.push(state.redirectUrl);
      } else {
        onVerified();
      }
    }
  }, [state.ok, state.redirectUrl, onVerified, router]);

  // Refocus the first box once it has been cleared (focus only — no setState).
  useEffect(() => {
    if (!state.ok && state.error && !state.reason) inputs.current[0]?.focus();
  }, [state]);
  useEffect(() => {
    if (resendState.ok) inputs.current[0]?.focus();
  }, [resendState]);

  // Auto-submit the moment all six digits are present.
  useEffect(() => {
    if (cells.every(Boolean)) formRef.current?.requestSubmit();
  }, [cells]);

  const writeCell = useCallback((i: number, digit: string) => {
    setCells((prev) => {
      const nextCells = [...prev];
      nextCells[i] = digit;
      return nextCells;
    });
  }, []);

  const handleChange =
    (i: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const d = onlyDigits(e.target.value).slice(-1);
      writeCell(i, d);
      if (d && i < OTP_LEN - 1) inputs.current[i + 1]?.focus();
    };

  const handleKeyDown =
    (i: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !cells[i] && i > 0) {
        e.preventDefault();
        writeCell(i - 1, "");
        inputs.current[i - 1]?.focus();
      }
    };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = onlyDigits(e.clipboardData.getData("text")).slice(0, OTP_LEN);
    if (!pasted) return;
    e.preventDefault();
    const nextCells = Array(OTP_LEN).fill("");
    for (let i = 0; i < pasted.length; i++) nextCells[i] = pasted[i];
    setCells(nextCells);
    inputs.current[Math.min(pasted.length, OTP_LEN - 1)]?.focus();
  };

  // Expired or locked → a dead-end notice, not the form.
  if (state.reason) {
    const expired = state.reason === "expired";
    return (
      <div className={`${GLASS} p-6 text-center sm:p-8`}>
        <h1 className="text-[1.3rem] font-black text-strong">
          {expired ? "کد منقضی شده است" : "حساب موقتاً قفل شد"}
        </h1>
        <p className="mt-2 text-[14px] leading-[1.9] text-muted">
          {expired
            ? "برای دریافت کد تازه دوباره وارد شو."
            : "تعداد تلاش‌های نادرست زیاد شد. کمی بعد دوباره از ابتدا وارد شو."}
        </p>
        <Link
          href="/login"
          className={`${BTN_PRIMARY} mt-5 w-full py-3 text-[14px]`}
        >
          بازگشت به ورود
        </Link>
      </div>
    );
  }

  const inlineError = state.error && !state.reason ? state.error : undefined;
  const changeNumberHref = next
    ? `/login?next=${encodeURIComponent(next)}`
    : "/login";

  return (
    <div className={`${GLASS} p-6 sm:p-8`}>
      <h1 className="text-[1.4rem] font-black tracking-tight text-strong">
        کد تأیید را وارد کن
      </h1>
      <p className="mt-2 text-[14px] leading-[1.9] text-muted">
        کد ۶ رقمی به شمارهٔ{" "}
        <span dir="ltr" className="font-bold text-strong">
          {toFa(phone)}
        </span>{" "}
        پیامک شد.
      </p>

      {devCode && (
        <p className="mt-3 rounded-lg border border-saffron/30 bg-saffron/[0.07] px-3 py-2 text-[12.5px] text-saffron">
          حالت توسعه — کد ثابت است:{" "}
          <span dir="ltr" className="font-bold">
            {toFa(devCode)}
          </span>
        </p>
      )}

      <form action={action} ref={formRef} noValidate className="mt-6 space-y-4">
        <input type="hidden" name="code" value={code} />
        <input type="hidden" name="next" value={next} />

        <div dir="ltr" className="flex justify-center gap-2">
          {cells.map((cell, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              value={cell}
              onChange={handleChange(i)}
              onKeyDown={handleKeyDown(i)}
              onPaste={handlePaste}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={1}
              aria-label={`رقم ${fa(i + 1)} کد تأیید`}
              autoFocus={i === 0}
              disabled={verifying}
              className={`h-14 w-12 rounded-xl border bg-white/[0.03] text-center text-[20px] font-bold text-white outline-none transition-colors disabled:opacity-60 ${
                inlineError
                  ? "border-pomegr/55"
                  : "border-glass-border focus:border-mint focus:bg-mint/[0.06]"
              }`}
            />
          ))}
        </div>

        {inlineError && (
          <p className={`${ERR_TEXT} text-center`} aria-live="polite">
            {inlineError}
          </p>
        )}

        <button
          type="submit"
          disabled={verifying || code.length !== OTP_LEN}
          className={`${BTN_PRIMARY} w-full py-3.5 text-[15px] disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {verifying ? "در حال بررسی…" : "تأیید و ورود"}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between text-[13px]">
        {resendIn > 0 ? (
          <span className="text-muted">
            ارسال مجدد تا {fa(resendIn)} ثانیه دیگر
          </span>
        ) : (
          <form action={resendAction}>
            <button
              type="submit"
              disabled={resending}
              className="font-bold text-mint hover:underline disabled:opacity-50"
            >
              {resending ? "در حال ارسال…" : "ارسال مجدد کد"}
            </button>
          </form>
        )}
        <Link href={changeNumberHref} className="text-muted hover:text-strong">
          تغییر شماره
        </Link>
      </div>

      {resendState.error && !resendState.reason && (
        <p className={`${ERR_TEXT} mt-2`}>{resendState.error}</p>
      )}
    </div>
  );
}

function NameStep({ next }: { next: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(completeProfile, initial);
  const nameError = state.field === "name" ? state.error : undefined;
  const formError =
    state.error && state.field !== "name" ? state.error : undefined;

  useEffect(() => {
    if (state.ok && state.redirectUrl) {
      setFlash("حساب شما با موفقیت ساخته شد!");
      router.push(state.redirectUrl);
    }
  }, [state.ok, state.redirectUrl, router]);

  return (
    <div className={`${GLASS} p-6 sm:p-8`}>
      <h1 className="text-[1.4rem] font-black tracking-tight text-strong">
        یک قدم تا پایان
      </h1>
      <p className="mt-2 text-[14px] leading-[1.9] text-muted">
        یک نام نمایشی انتخاب کن — همین نام کنار نظرهایت دیده می‌شود، نه نام
        قانونی‌ات.
      </p>

      <form action={action} noValidate className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next} />

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <label htmlFor="name" className={LABEL}>
              نام نمایشی
            </label>
            {nameError && <span className={ERR_TEXT}>{nameError}</span>}
          </div>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="nickname"
            required
            minLength={2}
            maxLength={40}
            autoFocus
            placeholder="مثلاً: سبحان"
            className={`w-full rounded-xl border bg-white/[0.03] px-4 py-3.5 text-[16px] text-white placeholder:text-white/25 outline-none backdrop-blur-md transition-colors ${
              nameError
                ? "border-pomegr/55 bg-pomegr/[0.05]"
                : "border-glass-border focus:border-mint focus:bg-mint/[0.06]"
            }`}
          />
        </div>

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
          {pending ? "در حال ورود…" : "ورود به نظراتو"}
        </button>
      </form>
    </div>
  );
}
