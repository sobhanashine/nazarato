"use server";

/**
 * Auth server actions — the phone-OTP flow boundary.
 *
 * Every action validates its input here (untrusted `FormData`) before touching
 * any state. OTP attempts live in the signed challenge so a restart cannot
 * reset them; the bounded send limiter protects this pilot's single process.
 */

import { redirect } from "next/navigation";
import {
  createOtpChallenge,
  createOtpCode,
  fingerprintPhone,
  getOtpResendWaitSeconds,
  normalizePhone,
  OTP_MAX_ATTEMPTS,
  type OtpChallenge,
  sendOtp,
  verifyOtpChallenge,
} from "@/lib/auth/otp";
import { OtpSendRateLimiter } from "@/lib/auth/otp-rate-limit";
import {
  clearOtpChallenge,
  getOtpChallenge,
  setOtpChallenge,
  setSession,
} from "@/lib/auth/session";
import { createUser, getUserByPhone, type UserRow } from "@/lib/data/users";
import { recordSecurityEvent } from "@/lib/security/audit";

/** Result shape shared by every action; consumed via `useActionState`. */
export type FormState = {
  ok: boolean;
  /** User-facing message. Absent on success. */
  error?: string;
  /** Field the error belongs to, for inline placement. */
  field?: "phone" | "name";
  /** Non-field outcomes the verify UI renders as dedicated states. */
  reason?: "expired" | "locked";
  /** Optional URL to redirect to on the client side after success. */
  redirectUrl?: string;
  /** Optional phone number to preserve value on errors. */
  phone?: string;
};

const sendLimiter = new OtpSendRateLimiter({
  cooldownMs: 60_000,
  windowMs: 15 * 60_000,
  maxSends: 3,
  maxEntries: 10_000,
});

const faNum = (n: number) => n.toLocaleString("fa-IR");

/** Coerce an untrusted form value to a trimmed string. */
function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}

/** Only allow same-origin relative paths as a post-login redirect target. */
function safeNext(value: string): string {
  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
  ) {
    return value;
  }
  return "/";
}

function verifyHref(next: string): string {
  const safe = safeNext(next);
  return safe === "/"
    ? "/login/verify"
    : `/login/verify?next=${encodeURIComponent(safe)}`;
}

/** Step 1 — `/login`: validate the phone, send the code, go to `/login/verify`. */
export async function startOtp(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const rawPhone = asString(formData.get("phone"));
  if (!formData.get("terms")) {
    return { ok: false, error: "برای ادامه باید قوانین و حریم خصوصی را بپذیری.", phone: rawPhone };
  }

  const phone = normalizePhone(rawPhone);
  if (!phone) {
    return { ok: false, field: "phone", error: "شماره موبایل معتبر نیست.", phone: rawPhone };
  }

  let challenge: OtpChallenge | null = null;
  let phoneFingerprint: string | null = null;
  try {
    phoneFingerprint = fingerprintPhone(phone);
    const limit = sendLimiter.consume(phoneFingerprint);
    if (!limit.allowed) {
      const wait = faNum(Math.max(1, Math.ceil(limit.retryAfterSeconds / 60)));
      return {
        ok: false,
        error:
          limit.reason === "cooldown"
            ? "کد به‌تازگی ارسال شده — کمی صبر کن."
            : `سقف ارسال موقتاً پر شده است — حدود ${wait} دقیقه‌ی دیگر تلاش کن.`,
        phone: rawPhone,
      };
    }

    const code = createOtpCode();
    challenge = createOtpChallenge({ phone, code });
    await sendOtp(phone, code);
    await setOtpChallenge(challenge);
    await recordSecurityEvent({
      eventType: "otp_sent",
      subjectType: "otp_challenge",
      subjectId: challenge.id,
      metadata: { phoneFingerprint, deliveryCount: challenge.deliveryCount },
    });
  } catch (err) {
    console.error("[auth] OTP start failed", {
      route: "/login",
      error: errorMessage(err),
    });
    if (challenge && phoneFingerprint) {
      await recordSecurityEvent({
        eventType: "otp_delivery_failed",
        subjectType: "otp_challenge",
        subjectId: challenge.id,
        metadata: { phoneFingerprint },
      });
    }
    return { ok: false, error: "ارسال کد ناموفق بود. کمی بعد دوباره تلاش کن.", phone: rawPhone };
  }

  redirect(verifyHref(asString(formData.get("next"))));
}

/**
 * Resend the code to the in-progress challenge's phone (`/login/verify`).
 * `useActionState` always passes (prevState, formData); resend needs neither —
 * the target phone comes from the OTP-challenge cookie.
 */
export async function resendOtp(
  _prev: FormState,
  _formData: FormData,
): Promise<FormState> {
  void _prev;
  void _formData;
  const challenge = await getOtpChallenge();
  if (!challenge) {
    return { ok: false, reason: "expired", error: "نشست منقضی شده است." };
  }

  if (challenge.verifiedAt !== null) {
    return { ok: false, reason: "expired", error: "این کد قبلاً استفاده شده است." };
  }
  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, reason: "locked", error: "تعداد تلاش‌ها بیش از حد شد." };
  }
  const resendWait = getOtpResendWaitSeconds(challenge);
  if (resendWait > 0) {
    return {
      ok: false,
      error: `${faNum(resendWait)} ثانیه تا ارسال دوباره باقی مانده است.`,
    };
  }

  let nextChallenge: OtpChallenge | null = null;
  let phoneFingerprint: string | null = null;
  try {
    phoneFingerprint = fingerprintPhone(challenge.phone);
    const limit = sendLimiter.consume(phoneFingerprint);
    if (!limit.allowed) {
      return {
        ok: false,
        error: "سقف ارسال موقتاً پر شده است. کمی بعد دوباره تلاش کن.",
      };
    }

    const code = createOtpCode();
    nextChallenge = createOtpChallenge({
      phone: challenge.phone,
      code,
      attempts: challenge.attempts,
      deliveryCount: challenge.deliveryCount + 1,
    });
    await sendOtp(challenge.phone, code);
    await setOtpChallenge(nextChallenge);
    await recordSecurityEvent({
      eventType: "otp_resent",
      subjectType: "otp_challenge",
      subjectId: nextChallenge.id,
      metadata: {
        phoneFingerprint,
        deliveryCount: nextChallenge.deliveryCount,
      },
    });
  } catch (err) {
    console.error("[auth] OTP resend failed", {
      route: "/login/verify",
      error: errorMessage(err),
    });
    if (nextChallenge && phoneFingerprint) {
      await recordSecurityEvent({
        eventType: "otp_delivery_failed",
        subjectType: "otp_challenge",
        subjectId: nextChallenge.id,
        metadata: { phoneFingerprint },
      });
    }
    return { ok: false, error: "ارسال مجدد ناموفق بود." };
  }
  return { ok: true };
}

/** Step 2 — `/login/verify`: check the 6-digit code against the challenge. */
export async function verifyOtp(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const challenge = await getOtpChallenge();
  if (!challenge) {
    return { ok: false, reason: "expired", error: "کد منقضی شده است." };
  }

  const result = verifyOtpChallenge({
    challenge,
    code: asString(formData.get("code")),
  });
  if (result.status === "invalid_format") {
    return { ok: false, error: "کد ۶ رقمی را کامل وارد کن." };
  }
  if (result.status === "expired") {
    await clearOtpChallenge();
    return { ok: false, reason: "expired", error: "کد منقضی شده است." };
  }
  if (result.status === "already_verified") {
    return { ok: false, reason: "expired", error: "این کد قبلاً استفاده شده است." };
  }
  if (result.status === "incorrect" || result.status === "locked") {
    await setOtpChallenge(result.challenge);
    await recordSecurityEvent({
      eventType: result.status === "locked" ? "otp_locked" : "otp_incorrect",
      subjectType: "otp_challenge",
      subjectId: challenge.id,
      metadata: { attempts: result.challenge.attempts },
    });
    if (result.status === "locked") {
      return { ok: false, reason: "locked", error: "تعداد تلاش‌ها بیش از حد شد." };
    }
    const left = OTP_MAX_ATTEMPTS - result.challenge.attempts;
    return { ok: false, error: `کد نادرست است — ${faNum(left)} تلاش باقی مانده.` };
  }

  // Returning account → sign in immediately and skip the display-name step.
  let existing: UserRow | null;
  try {
    existing = await getUserByPhone(challenge.phone);
  } catch (err) {
    console.error("[auth] user lookup failed", {
      route: "/login/verify",
      err,
    });
    return { ok: false, error: "خطا در ارتباط با سرور. کمی بعد دوباره تلاش کن." };
  }
  if (existing) {
    // Banned accounts pass the OTP but never get a session.
    if (existing.is_banned) {
      await clearOtpChallenge();
      return {
        ok: false,
        error: "این حساب مسدود شده است. برای پیگیری با پشتیبانی تماس بگیر.",
      };
    }
    await setSession({
      id: existing.id,
      phone: existing.phone,
      name: existing.display_name,
    });
    await recordSecurityEvent({
      eventType: "otp_verified",
      actorUserId: existing.id,
      subjectType: "otp_challenge",
      subjectId: challenge.id,
      metadata: { accountState: "returning" },
    });
    await clearOtpChallenge();
    return { ok: true, redirectUrl: safeNext(asString(formData.get("next"))) };
  }

  // New phone → carry a verified challenge into the display-name step.
  await setOtpChallenge(result.challenge);
  await recordSecurityEvent({
    eventType: "otp_verified",
    subjectType: "otp_challenge",
    subjectId: challenge.id,
    metadata: { accountState: "new" },
  });
  return { ok: true };
}

/**
 * Step 3 — `/login/verify`: collect the display name, open the session.
 *
 * DEV NOTE: with no users table, every verified phone reaches this step. Once
 * Supabase is wired, look the phone up first and skip straight to the session
 * for a returning user instead of always asking for a name.
 */
export async function completeProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const challenge = await getOtpChallenge();
  if (!challenge || challenge.verifiedAt === null) {
    return { ok: false, reason: "expired", error: "نشست منقضی شده. دوباره وارد شو." };
  }

  const name = asString(formData.get("name")).replace(/\s+/g, " ");
  if (name.length < 2) {
    return { ok: false, field: "name", error: "نام نمایشی حداقل ۲ کاراکتر است." };
  }
  if (name.length > 40) {
    return { ok: false, field: "name", error: "نام نمایشی حداکثر ۴۰ کاراکتر است." };
  }

  let user: UserRow;
  try {
    // Defensive: a parallel tab may have created the row already.
    user =
      (await getUserByPhone(challenge.phone)) ??
      (await createUser({ phone: challenge.phone, displayName: name }));
  } catch (err) {
    console.error("[auth] account creation failed", {
      phone: challenge.phone,
      err,
    });
    return { ok: false, error: "ثبت حساب با خطا مواجه شد. کمی بعد دوباره تلاش کن." };
  }

  await setSession({ id: user.id, phone: user.phone, name: user.display_name });
  await clearOtpChallenge();

  return { ok: true, redirectUrl: safeNext(asString(formData.get("next"))) };
}
