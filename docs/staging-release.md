# DEV staging

Review target: `https://staging.nazarato.ir`.
Tracking: [task 30](https://trello.com/c/bZhrFQY9).

## Deployment contract

- Cloudflare Worker: `nazarato-staging`; Git repository:
  `sobhanashine/nazarato`; tracking branch: `dev`.
- Build environment: Node 24. Cloudflare Builds build command is empty;
  deploy command is `npm run deploy:staging`. Disable preview builds for
  other branches on this Worker.
- The script requires clean DEV source, builds with
  `NEXT_PUBLIC_NAZARATO_ENV=staging`, deploys only Wrangler's
  `staging` environment, and stamps the exact checkout SHA as
  `RELEASE_SHA`. Local build verification: `npm run build:staging`.
- The existing `nazarato` Worker still tracks `main`. A DEV merge is not
  authorization to merge main or publish the production Worker.
- Staging has its own canonical URL, visible Persian label, noindex headers
  on every document, a disallow-all robots file and an empty sitemap.
  Noindex is a crawler hint, not an access-control mechanism.

## Data and activation boundary

The first staging release is a UI review environment. Supabase management
access is currently unavailable; no remote database was created or migrated.
Leave the database unconfigured until a separate staging project is verified.
The UI reports unavailable supply; `/api/health` must return 503 with
`environment=staging` and `database=unconfigured` in this state.
Do not report that as a fully healthy or data-ready release.

For a data-ready release, configure only this Worker's runtime settings:

- `NAZARATO_STAGING_SUPABASE_REF`: the isolated Supabase project reference.
- `NEXT_PUBLIC_SUPABASE_URL`: its matching HTTPS origin.
- `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`: staging-only secrets.

The shared server client rejects missing isolation configuration, a mismatched
URL, and the known production project. Do not copy production credentials.
Read `migration-reconciliation.md` and apply the verified schema only to the
confirmed isolated target. Public/private source and first-party eligibility
rules still apply. The private local Golsar export must never be uploaded.
Public OTP remains closed; do not set NODE_ENV to development on staging.

## Verification before handover

1. TypeScript, lint, unit tests, isolated browser suite, staging build and
   Wrangler dry-run must pass.
2. Verify HTTPS on the real staging hostname, the staging banner and mobile
   layout, /nabz, an unpublished profile boundary, robots and sitemap.
3. Compare the live health revision to the DEV commit; report database
   readiness separately.
4. Confirm origin/main and the production Worker's deployment are unchanged.
5. Record the actual deployment result in Trello and the completion email.

Local verification on 2026-10-14: 375 unit tests, 13 isolated browser tests
(2 private-catalog cases skipped), tsc, lint, OpenNext staging build and
Wrangler dry-run passed. The built Worker was inspected at 390px; the root
served the staging banner and noindex headers, robots disallowed all crawlers,
and health correctly reported the unavailable database.
