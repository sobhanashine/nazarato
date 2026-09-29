# Spec: Golsar preview using the existing dev review flow

Authorized by the user's instruction to branch from updated dev and reuse the prepared review flow. Base: origin/dev at 36f5fba; branch: codex/golsar-existing-review-flow.

**Problem.** The founder needs to test discovery and review-writing for Golsar cafes using Nazarato's existing product experience.

**User action.** Find a cafe, open its profile, choose Write experience, then use the existing ReviewSheet rating → text → result steps. Saved browser experiences can be reopened, edited and deleted.

**Data changes.** Read the private 22-cafe snapshot at runtime. A local preview adapter saves versioned cafe-specific browser records. The default ReviewSheet still uses authenticated submitQuickReview and Supabase. This iteration has no schema changes or database writes.

**Failure modes.** Missing/invalid snapshot shows an unavailable state. Invalid rating/text stays in the shared wizard. Storage quota/permission failure shows an error and preserves the typed text. Non-local and production requests return notFound before snapshot loading.

**Done when.** The dev-based branch opens the existing wizard from cafe profiles, browser save/edit/delete work, and public review behavior remains authenticated.

## Run locally

Place the reviewed source snapshot in data/private/golsar-pilot.json (ignored by Git).

```sh
NEXT_PUBLIC_SMFLOW_ENABLED=false NAZARATO_LOCAL_PREVIEW=true npm run dev -- --hostname 127.0.0.1 --port 3016
```

Open http://127.0.0.1:3016/preview/golsar. Experiences stay on this browser and origin. Voice transcription is disabled in this local preview.

## Database path for the real pilot

The existing dev branch already uses Supabase PostgreSQL. users and businesses have stable primary keys; reviews reference both, start pending, and have a unique business/author constraint. The existing submitQuickReview is the write path.

Before accepting real pilot reviews: reconcile source Place IDs with existing businesses; keep source provider, capture time and review/publication state separate from owner claims; map each candidate to a stable business ID and slug; use signed-in accounts and the existing moderation queue. Preserve the cleaned source snapshot for reproducible import. Browser test experiences must never be imported as customer reviews.

Verify applied migrations against the selected database environment, including 0012_lower_reviews_body_min.sql, which aligns the SQL constraint with the current 10-character form minimum. Use separate development and production data, backups, and restore verification before public launch. Larger traffic should be measured before changing the existing indexed relational design.

## Verification

- 91 unit tests / 13 files passed; 12 tests added on this branch (8 snapshot/storage boundary tests, 4 wizard adapter tests). The 4 adapter tests failed before implementation.
- TypeScript and lint of all changed source files passed; production build passed using the existing ignored local environment configuration.
- Real Chrome checks at 390 and 1280px passed: 22 cafes, Persian search, empty state, existing rating/text/result wizard, save, reload, edit, delete, quota error with text retained, default public auth gate, RTL, no horizontal overflow, no browser errors and no network writes. Test experiences were deleted. Chrome's cleanup left the temporary runner waiting after its checks and result were written; that runner was stopped separately.
- Production returned 404 even with NAZARATO_LOCAL_PREVIEW=true; development with a non-loopback Host returned 404. No private files appeared in any build trace; the snapshot and local environment are ignored by Git.
- A read-only database check confirmed businesses, users, reviews and business_sources are reachable. Counts are infrastructure evidence, not a claim that those records are pilot-approved or genuine customer data.
- Full repository lint still reports 6 errors and 6 warnings in the unchanged chat files from origin/dev; no global lint-pass claim is made. This does not affect the scoped preview checks.
