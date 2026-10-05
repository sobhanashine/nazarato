# نظراتو — Data Model

> Single source of truth for the database schema: tables, columns, constraints,
> and the decisions behind them. Companion to [`pages-master.md`](./pages-master.md)
> (pages) and [`PROJECT.md`](./PROJECT.md) (architecture).
> Update this when you add/rename/remove a column or table.

Last edited: 2026-10-06 (recovery schema additions)
Owner: Sobhan (solo founder)
Target DB: existing Supabase (Postgres). Auth is app-managed phone OTP and signed
cookies; account rows live in `public.users`, not `auth.users`.
Schema delivery is distinct from a remote apply; see
[migration reconciliation](migration-reconciliation.md).

---

## 1. Conventions

- **Naming** — `snake_case` tables and columns. Plural table names.
- **Keys** — `uuid` primary keys (`gen_random_uuid()`); `users.id` is an app
  account key, not a foreign key to Supabase Auth.
- **Timestamps** — `timestamptz`, default `now()`. Every table has `created_at`;
  mutable tables also have `updated_at`.
- **Enums** — modeled as `text` + `CHECK` constraint (easier to evolve than PG
  `enum` types). Allowed values are listed per column below.
- **Phasing** — `[MVP]` columns are built now; `[P3]` columns are added to the
  schema now (cheap) but populated only when the gamification engine ships.
  See `pages-master.md` §6 "Gamification & trust loop".
- **Counters** — columns like `*_count`, `rating_sum`, `helpful_count`,
  `response_rate` are *denormalized*. Keep them in sync with **Postgres
  triggers**, not app code — triggers can't be bypassed.

---

## 2. `users` — consumer / owner profile

Auth is **app-managed** (phone OTP + signed-cookie sessions — see `lib/auth/`),
so `users` is a standalone table: it carries its own `phone` column and does
**not** extend Supabase's `auth.users`. This row is the public-facing profile.
MVP columns are defined in `supabase/migrations/0001_create_users_table.sql`;
this recovery did not reverify their remote deployment.

| Column | Type | Default | Phase | Purpose |
|---|---|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` | MVP | App-generated (not an `auth.users` FK) |
| `phone` | `text` UNIQUE | — | MVP | Verified mobile, canonical `+989…` — the login key |
| `username` | `text` UNIQUE | — | MVP | URL slug for `/users/[username]` — nullable until set in profile edit |
| `display_name` | `text` | — | MVP | Pseudonymous public name — never legal name |
| `avatar_url` | `text` null | — | MVP | Uploaded avatar |
| `avatar_color` | `text` | — | MVP | Hex fallback color (matches existing `color`) |
| `bio` | `text` null | — | MVP | Max 140 chars |
| `role` | `text` | `'consumer'` | MVP | `'consumer'` \| `'admin'` |
| `public_profile` | `boolean` | `true` | MVP | Privacy toggle → 404s the profile when false |
| `is_banned` | `boolean` | `false` | MVP | Moderation |
| `reviews_count` | `int` | `0` | MVP | Denormalized counter |
| `reputation_score` | `int` | `0` | P3 | Drives reviewer level |
| `helpful_votes_received` | `int` | `0` | P3 | Sum of helpful votes across their reviews |
| `verified_reviews_count` | `int` | `0` | P3 | Count of their approved-proof reviews |
| `created_at` | `timestamptz` | `now()` | MVP | Doubles as account-age → trust weight |
| `updated_at` | `timestamptz` | `now()` | MVP | |

- **`role` is not where ownership lives.** "Owner" is not a global role — a user
  owns *specific* businesses via `businesses.owner_id`. The same person reviews
  as a consumer and manages their business. Only `admin` needs an elevated flag.
- **Reviewer level** (تازه‌وارد → منتقد ارشد) is *derived* from
  `reputation_score` at read time — do not store it.

---

## 3. `businesses` — companies + Instagram shops

| Column | Type | Default | Phase | Purpose |
|---|---|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` | MVP | |
| `slug` | `text` UNIQUE | — | MVP | `/company/[slug]` or `/shop/[handle]` |
| `type` | `text` | `'company'` | MVP | `'company'` \| `'ig_shop'` |
| `name` | `text` | — | MVP | |
| `category_slug` | `text` | — | MVP | FK → `categories` later |
| `city` | `text` null | — | MVP | |
| `description` | `text` null | — | MVP | |
| `initial` | `text` | — | MVP | Avatar fallback (existing convention) |
| `color` | `text` | — | MVP | Avatar fallback hex |
| `logo_url` | `text` null | — | MVP | |
| `cover_url` | `text` null | — | MVP | |
| `contact` | `jsonb` | `'{}'` | MVP | `{ website, phone, instagram }` |
| `hours` | `jsonb` null | — | MVP | `[{ day, value }]` (companies only) |
| `info` | `jsonb` | `'[]'` | MVP | `[{ label, value }]` |
| `claimed` | `boolean` | `false` | MVP | |
| `owner_id` | `uuid` null | — | MVP | FK → `users(id)`, set on claim approval |
| `verified` | `boolean` | `false` | MVP | Business identity verified (≠ review verified) |
| `status` | `text` | `'active'` | MVP | `'active'` \| `'pending'` \| `'merged'` \| `'hidden'` |
| `review_count` | `int` | `0` | MVP | Denormalized |
| `rating_sum` | `int` | `0` | MVP | Denormalized — lets average update cheaply |
| `rating_avg` | `numeric(2,1)` | generated | MVP | `GENERATED ALWAYS AS (rating_sum / NULLIF(review_count,0))` |
| `last_review_at` | `timestamptz` null | — | MVP | Recency ranking |
| `response_count` | `int` | `0` | P3 | Owner responses given |
| `response_rate` | `numeric` | `0` | P3 | `response_count / review_count` |
| `avg_response_hours` | `numeric` null | — | P3 | "معمولاً ظرف X ساعت پاسخ می‌دهد" |
| `created_at` | `timestamptz` | `now()` | MVP | |
| `updated_at` | `timestamptz` | `now()` | MVP | |

- **One table + `type` column** (resolves the IG-shop-vs-business question — see
  `pages-master.md` §7 "Recently resolved").
  Simpler joins, one slug namespace so `/company/x` and `/shop/x` can't collide,
  shared `<BusinessCard />`. Cost: a few columns apply to one type only
  (`hours` for companies; IG handle/DM live inside `contact`).

---

## 4. `reviews`

| Column | Type | Default | Phase | Purpose |
|---|---|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` | MVP | |
| `business_id` | `uuid` | — | MVP | FK → `businesses(id)` |
| `author_id` | `uuid` | — | MVP | FK → `users(id)` |
| `rating` | `smallint` | — | MVP | `CHECK (rating BETWEEN 1 AND 5)` |
| `title` | `text` null | — | MVP | Max 80 chars |
| `body` | `text` | — | MVP | `CHECK (char_length(body) BETWEEN 10 AND 2000)` |
| `status` | `text` | `'pending'` | MVP | `'pending'` \| `'published'` \| `'rejected'` — moderation gate |
| `origin_kind` | `text` | `'unknown'` | Recovery | `'first_party'` \| `'development_fixture'` \| `'unknown'`; published status alone never proves genuine origin |
| `rejection_reason` | `text` null | — | MVP | Shown on `/profile/reviews` |
| `verified` | `boolean` | `false` | MVP | Proof approved → نقد تأییدشده |
| `proof_status` | `text` | `'none'` | MVP | `'none'` \| `'submitted'` \| `'approved'` \| `'rejected'` |
| `proof_url` | `text` null | — | MVP | Temp storage — set to NULL after admin check |
| `proof_type` | `text` null | — | MVP | `'invoice'` \| `'sms'` \| `'tracking'` \| `'dm'` \| `'receipt'` |
| `purchase_date` | `date` null | — | MVP | Optional, from the write-review form |
| `helpful_count` | `int` | `0` | MVP | Denormalized from `review_votes` |
| `report_count` | `int` | `0` | MVP | Denormalized from `review_reports` |
| `has_owner_response` | `boolean` | `false` | MVP | Denormalized — powers the "has-response" filter |
| `created_at` | `timestamptz` | `now()` | MVP | |
| `updated_at` | `timestamptz` | `now()` | MVP | |
| `edited_at` | `timestamptz` null | — | MVP | When set, UI shows "ویرایش‌شده" |

- **`UNIQUE (business_id, author_id)`** — one review per user per business
  (editable, not re-postable). The single most effective anti-spam rule.
- **`proof_url` lifecycle** — image uploaded → admin reviews it → `verified` /
  `proof_status` set → **`proof_url` nulled and the storage file deleted**. Keep
  the verdict, not the personal document. Less storage, less liability.
  (See `pages-master.md` §1 "Verified reviews".)
- **Verification is never mandatory.** Public eligibility requires published
  first-party origin and an eligible business with approved source. Proof and
  future badges do not replace those gates. Only public first-party reviews
  contribute to the review/rating counters.

---

## 5. Supporting tables

| Table | Columns | Key constraint | Phase |
|---|---|---|---|
| `review_votes` | `id`, `review_id`, `user_id`, `created_at` | `UNIQUE (review_id, user_id)` | MVP |
| `bookmarks` | `id`, `user_id`, `business_id`, `created_at` | One account/business pair | MVP |
| `business_claims` | Business/account, claim status/proof and OTP verification state | See `0008` and September OTP hardening | MVP |
| `notifications`, `push_subscriptions` | Account-scoped notifications and push endpoints | Server-authorized account access | MVP |
| `contact_submissions` | Validated contact intake | Defined in `0013` | MVP |
| `badges`, `user_badges` | — | not modeled until the P3 engine is built | P3 |

Owner replies are inline `reviews.owner_response_body` (10–1500 characters)
and `owner_response_at`, added by `0009`; a trigger maintains
`has_owner_response`. The earlier proposed `business_responses` and
`review_reports` tables are not in the canonical migrations. Do not invent
their existence from the route inventory.

### September foundation and October recovery

| Table / field | Contract |
|---|---|
| `businesses.neighborhood_slug/latitude/longitude/price_band` | Nullable discovery data with coordinate/price checks |
| `business_sources` | Field payload/hash, source/permission/licence, capture/review status; fixtures always quarantined; private raw payload |
| `comparison_votes` | Exactly one account or opaque session identity; distinct business pair, situation/city and daily window; unique identity/pair/window |
| `review_analyses` | Review/model/version key; one active analysis per review; evidence, confidence, human verdict and timestamp |
| `review_analysis_corrections` | Append-only application events linked to the reviewed model/version, original output and human label |
| `taste_profiles` | Private account/model/version key; one active profile per account; prior models retained inactive |
| `business_improvement_actions` | One planned/active action per business; fixed baseline, target, due date, model and nullable `metric_version`; all six observation fields written together |
| `business_source_review_events`, `business_source_publication_events` | Separate source-review/publication audit events; approval does not establish ownership |
| `security_audit_events` | Private bounded claim/auth security events |

`save_real_taste_profile(uuid,jsonb)` is executable only by `service_role`.
It serializes model transitions per account with an advisory transaction lock.
The real `nabz-real-evidence@1.0.0` profile is stored in
`dimension_weights` as a versioned object containing situation, normalized
weights, five-choice evidence count, usable signal count and update timestamp;
the server validates the complete shape on save and restore.

Owner observations use `qualified-review-rate/1` and the same analysis version
as the stored baseline. Legacy NULL metric versions remain withheld, rather
than receiving fabricated baselines. Public counters include only published
first-party reviews; unknown is the safe default for old records.

---

## 6. Triggers, indexes, RLS

### Denormalized counters — keep in sync with triggers

| Trigger on | Updates |
|---|---|
| `reviews` insert/update/delete | `businesses.review_count`, `rating_sum`, `last_review_at`; `users.reviews_count` |
| `review_votes` insert/delete | `reviews.helpful_count`; `users.helpful_votes_received` |
| `reviews.owner_response_body` update | `reviews.has_owner_response`, `owner_response_at` |

### Indexes (MVP)

- `reviews (business_id, status, created_at)`
- `reviews (author_id)`
- `businesses (category_slug, status)`
- `businesses (slug)`
- `users (username)`

### Row-Level Security and server authorization

App-managed cookies are not Supabase Auth JWTs. The server service-role client
bypasses RLS and must authorize every consumer/owner/admin access. RLS supplies
no anonymous policies for private source, vote, analysis/correction, taste or
owner-action tables. Recovery removes the older broad anonymous policies on
businesses/reviews/helpful votes so direct REST cannot bypass application
eligibility or reveal individual voter identities.

Private profiles return generic metadata/not-found to outsiders. Public feeds
use approved-source/status and first-party review-origin gates; proofs and raw
private vote/taste data are never serialized into those feeds. Do not describe
application checks as column-level RLS guarantees.

### Anti-gaming is a query, not a column

Velocity detection ("N reviews on one business from accounts younger than X days
within Y hours") runs against `reviews.created_at` + `users.created_at`. No
schema needed — it is a moderation query.

---

## 7. Open questions

- `categories` table shape — currently `lib/data/categories.tsx`. Promote to a
  table with `slug` PK before wiring `businesses.category_slug` as a real FK.
- Multiple proof images per review? Current draft allows one (`proof_url`).
  Promote to a `review_proofs` child table if one image proves insufficient.
- Soft-delete vs hard-delete for `reviews` / `users` — tied to `pages-master.md`
  §7's open decision on deletion policy.

---

## 8. Changelog

- **2026-10-06** — Reconciled actual inline owner replies, private foundation
  tables, real taste RPC, owner metric version and first-party origin/counters.
  Fresh local sequence verified; remote schema/history apply remains separate.
- **2026-05-22** — Initial draft. Three core tables (`users`, `businesses`,
  `reviews`) + supporting tables. Gamification columns added as `[P3]`.
- **2026-05-22** — `users` table created in Supabase (migration
  `supabase/migrations/0001_create_users_table.sql`) for phone-OTP auth (#13).
  Auth is app-managed, so `users` is standalone — app-generated `id`, added a
  `phone` column, no `auth.users` FK. RLS enabled, no policies.
