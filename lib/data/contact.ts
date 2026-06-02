/**
 * Contact-form persistence. The service-role client (bypasses RLS) is the only
 * thing allowed to touch `contact_submissions` — see migration 0013.
 */
import type { ContactInput } from "@/app/contact/validation";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Insert a validated contact submission. Throws on DB failure so the caller can
 * surface a real error to the user instead of a false success.
 */
export async function insertContactSubmission(input: ContactInput): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("contact_submissions")
    .insert({
      name: input.name,
      email: input.email,
      // Empty optional subject is stored as NULL, not "".
      subject: input.subject || null,
      message: input.message,
    });

  if (error) {
    console.error("[contact] insert failed", {
      route: "/contact",
      emailDomain: input.email.split("@")[1] ?? "(none)",
      messageLength: input.message.length,
      error: error.message,
    });
    throw new Error("contact submission insert failed");
  }
}
