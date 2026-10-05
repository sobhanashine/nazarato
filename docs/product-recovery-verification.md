# Product recovery verification

Prepared 2026-10-06. Branch `codex/product-recovery`, based on
`main@86b70d41d2fb93c690a3d8d9d42aa9cd692b5b45`.
The final check results are recorded with the reviewable PR and
[Trello task 29](https://trello.com/c/3pXvWcUi).

## Recorded results

| Check | Result |
|---|---|
| Unit tests | 363 passed across 71 files |
| TypeScript | Passed, no errors |
| Full ESLint | Passed |
| Isolated browser | 13 passed; two private-catalog checks explicitly skipped |
| Fresh PostgreSQL 15 schema | 22 migrations; privacy/origin checks and four October rollback scripts passed |
| Next/OpenNext Cloudflare build | Passed; generated Worker bundle, without deployment |
| Visual review | Mobile discovery/result and desktop owner observation inspected |

## Reproduce

Use Node 24 from `.nvmrc`, the committed lockfile and a clean isolated checkout.

```sh
npm ci --no-audit --no-fund
npm test
npx tsc --noEmit
npm run lint
npx playwright install chromium --only-shell
npm run test:e2e
PG_BIN=/path/to/postgresql/bin npm run test:migrations:local
npm run build:cloudflare
```

Run the browser harness and build sequentially: both use Next's generated
directory. PostgreSQL 15 was used for the fresh-schema check. Its roles/storage
bootstrap is explicitly a local Supabase substitute.

## What the checks establish

- Unit regressions cover shared source/status gates, first-party review origin,
  removal of fabricated profiles, public JSON projection, restored claim/OTP
  contracts, Persian baseline, real recommendation parsing and privacy, and
  owner date/version/sample/concurrency guards.
- The isolated browser suite covers mobile widths 320/360/390/430, retained
  manual area selection, invalid contact submission, five accepted choices and
  cited results, account save/restore with another user's isolation, sparse or
  revoked supply, weak evidence and database outage, failed-vote draft retention,
  public attribution, and owner before/after observation.
- A connected browser journey submits a first-party experience, verifies
  moderation, applies a versioned owner correction, measures a due historical
  test action and creates a new action with a genuine future due date. It does
  not bypass the due-date guard to manufacture an outcome.
- The SQL harness applies all 22 migration files, checks model history and
  anonymous denial of catalog/review/individual-vote/private-profile reads,
  exercises review-origin counter transitions and executes
  the four October rollback files inside transactions that are rolled back.
- Screenshots of discovery, real result and owner observation were inspected.
  They contain artificial records restricted to the loopback test process.

## Practical limits

These checks establish a reviewable implementation, not real user demand,
model accuracy on a consenting pilot, a live deployment or a remote schema apply.
Two legacy mobile checks require the separate private Golsar catalog and are
explicitly skipped by the public isolated suite. Legacy remote-write browser
tests are excluded from the default config and need an explicitly authorized,
isolated database before reuse.

The real recommendation engine is a conservative deterministic baseline. When
paired businesses lack comparable aspect evidence, it identifies the profile
as preliminary and uses the selected situation without claiming learned traits.
Three distinct authors per aspect, confidence ≥0.55 and evidence age ≤180 days
are minimum gates, not proof of quality. Wi-Fi, local-food authenticity or other
amenities are not inferred from place names or atmosphere/taste scores.

Rate throttles remain process-local; database uniqueness prevents duplicate
daily pair votes. Distributed abuse controls and real-owner measurement are
launch/pilot work, not established by artificial browser evidence. Production
login remains blocked despite recovering per-challenge OTP primitives.
