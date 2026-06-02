/**
 * Pure boundary validation for the contact form. Server-free so it can be
 * unit-tested in plain node; `submitContact` (the server action) calls this
 * before touching the database.
 */

/** A submission that passed validation — trimmed and ready to persist. */
export type ContactInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type ContactValidation =
  | { ok: true; value: ContactInput }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Coerce an unknown field to a trimmed string (never trust the client). */
function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Validate raw client input. Returns the trimmed value or a Persian error. */
export function validateContactInput(raw: unknown): ContactValidation {
  const input: Record<string, unknown> =
    typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>)
      : {};

  const name = asString(input.name);
  const email = asString(input.email);
  const subject = asString(input.subject);
  const message = asString(input.message);

  if (name.length < 2 || name.length > 80) {
    return { ok: false, error: "نام را به‌درستی وارد کن." };
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false, error: "ایمیل معتبر نیست." };
  }
  if (subject.length > 120) {
    return { ok: false, error: "موضوع خیلی طولانی است." };
  }
  if (message.length < 10 || message.length > 2000) {
    return { ok: false, error: "متن پیام باید بین ۱۰ تا ۲۰۰۰ کاراکتر باشد." };
  }

  return { ok: true, value: { name, email, subject, message } };
}
