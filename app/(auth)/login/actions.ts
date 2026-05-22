"use server";

/**
 * Auth server actions — the phone-OTP flow boundary.
 *
 * Every action validates its input here (untrusted `FormData`) before touching
 * any state. The throttles below are in-memory and per-process — fine for dev
 * and a single instance; move to Redis / a DB table when you scale out.
 */

import { redirect } from "next/navigation";
import { DEV_OTP, normalizePhone, sendOtp, toEnglishDigits } from "@/lib/auth/otp";
import {
  clearOtpChallenge,
  getOtpChallenge,
  setOtpChallenge,
  setSession,
} from "@/lib/auth/session";
import { createUser, getUserByPhone, type UserRow } from "@/lib/data/users";

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
};

const RESEND_COOLDOWN_MS = 60_000;
const MAX_WRONG = 5;

// Per-process throttles. Keyed by canonical phone number.
const lastSentAt = new Map<string, number>();
const wrongAttempts = new Map<string, number>();

const faNum = (n: number) => n.toLocaleString("fa-IR");

/** Coerce an untrusted form value to a trimmed string. */
function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
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
  const phone = normalizePhone(asString(formData.get("phone")));
  if (!phone) {
    return { ok: false, field: "phone", error: "شماره موبایل معتبر نیست." };
  }

  const since = Date.now() - (lastSentAt.get(phone) ?? 0);
  if (since < RESEND_COOLDOWN_MS) {
    return { ok: false, error: "کد به‌تازگی ارسال شده — کمی صبر کن." };
  }

  try {
    await sendOtp(phone, DEV_OTP);
  } catch (err) {
    console.error("[auth] sendOtp failed", { route: "/login", phone, err });
    return { ok: false, error: "ارسال کد ناموفق بود. کمی بعد دوباره تلاش کن." };
  }

  lastSentAt.set(phone, Date.now());
  wrongAttempts.delete(phone);
  await setOtpChallenge({ phone, verified: false });

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

  const since = Date.now() - (lastSentAt.get(challenge.phone) ?? 0);
  if (since < RESEND_COOLDOWN_MS) {
    return { ok: false, error: "کمی صبر کن، بعد دوباره امتحان کن." };
  }

  try {
    await sendOtp(challenge.phone, DEV_OTP);
  } catch (err) {
    console.error("[auth] resendOtp failed", { phone: challenge.phone, err });
    return { ok: false, error: "ارسال مجدد ناموفق بود." };
  }

  lastSentAt.set(challenge.phone, Date.now());
  wrongAttempts.delete(challenge.phone);
  await setOtpChallenge({ phone: challenge.phone, verified: false });
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

  if ((wrongAttempts.get(challenge.phone) ?? 0) >= MAX_WRONG) {
    return { ok: false, reason: "locked", error: "تعداد تلاش‌ها بیش از حد شد." };
  }

  const code = toEnglishDigits(asString(formData.get("code"))).replace(/\D/g, "");
  if (code.length !== 6) {
    return { ok: false, error: "کد ۶ رقمی را کامل وارد کن." };
  }

  if (code !== DEV_OTP) {
    const attempts = (wrongAttempts.get(challenge.phone) ?? 0) + 1;
    wrongAttempts.set(challenge.phone, attempts);
    const left = MAX_WRONG - attempts;
    if (left <= 0) {
      return { ok: false, reason: "locked", error: "تعداد تلاش‌ها بیش از حد شد." };
    }
    return { ok: false, error: `کد نادرست است — ${faNum(left)} تلاش باقی مانده.` };
  }

  // Correct code.
  wrongAttempts.delete(challenge.phone);

  // Returning account → sign in immediately and skip the display-name step.
  let existing: UserRow | null;
  try {
    existing = await getUserByPhone(challenge.phone);
  } catch (err) {
    console.error("[auth] user lookup failed", { phone: challenge.phone, err });
    return { ok: false, error: "خطا در ارتباط با سرور. کمی بعد دوباره تلاش کن." };
  }
  if (existing) {
    await setSession({
      id: existing.id,
      phone: existing.phone,
      name: existing.display_name,
    });
    await clearOtpChallenge();
    return { ok: true, redirectUrl: safeNext(asString(formData.get("next"))) };
  }

  // New phone → carry a verified challenge into the display-name step.
  await setOtpChallenge({ phone: challenge.phone, verified: true });
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
  if (!challenge || !challenge.verified) {
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
