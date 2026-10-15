# Staging services activation

Requested and authorized by the founder on 2026-10-15: enable real SMS login,
Gemini chat and Web Push on staging, check existing credentials first, and keep
main and its Worker unchanged. Preserve main's Persian Aurora presentation.

## Behavior

1. Existing credential locations and Nazarato history are checked without
   printing secrets. External provider credentials move into macOS Keychain.
2. Real OTP delivery uses Kavenegar only on explicitly enabled staging; a
   missing provider/configuration fails closed. Local fixed codes stay local.
3. OTP state, atomic attempts, one-use verification and send limits live in a
   separate staging D1 database. Shared Supabase accounts remain the app's
   identity store; no shared schema changes or automated test users are needed.
4. Gemini uses a configurable model, server-only header authentication, bounded
   requests and explicit upstream errors. Provider verification uses a small
   non-sensitive prompt, never private Supabase content.
5. Push uses a staging-specific VAPID pair and separate D1 subscriptions. Only
   validated push-service endpoints are accepted. Signed-in users can send a
   test notification to their current device. Staging never dispatches to or
   removes production subscriptions.

## Failure cases and acceptance

- Missing/rejected SMS or AI credentials: explanatory unavailable state; no
  fake successful delivery, fixed public OTP or fallback model claims.
- Replayed OTP cookies, expired/used codes and concurrent guesses: durable
  state enforces expiry, attempt limit and single consumption.
- Denied/unsupported browser Push: visible explanation; server-side delivery
  alone is not proof the browser displayed a notification.
- Main SHA, Worker version and existing bindings stay unchanged. No production
  promotion. Relevant unit tests, typecheck/lint, Worker build and staged live
  checks must pass. Real SMS receipt and real browser notification remain
  separately reported when human/device interaction is required.

## Credential handoff and release boundaries

- Existing keys were checked only in Nazarato Worker bindings, its local
  worktrees, Keychain entries and 25 Nazarato sessions. No Kavenegar or Gemini
  credentials were found. The founder currently cannot supply them.
- Missing inputs are `KAVENEGAR_API_KEY`, `KAVENEGAR_TEMPLATE`, and
  `GEMINI_API_KEY`. The mode-0600 local intake file is
  `~/.config/nazarato/access/staging-services.env`. Never paste secrets into
  Git, Trello, documentation or email. Validate the provider and model first,
  transfer secrets to Keychain/Cloudflare Secrets, then clear the intake file.
- The VAPID private key lives in macOS Keychain service
  `ir.nazarato.staging.vapid-private-key`, account `staging`. Its public key and
  recovery metadata live in `~/.config/nazarato/access/staging-vapid.json`.
  Reuse this pair; do not generate replacements as a deployment convenience.
- D1 migration `202610150001_create_staging_services.sql` applies only to the
  new empty staging database. Its rollback drops staging operational data and
  must not run against a populated database without backup and authorization.
- Upload the isolated subscription code before installing VAPID secrets, so
  older code cannot dispatch to shared production subscriptions. Keep
  `NAZARATO_SMS_ENABLED=false` until Kavenegar delivery is verified.
- Configuration checks use `/api/services/status`; a `configured` response is
  not an end-to-end delivery result. After real login, use
  `/settings/notifications` to enable Push and send a test to the same device.
- Changing staging code/configuration does not authorize a main merge,
  production Worker deployment, or shared Supabase schema changes.
