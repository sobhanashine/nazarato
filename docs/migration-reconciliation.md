# Migration reconciliation before publication

Prepared 2026-10-06 for `codex/product-recovery`. This plan is not a remote apply.
The task tested the checked-in SQL on a disposable local PostgreSQL 15 cluster.
No production/development Supabase project was queried or changed during recovery.

## Reproducible fresh schema

The canonical directory contains 12 legacy SQL files, six September foundation
files and four recovery files: 22 SQL migrations. The local harness bootstraps
only the Supabase roles, `auth.uid()` and storage objects necessary for those
files, then applies them in filename order. It checks private taste history,
denied anonymous reads/RPC, origin-dependent counters and the four new rollbacks.
It is SQL verification, not a substitute for a Supabase integration test.

```sh
PG_BIN=/path/to/postgresql/bin npm run test:migrations:local
```

The harness creates its own temporary directory, uses a Unix socket with TCP
disabled, and stops/removes only its own cluster. Never point it at an existing
database. No seed fixture is retained or uploaded.

## Historical filenames are not new work

The recovered feature branch contains dated aliases and intermediate migrations
that must not be blindly added to the canonical fresh sequence:

| Historical version | Canonical coverage / reconciliation action |
|---|---|
| `20260524104609_0006_create_push_subscriptions` | Compare with `0006_create_push_subscriptions`; reconcile the applied version rather than execute twice |
| `20260525123952_add_owner_responses` | Inline review owner-response columns/triggers covered by `0009_add_owner_responses` |
| `20260525124117_extend_notification_types_owner` | Inspect the live notification constraint against `0009` |
| `20260525124633_create_business_photos_bucket` | Inspect the live storage bucket/policies against `0009` |
| `20260527071634_drop_uq_reviews_business_author` | Superseded intermediate experiment; never apply after the restored unique constraint |
| `20260527151203_restore_uq_reviews_business_author` | Compare with `0011_restore_uq_reviews_business_author` |
| `20260527213757_0012_lower_reviews_body_min` | Compare with `0012_lower_reviews_body_min` |
| `20260602113208_create_contact_submissions` | Compare with `0013_create_contact_submissions` |

“Covered” describes repository intent. The actual remote schema and recorded
history still need inspection. Do not mark a migration applied just because its
table exists. In particular, `0011` contains duplicate cleanup and is destructive
on populated data; take a verified backup and review affected rows before any
replay. Preserve original timestamps in remote history. Any history repair needs
a reviewed version-to-schema map, not filename renaming.

## Recovery apply order and effects

First verify the six September versions: `20260902000000`, `20260903000000`,
`20260903000100`, `20260905000000`, `20260905010000`, `20260907150000`.
Their comments and Trello describe prior development applies; those are historical
records and were not reverified remotely in this task.

Then review the four new versions:

| Version | Effect | Material operational consideration |
|---|---|---|
| `20261006000000` | Service-only atomic real taste save; old model rows remain inactive history | Schema/RPC must precede account save; anonymous/authenticated REST execution is denied |
| `20261006000100` | Nullable owner `metric_version` | Existing actions remain unversioned; no invented comparison or silent baseline rewrite |
| `20261006000200` | Remove permissive direct business/review/helpful-vote read policies | Public app reads use server eligibility gates; direct REST clients lose broad catalog access and individual vote identities |
| `20261006000300` | Add `reviews.origin_kind`, index and first-party count trigger/backfill | Brief column lock and row locks for derived counters; existing origins default `unknown`, so visible counts can drop until reconciliation |

The origin migration changes derived counts, not review text/status. It deliberately
does not infer genuine origin from a row's published status. Classify records using
real provenance and approved test-data rules, one reviewed record/set at a time.
Keep unresolved rows unknown and synthetic rows `development_fixture`. Only the
authenticated review intake sets `first_party` automatically for new submissions.

## Authorized release checklist

1. Confirm the exact Nazarato project identity, current backup and restore method.
2. Read remote migration history and the relevant tables, constraints, triggers,
   RLS policies and storage definitions. Do not inspect unrelated projects.
3. Build the history/schema map above; resolve mismatches before constructing the
   pending SQL set. Record what is already applied and why.
4. Review lock/backfill estimates and existing action/review provenance. Arrange a
   safe application window for populated tables.
5. Apply only the reviewed pending set after explicit authorization. Verify RPC
   grants, anonymous denial, source/status/origin gates, counters and private
   owner/account access against the real environment.
6. Separately approve public factual sources and reconcile eligible first-party
   reviews. A schema apply grants neither publication nor ownership verification.
7. Merge/publish through the project release workflow and verify the provider's
   serving revision and representative routes. A Git commit is not deployment.

## Rollback

Each recovered September and new October migration has a companion under
`supabase/rollbacks`. The local harness exercises the four October files inside
transactions and rolls those checks back. This confirms syntax/behavior on fresh
data; it does not prove a populated production rollback is lossless.

The origin rollback removes provenance tags and restores the older broader counter
definition: export tags before use. The direct-policy rollback restores weaker
anonymous visibility and needs a separate security review. Prefer a forward repair
for a populated environment; neither rollback is a permission to expose private
or unapproved data.
