"use client";

import { useId, useRef, useState } from "react";
import { submitContact } from "@/app/contact/actions";
import { SendIcon } from "@/components/icons";
import { BTN_PRIMARY } from "@/components/ui/styles";

type Field = "name" | "email" | "subject" | "message";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MESSAGE_MAX = 2000;

/** Client-side mirror of the server validation in `app/contact/actions.ts`. */
function validateField(field: Field, value: string): string | null {
  const v = value.trim();
  switch (field) {
    case "name":
      if (v.length === 0) return "نام را وارد کن.";
      if (v.length < 2) return "نام باید حداقل ۲ حرف باشد.";
      if (v.length > 80) return "نام خیلی طولانی است.";
      return null;
    case "email":
      if (v.length === 0) return "ایمیل را وارد کن.";
      if (!EMAIL_RE.test(v)) return "ایمیل معتبر نیست (مثال: name@mail.com).";
      return null;
    case "subject":
      if (v.length > 120) return "موضوع خیلی طولانی است.";
      return null;
    case "message":
      if (v.length === 0) return "متن پیام را وارد کن.";
      if (v.length < 10) return "پیام باید حداقل ۱۰ کاراکتر باشد.";
      if (v.length > MESSAGE_MAX) return `پیام نباید بیش از ${MESSAGE_MAX} کاراکتر باشد.`;
      return null;
  }
}

const FIELD_BASE =
  "w-full rounded-xl bg-glass border px-4 py-3 text-[15px] text-strong " +
  "placeholder:text-muted/60 outline-none transition-[border-color,background,box-shadow] duration-200";
const FIELD_OK =
  "border-glass-border focus:border-mint/55 focus:bg-glass-hover " +
  "focus:shadow-[0_0_0_3px_rgba(91,230,178,0.12)]";
const FIELD_ERR =
  "border-pomegr/60 focus:border-pomegr/70 " +
  "focus:shadow-[0_0_0_3px_rgba(255,107,149,0.14)]";

export function ContactForm() {
  const formId = useId();
  const [values, setValues] = useState<Record<Field, string>>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const update = (field: Field) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = e.target.value;
    setValues((v) => ({ ...v, [field]: value }));
    // Re-validate live only once the field has been blurred once.
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) ?? undefined }));
    }
  };

  const blur = (field: Field) => () => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, values[field]) ?? undefined }));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);

    // Validate everything; surface all errors at once.
    const allFields: Field[] = ["name", "email", "subject", "message"];
    const nextErrors: Partial<Record<Field, string>> = {};
    for (const f of allFields) {
      const err = validateField(f, values[f]);
      if (err) nextErrors[f] = err;
    }
    setErrors(nextErrors);
    setTouched({ name: true, email: true, subject: true, message: true });

    if (Object.keys(nextErrors).length > 0) {
      // Move focus to the first invalid control for keyboard/SR users.
      const first = allFields.find((f) => nextErrors[f]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setStatus("submitting");
    try {
      const result = await submitContact({
        name: values.name.trim(),
        email: values.email.trim(),
        subject: values.subject.trim(),
        message: values.message.trim(),
      });
      if (result.ok) {
        setStatus("success");
      } else {
        setStatus("idle");
        setServerError(result.error);
      }
    } catch {
      setStatus("idle");
      setServerError("ارسال پیام با خطا مواجه شد. اتصال اینترنت را بررسی کن.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center text-center gap-4 py-10 px-6">
        <span className="grid place-items-center w-16 h-16 rounded-full bg-mint/15 text-mint shadow-[0_0_0_6px_rgba(91,230,178,0.07),0_0_28px_-6px_rgba(91,230,178,0.6)]">
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m5 12.5 4.5 4.5L19 7" />
          </svg>
        </span>
        <h3 className="text-[1.15rem] font-extrabold text-strong">پیامت رسید!</h3>
        <p className="text-sm text-muted leading-[1.85] max-w-[36ch]">
          ممنون که وقت گذاشتی. تیم نظراتو معمولاً ظرف یک تا دو روز کاری پاسخ می‌ده.
        </p>
        <button
          type="button"
          onClick={() => {
            setValues({ name: "", email: "", subject: "", message: "" });
            setErrors({});
            setTouched({});
            setStatus("idle");
          }}
          className="mt-1 text-sm font-semibold text-mint transition-colors duration-200 hover:text-[#7BFFC9]"
        >
          ارسال پیام دیگر
        </button>
      </div>
    );
  }

  const messageLeft = MESSAGE_MAX - values.message.length;

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${formId}-name`} className="text-[13.5px] font-semibold text-strong">
          نام <span className="text-pomegr">*</span>
        </label>
        <input
          id={`${formId}-name`}
          name="name"
          type="text"
          autoComplete="name"
          value={values.name}
          onChange={update("name")}
          onBlur={blur("name")}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? `${formId}-name-err` : undefined}
          placeholder="نام و نام خانوادگی"
          className={`${FIELD_BASE} ${errors.name ? FIELD_ERR : FIELD_OK}`}
        />
        {errors.name && (
          <p id={`${formId}-name-err`} className="text-[12.5px] text-pomegr">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${formId}-email`} className="text-[13.5px] font-semibold text-strong">
          ایمیل <span className="text-pomegr">*</span>
        </label>
        <input
          id={`${formId}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          value={values.email}
          onChange={update("email")}
          onBlur={blur("email")}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? `${formId}-email-err` : undefined}
          placeholder="name@mail.com"
          className={`${FIELD_BASE} text-right placeholder:text-left ${errors.email ? FIELD_ERR : FIELD_OK}`}
        />
        {errors.email && (
          <p id={`${formId}-email-err`} className="text-[12.5px] text-pomegr">
            {errors.email}
          </p>
        )}
      </div>

      {/* Subject (optional) */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${formId}-subject`} className="text-[13.5px] font-semibold text-strong">
          موضوع <span className="text-muted font-normal">(اختیاری)</span>
        </label>
        <input
          id={`${formId}-subject`}
          name="subject"
          type="text"
          value={values.subject}
          onChange={update("subject")}
          onBlur={blur("subject")}
          aria-invalid={errors.subject ? true : undefined}
          aria-describedby={errors.subject ? `${formId}-subject-err` : undefined}
          placeholder="مثلاً: گزارش یک نظر، همکاری، پیشنهاد…"
          className={`${FIELD_BASE} ${errors.subject ? FIELD_ERR : FIELD_OK}`}
        />
        {errors.subject && (
          <p id={`${formId}-subject-err`} className="text-[12.5px] text-pomegr">
            {errors.subject}
          </p>
        )}
      </div>

      {/* Message */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={`${formId}-message`} className="text-[13.5px] font-semibold text-strong">
            پیام <span className="text-pomegr">*</span>
          </label>
          <span
            className={`tabular-nums text-[11.5px] ${messageLeft < 0 ? "text-pomegr" : "text-muted"}`}
            aria-hidden
          >
            {messageLeft.toLocaleString("fa-IR")}
          </span>
        </div>
        <textarea
          id={`${formId}-message`}
          name="message"
          rows={6}
          value={values.message}
          onChange={update("message")}
          onBlur={blur("message")}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? `${formId}-message-err` : undefined}
          placeholder="هرچی دوست داری برامون بنویس…"
          className={`${FIELD_BASE} resize-y min-h-[120px] leading-[1.85] ${errors.message ? FIELD_ERR : FIELD_OK}`}
        />
        {errors.message && (
          <p id={`${formId}-message-err`} className="text-[12.5px] text-pomegr">
            {errors.message}
          </p>
        )}
      </div>

      {serverError && (
        <p
          role="alert"
          className="rounded-xl border border-pomegr/40 bg-pomegr/10 px-4 py-3 text-[13px] text-strong"
        >
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className={`${BTN_PRIMARY} py-[0.8rem] px-6 text-[15px] disabled:opacity-60 disabled:cursor-not-allowed [&_svg]:w-[18px] [&_svg]:h-[18px]`}
      >
        {status === "submitting" ? (
          "در حال ارسال…"
        ) : (
          <>
            <SendIcon />
            ارسال پیام
          </>
        )}
      </button>

      <p className="text-[12px] text-muted text-center leading-[1.7]">
        با ارسال این فرم، با بررسی پیام توسط تیم نظراتو موافقت می‌کنی.
      </p>
    </form>
  );
}
