# DEV staging

Review target: https://staging.nazarato.ir.
Current task: [31 — main design integration](https://trello.com/c/NiG1G2HJ).

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
Sharing the DB means real staging writes affect the same records used by main.
Run automated mutation tests exclusively against the loopback substitute.

Read-only REST access to this exact project was verified on October 15.
Administrative Supabase access still returns Forbidden. The founder asked
us to continue the UI release and will supply access later. No SQL or fixture
import was executed. The schema currently lacks `save_real_taste_profile`,
`reviews.origin_kind`, and `business_improvement_actions.metric_version`.
Read `migration-reconciliation.md` and inspect migration history/policies
before applying the prepared October migrations. Never blindly replay all
migrations or approve source records to make the UI appear populated.

Until runtime secrets and schema are verified, report UI delivery separately
from database readiness. A 503 health response is not a fully ready product.
Public-source approval, first-party review rules, private profiles and
production-mode authentication remain enforced.

## Verification before handover

1. TypeScript, lint, unit tests, isolated browser suite, staging build and
   Wrangler dry-run pass.
2. Inspect actual desktop/mobile staging UI, `/nabz`, profile boundaries,
   robots, sitemap and runtime health revision.
3. Confirm origin/main and production release identity remain unchanged.
4. Record remaining access/schema work accurately in Trello and the email.
