"use client";

import { useId, useRef, useState } from "react";
import { submitContact } from "@/app/contact/actions";
import { SendIcon } from "@/components/icons";

type Field = "name" | "email" | "subject" | "message";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MESSAGE_MAX = 2000;

const fa = (n: number) => n.toLocaleString("fa-IR");

function validateField(field: Field, value: string): string | null {
  const v = value.trim();
  switch (field) {
    case "name":
      if (v.length === 0) return "نام الزامی است";
      if (v.length < 2) return "حداقل ۲ کاراکتر";
      if (v.length > 80) return "بیش از حد مجاز";
      return null;
    case "email":
      if (v.length === 0) return "ایمیل الزامی است";
      if (!EMAIL_RE.test(v)) return "فرمت نامعتبر";
      return null;
    case "subject":
      if (v.length > 120) return "بیش از حد مجاز";
      return null;
    case "message":
      if (v.length === 0) return "متن پیام الزامی است";
      if (v.length < 10) return "حداقل ۱۰ کاراکتر";
      if (v.length > MESSAGE_MAX) return `حداکثر ${fa(MESSAGE_MAX)} کاراکتر`;
      return null;
  }
}

const FIELD_BASE =
  "w-full rounded-xl border border-glass-border bg-white/[0.03] px-4 py-3.5 text-[16px] text-white " +
  "placeholder:text-white/25 outline-none transition-all duration-200 backdrop-blur-md";
const FIELD_OK =
  "hover:border-glass-border-hi focus:border-mint focus:bg-mint/[0.06]";
const FIELD_ERR =
  "border-pomegr/55 bg-pomegr/[0.05] focus:border-pomegr placeholder:text-pomegr/30";

const LABEL = "text-[13px] font-bold text-muted";
const ERR_TEXT = "text-[12px] font-bold text-pomegr";

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

    const allFields: Field[] = ["name", "email", "subject", "message"];
    const nextErrors: Partial<Record<Field, string>> = {};
    for (const f of allFields) {
      const err = validateField(f, values[f]);
      if (err) nextErrors[f] = err;
    }
    setErrors(nextErrors);
    setTouched({ name: true, email: true, subject: true, message: true });

    if (Object.keys(nextErrors).length > 0) {
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
      setServerError("خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-6 py-14 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-mint/20 blur-xl" aria-hidden />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-mint/30 bg-mint/[0.08] text-mint">
            <svg
              viewBox="0 0 24 24"
              className="h-9 w-9"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m5 12.5 4.5 4.5L19 7" />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-[1.5rem] font-black tracking-tight text-white">
            پیام شما ارسال شد
          </h3>
          <p className="mx-auto max-w-[40ch] text-[15px] leading-[1.9] text-muted">
            پیامت رسید. تیم پشتیبانی طی ۱ تا ۲ روز کاری جواب می‌دهد.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setValues({ name: "", email: "", subject: "", message: "" });
            setErrors({});
            setTouched({});
            setStatus("idle");
          }}
          className="rounded-lg border border-glass-border bg-white/5 px-6 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-white/10"
        >
          ارسال پیام دیگر
        </button>
      </div>
    );
  }

  const messageLeft = MESSAGE_MAX - values.message.length;

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Name */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <label htmlFor={`${formId}-name`} className={LABEL}>
              نام
            </label>
            {errors.name && <span className={ERR_TEXT}>{errors.name}</span>}
          </div>
          <input
            id={`${formId}-name`}
            name="name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={update("name")}
            onBlur={blur("name")}
            placeholder="مثلاً: سبحان"
            className={`${FIELD_BASE} ${errors.name ? FIELD_ERR : FIELD_OK}`}
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <label htmlFor={`${formId}-email`} className={LABEL}>
              ایمیل
            </label>
            {errors.email && <span className={ERR_TEXT}>{errors.email}</span>}
          </div>
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
            placeholder="name@example.com"
            className={`${FIELD_BASE} text-right ${errors.email ? FIELD_ERR : FIELD_OK}`}
          />
        </div>
      </div>

      {/* Subject */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor={`${formId}-subject`} className={LABEL}>
            موضوع <span className="font-medium text-white/30">(اختیاری)</span>
          </label>
          {errors.subject && <span className={ERR_TEXT}>{errors.subject}</span>}
        </div>
        <input
          id={`${formId}-subject`}
          name="subject"
          type="text"
          value={values.subject}
          onChange={update("subject")}
          onBlur={blur("subject")}
          placeholder="موضوع پیام"
          className={`${FIELD_BASE} ${errors.subject ? FIELD_ERR : FIELD_OK}`}
        />
      </div>

      {/* Message */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor={`${formId}-message`} className={LABEL}>
            پیام شما
          </label>
          <div className="flex items-center gap-3">
            {errors.message && <span className={ERR_TEXT}>{errors.message}</span>}
            <span
              className={`text-[12px] tabular-nums ${messageLeft < 0 ? "text-pomegr" : "text-muted/60"}`}
            >
              {fa(messageLeft)}
            </span>
          </div>
        </div>
        <textarea
          id={`${formId}-message`}
          name="message"
          rows={6}
          value={values.message}
          onChange={update("message")}
          onBlur={blur("message")}
          placeholder="محتوای پیام خود را اینجا بنویس..."
          className={`${FIELD_BASE} min-h-[140px] resize-y leading-relaxed ${errors.message ? FIELD_ERR : FIELD_OK}`}
        />
      </div>

      {serverError && (
        <div className="flex items-start gap-3 rounded-xl border border-pomegr/30 bg-pomegr/10 p-4 text-[14px] font-medium text-white">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pomegr/20 text-pomegr">
            !
          </span>
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-white px-8 py-4 text-[16px] font-black whitespace-nowrap text-black transition-all duration-200 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {status === "submitting" ? (
          <span className="animate-pulse">در حال ارسال...</span>
        ) : (
          <>
            <SendIcon className="h-[18px] w-[18px]" />
            ارسال پیام
          </>
        )}
      </button>
    </form>
  );
}
