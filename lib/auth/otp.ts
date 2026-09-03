/**
 * Phone OTP boundary.
 *
 * Production delivery uses Kavenegar's verify/lookup endpoint. Challenge state
 * carries only a keyed digest of the code inside an HMAC-signed, HTTP-only
 * cookie; the six-digit code itself is never persisted. Development keeps a
 * visible fixed code so the local app remains usable without paid SMS credit.
 */
import {
  createHmac,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

export const OTP_TTL_MS = 5 * 60_000;
export const OTP_RESEND_COOLDOWN_MS = 60_000;
export const OTP_MAX_ATTEMPTS = 5;
export const DEFAULT_DEV_OTP = "123456";

type OtpEnvironment = Record<string, string | undefined>;
type Fetcher = typeof fetch;

export type OtpChallenge = {
  id: string;
  phone: string;
  codeDigest: string;
  issuedAt: number;
  expiresAt: number;
  resendAvailableAt: number;
  attempts: number;
  deliveryCount: number;
  verifiedAt: number | null;
};

export type OtpVerificationStatus =
  | "verified"
  | "incorrect"
  | "invalid_format"
  | "expired"
  | "locked"
  | "already_verified";

export type OtpVerificationResult = {
  status: OtpVerificationStatus;
  challenge: OtpChallenge;
};

export type OtpDeliveryProvider = {
  readonly name: "development" | "kavenegar";
  send(input: { phone: string; code: string }): Promise<void>;
};

/** Convert Persian / Arabic-Indic digits to ASCII so `۰۹۱۲…` parses. */
export function toEnglishDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** Normalize Iranian mobile input to canonical `+989XXXXXXXXX`. */
export function normalizePhone(raw: string): string | null {
  let digits = toEnglishDigits(raw).replace(/[\s\-()]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("0098")) digits = digits.slice(4);
  else if (digits.startsWith("98")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  return /^9\d{9}$/.test(digits) ? `+98${digits}` : null;
}

/** Human-readable form of a canonical number, kept LTR by its caller. */
export function formatPhone(canonical: string): string {
  return canonical
    .replace(/^\+98/, "0")
    .replace(/^(\d{4})(\d{3})(\d{4})$/, "$1 $2 $3");
}

function otpHashSecret(env: OtpEnvironment = process.env): string {
  const secret = env.OTP_HASH_SECRET || env.JWT_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (env.NODE_ENV === "production") {
    throw new Error(
      "OTP_HASH_SECRET or JWT_SECRET must be set to at least 32 characters in production",
    );
  }
  return "nazarato-dev-otp-hash-secret-do-not-ship";
}

function digestCode(input: {
  challengeId: string;
  phone: string;
  code: string;
  secret?: string;
}): string {
  return createHmac("sha256", input.secret ?? otpHashSecret())
    .update(`${input.challengeId}:${input.phone}:${input.code}`)
    .digest("base64url");
}

function safeDigestEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** The local code is intentionally visible and deterministic. */
export function getDevelopmentOtpCode(
  env: OtpEnvironment = process.env,
): string {
  const configured = env.OTP_DEV_CODE ?? DEFAULT_DEV_OTP;
  if (!/^\d{6}$/.test(configured)) {
    throw new Error("OTP_DEV_CODE must contain exactly six ASCII digits");
  }
  return configured;
}

export function createOtpCode(
  env: OtpEnvironment = process.env,
  random: (min: number, max: number) => number = randomInt,
): string {
  if (env.NODE_ENV !== "production") return getDevelopmentOtpCode(env);
  return random(0, 1_000_000).toString().padStart(6, "0");
}

export function createOtpChallenge(input: {
  phone: string;
  code: string;
  now?: number;
  challengeId?: string;
  attempts?: number;
  deliveryCount?: number;
  secret?: string;
}): OtpChallenge {
  const now = input.now ?? Date.now();
  const id = input.challengeId ?? randomUUID();
  return {
    id,
    phone: input.phone,
    codeDigest: digestCode({
      challengeId: id,
      phone: input.phone,
      code: input.code,
      secret: input.secret,
    }),
    issuedAt: now,
    expiresAt: now + OTP_TTL_MS,
    resendAvailableAt: now + OTP_RESEND_COOLDOWN_MS,
    attempts: input.attempts ?? 0,
    deliveryCount: input.deliveryCount ?? 1,
    verifiedAt: null,
  };
}

export function getOtpResendWaitSeconds(
  challenge: OtpChallenge,
  now = Date.now(),
): number {
  return Math.max(
    0,
    Math.ceil((challenge.resendAvailableAt - now) / 1_000),
  );
}

export function verifyOtpChallenge(input: {
  challenge: OtpChallenge;
  code: string;
  now?: number;
  secret?: string;
}): OtpVerificationResult {
  const now = input.now ?? Date.now();
  const { challenge } = input;

  if (now >= challenge.expiresAt) return { status: "expired", challenge };
  if (challenge.verifiedAt !== null) {
    return { status: "already_verified", challenge };
  }
  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
    return { status: "locked", challenge };
  }

  const code = toEnglishDigits(input.code).replace(/\D/g, "");
  if (code.length !== 6) return { status: "invalid_format", challenge };

  const candidate = digestCode({
    challengeId: challenge.id,
    phone: challenge.phone,
    code,
    secret: input.secret,
  });
  if (!safeDigestEqual(candidate, challenge.codeDigest)) {
    const failed = { ...challenge, attempts: challenge.attempts + 1 };
    return {
      status:
        failed.attempts >= OTP_MAX_ATTEMPTS ? "locked" : "incorrect",
      challenge: failed,
    };
  }

  return {
    status: "verified",
    challenge: { ...challenge, verifiedAt: now },
  };
}

function toKavenegarReceptor(phone: string): string {
  return phone.replace(/^\+98/, "0");
}

function createDevelopmentProvider(): OtpDeliveryProvider {
  return {
    name: "development",
    async send({ phone, code }) {
      const masked = `${phone.slice(0, 4)}••••${phone.slice(-3)}`;
      console.info(`[otp] development delivery to ${masked}: ${code}`);
    },
  };
}

function createKavenegarProvider(
  apiKey: string,
  template: string,
  fetcher: Fetcher,
): OtpDeliveryProvider {
  return {
    name: "kavenegar",
    async send({ phone, code }) {
      const body = new URLSearchParams({
        receptor: toKavenegarReceptor(phone),
        token: code,
        template,
      });
      const response = await fetcher(
        `https://api.kavenegar.com/v1/${encodeURIComponent(apiKey)}/verify/lookup.json`,
        {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body,
          cache: "no-store",
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (!response.ok) {
        throw new Error(`Kavenegar request failed with HTTP ${response.status}`);
      }
      const payload: unknown = await response.json();
      if (typeof payload !== "object" || payload === null) {
        throw new Error("Kavenegar returned an invalid response");
      }
      const result = payload as {
        return?: { status?: unknown };
        entries?: unknown[];
      };
      if (result.return?.status !== 200 || !result.entries?.length) {
        throw new Error("Kavenegar rejected the OTP delivery request");
      }
    },
  };
}

export function createOtpDeliveryProvider(
  env: OtpEnvironment = process.env,
  fetcher: Fetcher = fetch,
): OtpDeliveryProvider {
  if (env.NODE_ENV !== "production") return createDevelopmentProvider();
  const apiKey = env.KAVENEGAR_API_KEY;
  const template = env.KAVENEGAR_TEMPLATE;
  if (!apiKey || !template) {
    throw new Error(
      "KAVENEGAR_API_KEY and KAVENEGAR_TEMPLATE are required in production",
    );
  }
  return createKavenegarProvider(apiKey, template, fetcher);
}

export async function sendOtp(phone: string, code: string): Promise<void> {
  await createOtpDeliveryProvider().send({ phone, code });
}

/** Non-reversible identifier for abuse controls and security audit metadata. */
export function fingerprintPhone(
  phone: string,
  env: OtpEnvironment = process.env,
): string {
  return createHmac("sha256", otpHashSecret(env))
    .update(phone)
    .digest("base64url");
}
