import { supabaseAdmin } from "@/lib/supabase/server";

export type SecurityEvent = {
  eventType: string;
  actorUserId?: string | null;
  subjectType: "otp_challenge" | "business_claim";
  subjectId: string;
  metadata?: Record<string, string | number | boolean | null>;
};

/**
 * Best-effort append-only audit. A telemetry outage must not create a second
 * OTP delivery or repeat a claim decision, so callers never retry writes.
 */
export async function recordSecurityEvent(
  event: SecurityEvent,
): Promise<void> {
  try {
    const { error } = await supabaseAdmin().from("security_audit_events").insert({
      event_type: event.eventType,
      actor_user_id: event.actorUserId ?? null,
      subject_type: event.subjectType,
      subject_id: event.subjectId,
      metadata: event.metadata ?? {},
    });
    if (error) {
      console.error("[security-audit] insert failed", {
        eventType: event.eventType,
        subjectType: event.subjectType,
        error: error.message,
      });
    }
  } catch (error: unknown) {
    console.error("[security-audit] unavailable", {
      eventType: event.eventType,
      subjectType: event.subjectType,
      error,
    });
  }
}
