# DEV staging

Review target: https://staging.nazarato.ir.
Current task: [34 — Golsar data and staging capabilities](https://trello.com/c/L7OhGwkq).

## Deployment contract

- `nazarato-staging` tracks `dev` in `sobhanashine/nazarato`.
- Node 24; Cloudflare build command is empty; deploy command is
  `npm run deploy:staging`. The script checks DEV and a clean checkout,
  builds with `NEXT_PUBLIC_NAZARATO_ENV=staging`, and stamps `RELEASE_SHA`.
- `nazarato` continues to track `main`. This task does not promote main.
- Staging retains its visible Persian label, separate canonical URL,
  noindex headers, disallow-all robots and empty sitemap. Noindex is not
  access control.
- The visual baseline is **main@86b70d4**, Persian Aurora: dark navy,
  mint/lapis accents, glass surfaces, existing header, hero and navigation.
  Recovered features must be added within this system.

## Explicit shared database decision — 2026-10-15

The founder authorized staging to use main's existing Nazarato Supabase
project **sdlmjdxrfyhuiegjysac**. This supersedes task 30's isolated-only
requirement. Runtime configuration is explicit:

- `NAZARATO_STAGING_DATABASE_MODE=shared-main`
- `NAZARATO_STAGING_SUPABASE_REF=sdlmjdxrfyhuiegjysac`
- `NEXT_PUBLIC_SUPABASE_URL`: the matching HTTPS project origin.
- `SUPABASE_SERVICE_ROLE_KEY`: existing project key, only as a Worker secret.
- `JWT_SECRET`: only as a Worker secret; do not enable development OTP.

The guard rejects unknown modes, mismatched projects, and non-origin URLs.
Without `shared-main`, the default isolated mode still rejects the main
project. Never put secrets in source, build logs, or public environment vars.
On October 16 the application tables/routines were reproduced in the separate
`nazarato_staging` schema inside this same project. Staging now also requires
`NAZARATO_DATABASE_SCHEMA=nazarato_staging`; a missing value fails closed.
Production continues to use `public`. All 18 application tables, foreign keys,
triggers and RPCs remain inside their selected namespace. No production rows
were copied. Storage uses `claim-proofs-staging` and `business-photos-staging`;
OTP, rate limits and Push subscriptions use the existing staging D1 binding.

The earlier four approved public migrations are already reflected in the
inspected remote schema. Do not replay them. The new bootstrap is deliberately
outside public migration history under `supabase/staging/`. A private custom
backup and row fingerprints were captured before the additive schema work.
PostgREST exposes the new schema, but only `service_role` has access; anonymous
and authenticated database roles do not. Application authorization still runs
in the server routes/actions.

## Selected cafe dataset and provenance

The founder authorized the existing screened 22-cafe Golsar dataset for staging.
The import projects factual names, addresses, business contacts and coordinates
with stable IDs; it imports no opinions, ratings, photos or reviewer identities.
One source-reported closed cafe remains inspectable with an explicit warning
and is excluded from Nabz pair supply. All imported review counters start at 0.

`internal_preview` source status means approved for **staging use only**. Its
permission basis remains unknown, production publication remains unapproved,
and no owner verification is implied. These records are not a production data
approval. The older 37-row research sheet and ambiguous same-name matches were
not auto-merged. The raw source, generated COPY SQL and DB backups remain in
ignored private directories; they are never bundled or committed.

Prepare and validate from inspected private inputs:

```sh
node scripts/prepare-staging-schema.mjs <schema-only.sql> <bootstrap.sql>
node scripts/prepare-staging-golsar.mts <selected-cafes.json> <import.sql>
PG_BIN=<postgres-bin> node scripts/check-staging-schema-local.mjs <schema-only.sql> <bootstrap.sql> <import.sql>
```

The local disposable database check covers idempotent import, isolated foreign
keys/routines, access grants, review counters, bookmarks, taste RPC, unchanged
production sentinels and guarded rollback. It accepts no remote connection URL.
For rollback, first disable staging traffic and export staging submissions.
Remove only this schema from PostgREST exposure, reload configuration, verify
public REST still succeeds and staging REST returns 406, then use the guarded
`supabase/staging/rollback.sql`. Never drop a still-exposed schema or overwrite
schema settings added by other work.

## Provider status — 2026-10-16

- Gemini credential retained in macOS Keychain and deployed only to staging.
  `GEMINI_MODEL=gemini-3.7-flash` is a retained Worker binding, not a production
  default. The key lists models and returned a simple response, but grounded
  requests hit provider quota (429) and some requests return busy (503).
  This is not proof of complete chat readiness; no new key is required merely
  for that quota issue.
- Gemini and Push now use `redirect: manual`: workerd rejects `redirect: error`
  before sending. Non-success/redirect responses are rejected without following
  them. `node scripts/check-gemini-worker.mjs` verifies this in actual workerd
  with a mock outbound provider, without sending credentials externally.
- Kavenegar API key and exact approved template name are still absent. The SMS
  flag stays false. Signing in, authenticated saves and a real device Push test
  remain blocked until those values and provider/device verification exist.
- Push keys and staging D1 are retained; provider acceptance and visible device
  receipt remain separate checks. No new VAPID pair was generated.

## Verification before handover

1. TypeScript, lint, unit tests, isolated browser suite, staging build and
   Wrangler dry-run pass.
2. Inspect actual desktop/mobile staging UI, `/nabz`, profile boundaries,
   robots, sitemap and runtime health revision.
3. Confirm origin/main and production release identity remain unchanged.
4. Record remaining access/schema work accurately in Trello and the email.
