/**
 * SMFlow AI Assistant widget — server-side identify helper.
 *
 * The widget is a third-party chat bubble loaded from staging.smflow.io.
 * Anonymous visitors are gated by an email prompt; we skip that gate for
 * logged-in users by passing an `identify` payload with an HMAC of the email.
 *
 * The HMAC must be computed server-side — exposing `SMFLOW_WIDGET_SECRET` to
 * the browser would let anyone impersonate any visitor. The plaintext email
 * itself is fine to inline into the page (it's the SMFlow account's
 * canonical identifier for the visitor, not a credential).
 *
 * Nazarato has no email column on `users` yet (phone-only auth), so for now
 * we mint a stable synthetic address per user-id. When/if we add real
 * emails, swap `syntheticEmailFor(userId)` for the real column.
 */
import { createHmac } from "node:crypto";

export type SmflowConfig = {
  businessId: string;
  secret: string;
};

export type SmflowIdentity = {
  email: string;
  name: string;
  hash: string;
};

/**
 * Resolve env-driven config, or `null` if either half is missing.
 * Returning null (instead of throwing) lets the layout render fine in local
 * dev and preview environments that don't have the integration set up.
 */
export function getSmflowConfig(): SmflowConfig | null {
  const businessId = process.env.NEXT_PUBLIC_SMFLOW_BUSINESS_ID;
  const secret = process.env.SMFLOW_WIDGET_SECRET;
  if (!businessId || !secret) return null;
  return { businessId, secret };
}

function syntheticEmailFor(userId: string): string {
  return `${userId}@users.nazarato.ir`;
}

/** Build the identify payload for a logged-in visitor. */
export function buildSmflowIdentity(
  user: { id: string; name: string },
  secret: string,
): SmflowIdentity {
  const email = syntheticEmailFor(user.id);
  const hash = createHmac("sha256", secret).update(email).digest("hex");
  return { email, name: user.name, hash };
}
