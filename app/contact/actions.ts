"use server";

/**
 * Contact-form intake.
 *
 * No email/DB delivery is wired yet — submissions are validated at the server
 * boundary and logged with context so they are not silently lost. Replace the
 * `console.log` below with a real intake (email provider or a DB insert) when
 * one is available.
 */

export type ContactResult =
  | { ok: true }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Coerce an unknown field to a trimmed string (never trust the client). */
function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function submitContact(raw: unknown): Promise<ContactResult> {
  // ── Boundary validation ──────────────────────────────────────────────
  const input: Record<string, unknown> =
    typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};

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

  // ── Intake ───────────────────────────────────────────────────────────
  // TODO: deliver to email/DB. For now, log with context (route + payload
  // shape) so messages are recoverable from server logs.
  try {
    console.log("[contact] new message", {
      route: "/contact",
      name,
      email,
      subjectLength: subject.length,
      messageLength: message.length,
      at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[contact] failed to record submission", { route: "/contact", err });
    return { ok: false, error: "ثبت پیام با خطا مواجه شد. کمی بعد دوباره تلاش کن." };
  }

  return { ok: true };
}
