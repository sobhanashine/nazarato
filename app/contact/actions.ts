"use server";

/**
 * Contact-form intake. Validates at the server boundary, then persists to the
 * `contact_submissions` table (migration 0013). A DB failure returns an error
 * to the user — submissions are no longer silently dropped (issue #142).
 */

import { insertContactSubmission } from "@/lib/data/contact";
import { validateContactInput } from "./validation";

export type ContactResult = { ok: true } | { ok: false; error: string };

export async function submitContact(raw: unknown): Promise<ContactResult> {
  // ── Boundary validation ──────────────────────────────────────────────
  const parsed = validateContactInput(raw);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  // ── Intake ───────────────────────────────────────────────────────────
  try {
    await insertContactSubmission(parsed.value);
  } catch (err) {
    // insertContactSubmission already logged the DB error with context.
    console.error("[contact] failed to record submission", {
      route: "/contact",
      err,
    });
    return { ok: false, error: "ثبت پیام با خطا مواجه شد. کمی بعد دوباره تلاش کن." };
  }

  return { ok: true };
}
