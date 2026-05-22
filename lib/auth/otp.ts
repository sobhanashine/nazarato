/**
 * Phone-OTP helpers — number normalization + code delivery.
 *
 * DEV MODE: no SMS provider is wired. `sendOtp` logs the code to the server
 * console and every account uses the same static code (`DEV_OTP`). When
 * Kavenegar credit is available, replace the body of `sendOtp` with a real API
 * call (`KAVENEGAR_API_KEY` / `KAVENEGAR_TEMPLATE` in `.env.local`) and have
 * callers generate a random 6-digit code instead of `DEV_OTP` — that is the
 * only swap needed; the rest of the auth flow is provider-agnostic.
 */

/** Static development OTP. Replace with a random code once SMS is wired. */
export const DEV_OTP = "123456";

/** Convert Persian / Arabic-Indic digits to ASCII so `۰۹۱۲…` parses. */
export function toEnglishDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/**
 * Normalize any Iranian mobile input to canonical `+989XXXXXXXXX`.
 * Accepts `09XXXXXXXXX`, `9XXXXXXXXX`, `00989…`, `+989…` with spaces/dashes.
 * Returns `null` when the result is not a valid Iranian mobile number.
 */
export function normalizePhone(raw: string): string | null {
  let d = toEnglishDigits(raw).replace(/[\s\-()]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  if (d.startsWith("0098")) d = d.slice(4);
  else if (d.startsWith("98")) d = d.slice(2);
  else if (d.startsWith("0")) d = d.slice(1);
  // `d` should now be `9XXXXXXXXX` — Iranian mobiles start with 9, 10 digits.
  if (!/^9\d{9}$/.test(d)) return null;
  return `+98${d}`;
}

/** Human-readable form of a canonical number, e.g. `0912 345 6789` (kept LTR). */
export function formatPhone(canonical: string): string {
  return canonical
    .replace(/^\+98/, "0")
    .replace(/^(\d{4})(\d{3})(\d{4})$/, "$1 $2 $3");
}

/**
 * Deliver the OTP. DEV: logs to the server console. PROD: call Kavenegar here.
 */
export async function sendOtp(phone: string, code: string): Promise<void> {
  // TODO(kavenegar): POST to Kavenegar's verify-lookup endpoint using
  // KAVENEGAR_API_KEY + KAVENEGAR_TEMPLATE once SMS credit is topped up.
  console.log(`[otp] dev code for ${phone} → ${code}`);
}
