/**
 * Signed-cookie sessions — dev-grade auth state.
 *
 * Both the session and the short-lived OTP challenge are stored as HMAC-signed,
 * HTTP-only cookies (no database yet). The payload is *signed, not encrypted* —
 * the user can read it, they just can't forge it. Never put anything more
 * sensitive than an id / phone / display name in it.
 *
 * When Supabase Auth is wired, swap the internals for Supabase sessions but
 * keep the exported surface (`getSession`, `setSession`, `clearSession`, and
 * the OTP-challenge helpers) stable — that is what the auth flow depends on.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "nzr_session";
const OTP_COOKIE = "nzr_otp";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const OTP_MAX_AGE = 60 * 5; // 5 minutes — also enforces the "expired" state

/** The logged-in user, as carried in the session cookie. */
export type SessionUser = {
  id: string;
  phone: string;
  name: string;
};

/** OTP challenge carried between `/login` and `/login/verify`. */
export type OtpChallenge = {
  phone: string;
  /** `true` once the 6-digit code is confirmed; gates profile completion. */
  verified: boolean;
};

// ── Signing ────────────────────────────────────────────────────────────────

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set (32+ chars) in production");
  }
  console.warn("[auth] JWT_SECRET not set — using an insecure dev fallback");
  return "dev-insecure-fallback-secret-do-not-ship";
}

function mac(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

/** Encode a payload as `<base64url(json)>.<base64url(hmac)>`. */
function sign(payload: unknown): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${mac(body)}`;
}

/** Verify + decode a signed token. Returns `null` on tampering or bad input. */
function unsign(token: string | undefined): unknown {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  const got = Buffer.from(token.slice(dot + 1));
  const want = Buffer.from(mac(body));
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

// ── Type guards (never trust a decoded payload's shape) ─────────────────────

function isSessionUser(v: unknown): v is SessionUser {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.phone === "string" &&
    typeof o.name === "string"
  );
}

function isOtpChallenge(v: unknown): v is OtpChallenge {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.phone === "string" && typeof o.verified === "boolean";
}

// ── Cookie helpers ─────────────────────────────────────────────────────────

const baseCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/** Issue a session cookie for `user`. */
export async function setSession(user: SessionUser): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, sign(user), {
    ...baseCookie,
    maxAge: SESSION_MAX_AGE,
  });
}

/** Read the current session, or `null` if signed-out / tampered / expired. */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const v = unsign(store.get(SESSION_COOKIE)?.value);
  return isSessionUser(v) ? v : null;
}

/** Sign the user out. */
export async function clearSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Store the pending OTP challenge (5-minute lifetime). */
export async function setOtpChallenge(challenge: OtpChallenge): Promise<void> {
  const store = await cookies();
  store.set(OTP_COOKIE, sign(challenge), { ...baseCookie, maxAge: OTP_MAX_AGE });
}

/** Read the pending OTP challenge, or `null` if missing / expired / tampered. */
export async function getOtpChallenge(): Promise<OtpChallenge | null> {
  const store = await cookies();
  const v = unsign(store.get(OTP_COOKIE)?.value);
  return isOtpChallenge(v) ? v : null;
}

/** Discard the OTP challenge (after a successful login or a fresh restart). */
export async function clearOtpChallenge(): Promise<void> {
  (await cookies()).delete(OTP_COOKIE);
}
