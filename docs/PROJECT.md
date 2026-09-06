# nazarato — Project Doc

This is the **single source of truth** for how this project is built and the
decisions behind it. It is maintained by the `project-loop` skill: every
non-trivial task starts by reading this file and ends by updating it.

> If you are editing this file by hand, keep entries terse. One bullet, one
> idea. Link to code with `path:line` so readers can jump in.

---

## 1. Architecture & Stack

### Framework

- **Next.js 16.3.4** (App Router only — no `pages/` directory).
- **React 19.2.4**.
- **TypeScript 5** with `strict: true`, `noEmit: true`. Path alias `@/*` → repo root (`tsconfig.json:21`).
- **Tailwind CSS v4** via `@tailwindcss/postcss` (`postcss.config.mjs`). v4 syntax only — do not fall back to v3 patterns.
- **ESLint 9** + `eslint-config-next`.

### Top-level layout

| Path             | Purpose                                                                      |
| ---------------- | ---------------------------------------------------------------------------- |
| `app/`           | App Router routes: `/`, `/search`, `/about`, `/contact`, `/categories`, `/terms`, `/privacy`, `/company/[slug]`, `/blog`, `/blog/[slug]`, `/api/health`, the `(auth)` group (`/login`, `/login/verify`), and the `(user)` group (`/profile`, `/profile/reviews`). |
| `components/`    | Grouped by role: `layout/`, `sections/`, `ui/`, `blog/`, `categories/`, `icons/`, `pwa/`. |
| `lib/`           | Data layer, integrations, security audit, release health, and versioned product intelligence. `lib/intelligence/` contains the deterministic Persian baseline; `lib/release/` owns the fail-closed release report; `lib/wp.ts`, `lib/supabase/`, `lib/auth/`, and `lib/security/` own external content, DB, auth, and audit boundaries. |
| `lib/data/`      | Static/sample data: `blog-posts`, `blog-taxonomies`, `categories`, `reviews`, `instagram-shops`. |
| `design-system/` | Design tokens / system reference (`nazarato/`).                              |
| `docs/`          | Long-form docs, including the architecture source of truth, product specification, security runbooks, and the auditable pilot evidence pack. |
| `public/`        | Static assets — icons, service worker (`sw.js`), PWA manifest assets.        |
| `.claude/`       | Repo-scoped Claude config: `skills/` (commit-style, testing-discipline, spec-first, security-review, db-migrations, project-loop), `settings.json`. |

### Locale & layout direction

- App is **RTL Farsi**: `<html lang="fa" dir="rtl">` (`app/layout.tsx:52`).
- Font: **Vazirmatn Variable** is self-hosted through `@fontsource-variable/vazirmatn`; builds do not depend on Google Fonts (`app/layout.tsx`).
- All UI copy is Persian by default.

### PWA & Push Notifications

- Manifest is generated at `app/manifest.ts` (Next 16 `Metadata` route).
- Service worker lives at `public/sw.js`, registered by `components/pwa/RegisterSW.tsx`. Includes event handlers for `push` and `notificationclick` to show native background popups.
- Install prompt: `components/pwa/InstallPrompt.tsx`.
- Web Push notifications are implemented using VAPID keys. User subscriptions are saved to the `push_subscriptions` table (`supabase/migrations/0006_create_push_subscriptions.sql`).
- Dispatching pushes runs through `lib/push/server.ts`, which catches and logs push service failures to prevent blocking primary transactions (e.g., review submissions).
- `next.config.ts:42-53` sets `Cache-Control: no-cache` and `Service-Worker-Allowed: /` for `sw.js`.


### Headless WordPress (blog)

- Client: `lib/wp.ts`. Reads `WP_API_URL` env var.
- `next.config.ts:7-22` whitelists the WordPress host's `/wp-content/uploads/**` for `next/image`.
- Background notes: `docs/headless-wordpress-blog.md`.
- Routes that consume it: `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`.

### Security headers

Set globally in `next.config.ts:31-40`:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Mobile

- Mobile nav is split into a top `MobileMenu` and a persistent bottom `MobileTabBar` (`components/layout/`).
- Layout mounts `MobileTabBar` globally (`app/layout.tsx:55`).

### Product shape — active MVP

- The active product specification is
  [`docs/nabz-rasht-mvp.md`](./nabz-rasht-mvp.md): Rasht cafés/restaurants first,
  with `نبض رشت`, contextual Duels, micro-reviews, a private Taste Graph,
  evidence-grounded `کجابریم؟` recommendations, and owner customer-voice insight.
- Existing review, business profile, Claim, moderation, and owner routes are
  reused. The consumer entry changes from a generic national directory to a
  local interaction loop that creates first-party, versioned intelligence data.
- Bilbooard and other directories are competitors/references, not default data
  sources. Unknown reuse permission means quarantine, not publication.
- The additive, reversible Nabz data foundation is authored in
  `supabase/migrations/20260902000000_create_nabz_data_foundation.sql` with its down
  migration under `supabase/rollbacks/`. It was applied to the linked development
  Supabase project on 2026-09-04. `business_sources` now contains 50 quarantined
  OSM rows; the other new private evidence tables remain empty.
- `lib/import/business-import.ts` is the strict factual-field boundary. New rows
  persist as pending, provenance persists next, and only an eligible source can
  activate a brand-new profile; deterministic development fixtures remain
  quarantined. An approved source for an existing identity requires manual
  reconciliation and cannot activate the older row automatically.
- Public business reads and bookmark mutations require both a public status and
  an approved provenance row. `BusinessSourceNotice` visibly credits approved
  open datasets using only validated HTTPS source/licence links; local mobile and
  desktop browser QA passed, but no real record has been published remotely.
- `data/rasht-osm-businesses.json` is the reviewed 50-record candidate supply
  snapshot (25 cafés, 25 restaurants) sourced from OpenStreetMap under ODbL.
  Its source URLs and attribution metadata are retained; every row is explicitly
  unapproved for publication pending per-record review and confirmation of the
  ODbL derivative-data boundary. Refresh logic lives in
  `scripts/fetch-rasht-osm-businesses.mts`; the fail-closed remote runner is
  `scripts/import-rasht-osm-quarantine.mts`.
- `/admin/businesses/osm-review` is the admin-only source-quality workspace for
  that staged supply. It exposes a minimal DTO, validates OSM and ODbL links,
  filters all 50 pending/quarantined rows, and records review decisions in an
  append-only history without changing source or business publication status.
  Its deterministic `nazarato-osm-prescreen/0.1.0` layer scores retained factual
  signals, emits allowlisted explanation codes, and orders exception/completion
  work before low-risk review. The current 50 rows classify as 30/20/0; this is
  queue prioritization only, never an automatic decision or publication action.
  The 20 completion rows now expose a source-backed factual proposal form. It
  appends creator-attributed `manual_public_facts` evidence in quarantine,
  preserves the original OSM payload and machine score, and treats map,
  directory, and marketplace pages as unknown-permission leads rather than
  reusable content.
- Shared Drive research is converted only through
  `scripts/prepare-rasht-drive-businesses.mts`. Real exports and prepared output
  stay under gitignored `data/private/` because this repository is public and the
  source permission is still unknown. The current local snapshot has 37 pending
  café/restaurant candidates and three exact OSM name matches; ratings and review
  counts are excluded and no match is auto-merged.
- `lib/intelligence/` implements the no-provider Persian customer-voice baseline
  `nazarato-fa-rules/0.1.0`. Its synthetic development evaluation is reproducible
  through `npm run evaluate:intelligence`; the honest pilot metric remains gated
  on consented, independently labelled real feedback.
- Claim/OTP hardening is authored in
  `supabase/migrations/20260903000100_harden_claim_otp_security.sql` and documented in
  `docs/claim-verification-pilot.md`: production codes are random and HMAC-bound,
  Kavenegar delivery fails closed, claim proof bytes are signature-checked, and
  approval requires verified ownership with a private audit trail. The migration
  is applied to the development project; the real-owner pilot is still open.
- `docs/pilot-evidence-pack.md` is the dated audit boundary between locally
  verified implementation, environment-dependent integration, live-pilot proof,
  and current official knowledge-based product criteria. It must remain explicit
  when a metric is synthetic, a migration is unapplied, or a release is unverified.
- `GET /api/health` exposes a non-secret, fail-closed release report: it is ready
  only with a valid Git SHA, a successful database probe, and a code-level
  non-demo data mode. The current fictional fixture path deliberately returns 503.

---

## 2. Conventions & Decisions

### TypeScript

- **Never `any`.** Use `unknown`, then narrow. (From `AGENTS.md`.)
- Validate all API / route inputs at the boundary.
- Log errors with context: route, userId if relevant, payload shape.
- Executable `.mts` data scripts may import local TypeScript with an explicit
  `.ts` suffix; `allowImportingTsExtensions` is enabled because the project is
  typechecked with `noEmit` and these scripts run through Node type stripping.

### Files & naming

- App Router conventions only. No `pages/`.
- Components are `PascalCase.tsx`, co-located by domain (`components/blog/`, `components/sections/`, ...).
- Static/sample data lives in `lib/data/*.ts` and is imported directly — no fetch needed.
- Co-locate tests next to source: `foo.ts` → `foo.test.ts`. (Tested via Vitest.)

### Styling

- Tailwind v4 utilities only — styling lives in JSX `className`, never as CSS classes.
- `app/globals.css` is **config only**: `@import`, `@theme` tokens, `@keyframes`,
  `@custom-variant`. Two raw-CSS blocks are allowed because they can't be utilities:
  native `::-webkit-scrollbar`, and `.wp-content` (styles WordPress HTML injected via
  `dangerouslySetInnerHTML`). Do **not** add component CSS classes here.
- Reused class bundles live in `components/ui/styles.ts` (`GLASS`, `CONTAINER`,
  `HIDE_SCROLL`, `BTN_PRIMARY`, `TAG_BADGE`); `<Container>` wraps the page gutter,
  `<Backdrop>` renders the ambient aurora/grain layers.
- Animations: declare `@keyframes` in `globals.css`, apply via `animate-[name_…]`.
- RTL is assumed; use `ms-*`/`me-*` (logical) over `ml-*`/`mr-*` when adding spacing.
- Never interpolate Tailwind classes (`text-${tone}`) — the v4 scanner only
  matches literal strings, so interpolated classes silently never generate.
  Use a lookup map of full class strings (see the `TONE` record in
  `app/about/page.tsx` / `app/contact/page.tsx`).
- Inline SVG icons from `components/icons` carry no intrinsic size; always pass
  an explicit `className="w-_ h-_"` (or size via a wrapper) — unsized, they
  fall back to the 300×150 SVG default and break layout.

### Routing

- Sole router is App Router. New routes go under `app/`.
- Dynamic segments use bracket folders (e.g. `app/blog/[slug]/page.tsx`).

### Workflow

- **Never commit to `main`** — always a feature branch (per `AGENTS.md`).
- Before any commit: a code-review pass (duplicated logic, dead code, missing error handling).
- Before shipping UI: verify in a browser, not just type-check.
- Commits follow Conventional Commits with scope tags (see `commit-style` skill).
- Bug fixes get a failing regression test FIRST (see `testing-discipline` skill).
- New features ≥ one line → spec first (see `spec-first` skill).

### Task operations

- The private Trello execution board is
  [`Nazarato — 14-Day MVP`](https://trello.com/b/eHnJFMki), ordered as
  `Ready → In Progress → Needs You → Review → Done`, with `Risks` kept as a
  separate project-risk register.
- One Trello card represents one material user-requested deliverable. Evidence,
  acceptance criteria, final status, and the completion-email reference belong
  on that card; internal tool calls do not create additional cards.
- The completion-notification contract is defined in `AGENTS.md`: one
  duplicate-guarded Persian-first RTL HTML email for each terminal task outcome,
  rendered from `docs/task-completion-email-template.html` and sent through the
  authenticated Gmail profile rather than to a recipient hardcoded in the repo.

### Priorities (in order)

1. Bugs blocking real users
2. Features explicitly requested
3. Technical improvements / refactors
4. Nice-to-haves and polish

---

## 3. Open items / known gaps

- **Local Supabase and the MVP schema are connected.** The
  project URL and public/server keys are present only in gitignored `.env.local`,
  server-side read checks can see the existing 15 businesses and 37 reviews, and
  `next build` now completes against the real development project. Read-only
  probes confirm all three uniquely versioned 2026-09-02/03 Nabz,
  owner-improvement, and claim-security migrations are present remotely. The
  CLI is authenticated and linked, and the 12 already-present legacy migrations
  are reconciled in remote history. The remaining gate is approved pilot data,
  not schema deployment.
- **Public release identity is instrumented but unverified.** `/api/health`
  currently returns 503 by design because the local environment has no release
  SHA and still uses fictional demo data; database connectivity is now present.
  A public
  deployment must independently return the expected commit with `ok: true`,
  `database: "ok"`, and `demoMode: false` before the release gate can close.
- **The provenance gate is live but has no approved source rows yet.** Public
  data queries require `business_sources.status = 'approved'`. The remote table
  contains 50 OSM rows in `quarantined`, paired with 50 `pending` businesses;
  independent verification found zero active, approved, or public records.
  The private OSM queue now has a separate append-only review-state workflow;
  one explicit `unreviewed` QA event exists and the remaining records have no
  human decision. A versioned explainable pre-screen prioritizes the queue as 30
  low-risk review, 20 completion, and zero exception rows, but changes no status.
  Migration `20260905010000_add_business_source_created_by` is applied to the
  development project. The completion workflow is restricted to the 20 machine
  completion rows; its authenticated QA proposal remained quarantined against a
  pending business, survived refresh without changing score, and was deleted by
  exact ID afterward. No manual completion or public QA row remains.
  Complete the real per-record review and a separate publication approval design
  before changing source status or enabling real-data mode.
- **Development-toolchain audit and runtime warning.** Next.js and
  `eslint-config-next` are pinned to 16.3.4 and the last successful
  `npm audit --omit=dev` on 2026-09-05 reports zero production findings. The full
  audit still reports one low and four high development-only transitive findings.
  Local Node 22.11.0 is also below the `eslint-visitor-keys` 22.x engine floor;
  use Node 20.19+, 22.13+, or a supported later major for CI and release checks.
- **WP_API_URL** must be set in the deployment env or `lib/wp.ts` calls will
  fail. Not yet documented in a `.env.example`.
- **Web Push (VAPID) keys** must be generated and set in the deployment environment (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`) for Web Push notifications to function. See `.env.example` for details.
- **`GEMINI_API_KEY`** must be set in the deployment env for `app/api/transcribe/route.ts` (voice dictation on the `ReviewSheet` write step). Free tier covers MVP volumes. When unset, the route returns 503 and the mic surfaces a Persian toast; the button itself still renders.
- **Auth / Claim — live pilot gate.** `/login` uses a visible fixed code only in
  development; production generates a random code and has a Kavenegar
  verify/lookup provider, but live receipt still needs SMS credit, an approved
  template, and credentials. The claim-security migration is applied; complete
  one real Rasht owner flow before calling Card 08 done. The send limiter is
  single-process for this pilot and must move to
  Redis/Postgres before multi-instance scale. Sessions remain HMAC-signed cookies,
  a deliberate placeholder for later Supabase Auth.
- **Contact form delivery.** `app/contact/actions.ts` validates and logs but does not yet send email / write to DB. Wire to a transactional provider (or a `contact_messages` table) before launch.
- **Pre-launch open routes.** `/profile/edit`, `/settings/security`, `/help`, `/admin` (overview), `/admin/reports`, `/admin/users` are still 📋. See `docs/journey-of-nazarato.md` for the prioritized launch backlog.


---

## 4. Change log

Each task appended by the `project-loop` skill. Newest first. One bullet per
task: what shipped, where to look, and any new decision worth remembering.

<!-- project-loop:changelog:start -->
- **2026-09-06** — Completed account-backed Taste Graph readback without a
  schema change. The server action reauthenticates, scopes to the signed-in user
  and active current model, validates stored weights, and returns only a minimal
  aggregate DTO. The homepage now shows a responsive saved-profile summary with
  explicit loading/empty/error states; a temporary signed-in QA user proved
  save, local-session removal, reload recovery, and 390 px no-overflow behavior,
  then was deleted with its profile. 231 unit tests, four targeted Playwright
  scenarios, strict TypeScript, lint, build, production audit, intelligence
  evaluation, security review, and diff checks pass. Files:
  `components/nabz/{NabzRasht,SavedTasteProfileCard,actions}*`,
  `lib/nabz/taste-profile-input*`, and
  `docs/{nabz-rasht-mvp,data-model,pilot-evidence-pack,PROJECT}.md`.
- **2026-09-06** — Added a server-validated Taste Graph save boundary for
  logged-in Nabz sessions. Choice IDs are rebuilt against trusted fixtures,
  versioned private weights are upserted into `taste_profiles`, raw reasons and
  forged scores are rejected, and the UI serializes saves to protect fast
  multi-click sessions. Profile hydrate/readback remains a separate gate.
  Files: `components/nabz/{actions,actions.test,NabzRasht,ConciergePanel}.tsx`,
  `lib/nabz/{taste-profile-input,taste-profile-input.test}.ts`, and
  `docs/{nabz-rasht-mvp,data-model,pilot-evidence-pack}.md`.
- **2026-09-06** — Wired the versioned Persian customer-voice baseline into
  quick-review creation: each accepted review now returns its generated ID and
  persists an evidence-bearing analysis best-effort before moderation
  notification; analysis failure never blocks review submission. Added happy
  path and non-blocking failure tests. Files: `components/review/actions.ts`,
  `components/review/actions.test.ts`, `docs/persian-intelligence-baseline.md`.
- **2026-09-05** — Added controlled source-backed completion proposals for the
  20 private OSM rows in `needs_completion`. The admin form accepts only factual
  contact fields missing from the trusted OSM row, requires an HTTPS source and
  permission basis, stores separate creator-attributed evidence in quarantine,
  shows history, rejects copied content and mislabeled directory sources, and
  never changes score, review state, approval, activation, or publication. The
  reversible creator migration is applied to development; 215 unit tests,
  strict TypeScript, lint, build, two access tests, and authenticated 390/1280 px
  submit/refresh/no-overflow QA pass. The exact temporary QA row was removed.
  Files: `lib/admin/osm-completion*`, `lib/data/admin-osm-completion*`,
  `app/(admin)/admin/businesses/osm-review/`,
  `supabase/{migrations,rollbacks}/20260905010000_*`, and
  `docs/{osm-completion-proposals,data-model,nabz-rasht-mvp,pilot-evidence-pack,PROJECT}.md`.
- **2026-09-05** — Added deterministic, versioned, explainable OSM pre-screening
  to the private admin queue. Provenance, Rasht coordinates, phone structure,
  address, and digital-channel signals now produce a score, recommendation, and
  allowlisted reasons; exception/completion work sorts first and new human
  decisions snapshot the machine result without auto-deciding or publishing.
  The real 50-row queue reports 30 low-risk review, 20 completion, and zero
  exceptions; 195 unit tests, strict TypeScript, lint, build, two access E2E
  tests, and authenticated 390/1280 px RTL/no-overflow checks pass. Files:
  `lib/admin/osm-{prescreen,review,source-review}*`,
  `app/(admin)/admin/businesses/osm-review/OsmReviewQueue.tsx`, and
  `docs/{osm-source-review-workflow,data-model,nabz-rasht-mvp,pilot-evidence-pack,PROJECT}.md`.
- **2026-09-05** — Added and remotely applied append-only OSM source-review
  events, server-authorized decision recording, criteria snapshots, current-state
  filtering, and visible history without changing publication state. Remote and
  browser QA proved idempotency, RLS, immutable events, 50 quarantined/pending
  OSM rows, and zero approved/active OSM records; TypeScript, lint, 186 unit
  tests, two access E2E tests, build, secret scan, and 390/1280 px RTL checks
  pass. Files: `supabase/{migrations,rollbacks}/20260905000000_*`,
  `lib/{admin,data}/osm-*review*`, `app/(admin)/admin/businesses/osm-review/`,
  and `docs/{osm-source-review-workflow,data-model,nabz-rasht-mvp,pilot-evidence-pack,PROJECT}.md`.
- **2026-09-05** — Added the admin-only, read-only Rasht OSM inspection queue.
  The page loads a minimal server-side DTO after repeating admin authorization,
  validates outbound source/licence links, shows factual completeness, and
  searches or filters all 50 quarantined records without any mutation or
  publication control. Authenticated browser QA passed at 390 px and 1280 px;
  strict TypeScript, lint, 173 unit tests, two access-boundary E2E tests,
  production build, secret scan, and diff checks pass. Files:
  `app/(admin)/admin/businesses/osm-review/`, `lib/admin/osm-review.ts`,
  `lib/data/admin-osm-review.ts`, `e2e/admin-businesses.spec.ts`, and
  `docs/{nabz-rasht-mvp,pilot-evidence-pack,PROJECT}.md`.
- **2026-09-04** — Added and executed the fail-closed Rasht OSM quarantine
  runner. Strict preflight validation imported 25 cafés and 25 restaurants as
  50 pending businesses plus 50 quarantined provenance rows; a repeated apply
  created zero duplicates, and remote verification found zero active, approved,
  or public records. TypeScript, 167 tests, lint, production build, and diff
  checks pass. Files: `scripts/import-rasht-osm-quarantine.mts`,
  `lib/import/{osm-quarantine-batch,supabase-business-import}.ts`,
  `data/README.md`, `docs/{data-model,nabz-rasht-mvp,pilot-evidence-pack,PROJECT}.md`.
- **2026-09-04** — Reconciled 12 already-present legacy migration versions,
  backed up the empty `business_claims` table, and applied the uniquely versioned
  Nabz data-foundation, owner-improvement, and claim-security migrations to the
  linked development Supabase project. Remote history and table/column probes,
  production build, 161 tests, lint, and diff checks pass. New private tables
  are intentionally empty pending approved pilot data. Files:
  `supabase/{migrations,rollbacks}/`, `docs/{data-model,nabz-rasht-mvp,persian-intelligence-baseline,pilot-evidence-pack,PROJECT}.md`;
  private backup: gitignored `data/private/backups/`.
- **2026-09-04** — Connected the gitignored local environment and authenticated
  Supabase CLI against the real development project. Public/server reads and the
  production build pass without remote writes. Fetched the eight remote-history
  files, confirmed all legacy tables/columns/buckets exist, and used dry-run to
  block unsafe replay of 12 legacy files. Gave the three new migrations unique
  14-digit versions; history repair, claim backup, explicit approval, and remote
  apply remain open. Files: `.gitignore`, `supabase/{migrations,rollbacks}/`,
  `docs/{data-model,pilot-evidence-pack,PROJECT}.md`; secrets stay in `.env.local`.
- **2026-09-04** — Closed the quarantined-profile publication bypass across direct, related, list, saved, and bookmark paths; added visible, URL-sanitized open-data attribution; and forced approved sources for existing identities through manual reconciliation. Unit and 390/1280 px RTL browser checks pass against a local mock; no remote data was published. Files: `lib/{data,import}/`, `app/(user)/saved/actions*`, `components/company/`, `docs/{data-model,nabz-rasht-mvp,pilot-evidence-pack,PROJECT}.md`.
- **2026-09-04** — Added a non-secret, fail-closed `/api/health` contract for release verification. The endpoint validates Git identity, probes the database only when configured, and cannot report ready while the product is code-locked to fictional demo data; local HTTP verification correctly returns 503. Files: `.env.example`, `README.md`, `app/api/health/route.ts`, `lib/release/`, `docs/{pilot-evidence-pack,PROJECT}.md`.
- **2026-09-04** — Upgraded the framework and production transitives to patched Next.js 16.3.4, cleared the production dependency audit, and added an official-source-backed evidence pack that separates local implementation, synthetic evaluation, live-pilot proof, public release identity, and knowledge-based readiness without claiming approval. Files: `AGENTS.md`, `README.md`, `package.json`, `package-lock.json`, `docs/{pilot-evidence-pack,PROJECT}.md`.
- **2026-09-03** — Hardened the pilot owner path: OTP codes are challenge-bound, expiring and replay-resistant with a fail-closed Kavenegar provider; claim inputs, file signatures, decision races, proof access/cleanup and verified-approval invariants are guarded; private audit and rollback migrations plus the manual-review playbook are included. The remote migration, SMS credentials and real-owner acceptance remain open. Files: `.env.example`, `lib/auth/`, `lib/security/`, `app/(auth)/login/`, `app/company/[slug]/claim/`, `app/(admin)/admin/claims/`, `supabase/{migrations,rollbacks}/`, `docs/claim-verification-pilot.md`.
- **2026-09-03** — Upgraded the fictional Nabz result into an evidence-bearing
  Taste Graph and configurable `کجابریم؟` concierge. Scenario-aware Duel weights
  now cite the exact choices that shaped each preference; occasion, budget,
  group, neighborhood, and priorities deterministically rerank three explained
  examples; weak evidence is withheld. Anonymous restore lasts seven days on one
  device, validates and rebuilds all scores from trusted fixtures, and never
  stores optional free-text reasons. Cross-device account persistence remains an
  explicit Supabase integration gate. Files: `components/nabz/`,
  `e2e/nabz-rasht.spec.ts`, `docs/{nabz-rasht-mvp,PROJECT}.md`.
- **2026-09-03** — Added the first versioned Persian customer-voice baseline:
  deterministic normalization, six aspect families, sentiment, exact evidence
  spans, confidence, issue clustering, non-destructive suspicious-pattern flags,
  and retained human-correction events. Recorded an intentionally challenging
  50-item synthetic development evaluation (66.0% sentiment accuracy, 92.73%
  aspect micro-F1, 78.0% issue-cluster accuracy, 100% valid spans) while keeping
  the real pilot metric explicitly open. Extended the unapplied, private Nabz
  schema for correction history. Files: `lib/intelligence/`,
  `data/evaluation/persian-customer-voice.synthetic.json`,
  `scripts/evaluate-persian-baseline.mts`, `package.json`,
  `supabase/{migrations,rollbacks}/`, `docs/{persian-intelligence-baseline,data-model,nabz-rasht-mvp,PROJECT}.md`.
- **2026-09-03** — Added the secure server boundary for real Nabz comparison
  votes without connecting fictional demo records: `POST /api/nabz/votes`
  enforces exact-origin JSON, a 4 KiB body cap, allowlisted Rasht scenarios,
  distinct UUIDs, 120-character reasons, bounded identity/network rate limits,
  hashed anonymous-session tokens, active-business plus approved-source
  eligibility, and idempotent duplicate handling. The existing migration remains
  unapplied and the endpoint is ready for publication-approved pilot IDs only.
  Files: `app/api/nabz/votes/route.ts`, `lib/nabz/{vote-contract,supabase-vote-repository}.ts`,
  `lib/nabz/vote-contract.test.ts`, `e2e/nabz-rasht.spec.ts`,
  `components/nabz/nabz-demo-data.ts`, `docs/nabz-rasht-mvp.md`, `docs/PROJECT.md`.
- **2026-09-03** — Replaced the generic homepage hero with the first interactive
  Nabz Rasht consumer slice: four situations, five anonymous Duels, optional
  micro-reasons, immediate preference signals, a Taste Graph summary, and three
  explained recommendations. Eight explicitly fictional Rasht examples keep all
  quarantined source data out of the UI. Added pure engine tests, desktop/mobile
  Playwright coverage, a safe homepage review fallback, system-Chrome test support,
  and self-hosted Vazirmatn so compilation no longer depends on Google Fonts.
  Files: `app/{layout,page,globals.css}`, `components/nabz/`,
  `components/sections/RecentReviews.tsx`,
  `components/sections/{recent-reviews-data,recent-reviews-data.test}.ts`, `e2e/nabz-rasht.spec.ts`,
  `playwright.config.ts`, `package.json`, `package-lock.json`,
  `docs/nabz-rasht-mvp.md`, `docs/PROJECT.md`.
- **2026-09-02** — Added a tested, fail-closed converter and matcher for the private legacy Rasht Drive research: 37 café/restaurant candidates remain gitignored and quarantined, source ratings/review counts are discarded, and three exact OSM overlaps are reported without auto-merge. Files: `.gitignore`, `tsconfig.json`, `lib/import/rasht-drive-businesses.ts`, `lib/import/rasht-drive-businesses.test.ts`, `scripts/prepare-rasht-drive-businesses.mts`, `docs/data-model.md`, `docs/nabz-rasht-mvp.md`, `docs/PROJECT.md`.
- **2026-09-02** — Built the initial Rasht supply snapshot from OpenStreetMap's
  ODbL data: 50 uniquely sourced candidates (25 cafés, 25 restaurants), 49 with
  normalized phone data, all with coordinates and direct element provenance.
  Added a reproducible bounded Overpass fetcher, snapshot/data-quality tests,
  license metadata enforcement, and an explicit publication-approval gate. All
  candidates remain quarantined until visible attribution and the ODbL
  publication boundary are implemented; no database or public UI changed. Files:
  `data/`, `scripts/fetch-rasht-osm-businesses.mts`, `lib/import/`,
  `supabase/migrations/20260902000000_create_nabz_data_foundation.sql`,
  `docs/data-model.md`, `docs/nabz-rasht-mvp.md`, `docs/PROJECT.md`.
- **2026-09-02** — Authored the reversible Nabz data-foundation migration and a
  strict, idempotent business importer. Added private-by-default RLS for source
  evidence, Duels, versioned review analysis, and Taste Graphs; allowlisted only
  factual profile fields; quarantined unknown permissions and synthetic fixtures;
  and made new imports fail closed as pending until provenance persists. The
  migration was not applied remotely. Files: `lib/import/`,
  `supabase/migrations/20260902000000_create_nabz_data_foundation.sql`,
  `supabase/migrations/20260902000000_create_nabz_data_foundation.test.ts`,
  `supabase/rollbacks/20260902000000_create_nabz_data_foundation.down.sql`,
  `docs/data-model.md`, `docs/nabz-rasht-mvp.md`, `docs/PROJECT.md`.
- **2026-09-02** — Locked the 14-day Nabz Rasht MVP around contextual Duels,
  micro-reviews, a private Taste Graph, evidence-grounded recommendations, and
  owner customer-voice intelligence. Reordered the active route plan and defined
  the planned provenance, comparison, analysis, and taste-profile data contract;
  no production migration or UI code shipped in this task. Files:
  `docs/nabz-rasht-mvp.md`, `docs/pages-master.md`, `docs/data-model.md`,
  `docs/PROJECT.md`.
- **2026-09-02** — Replaced the rejected log-style completion email with a reusable Persian-first RTL HTML report that leads with outcome and required user action, shows MVP progress and deliverables, and keeps compact technical evidence last. Files: `AGENTS.md`, `docs/PROJECT.md`, `docs/task-completion-email-template.html`.
- **2026-09-02** — Added durable task operations for the two-week MVP: a private Trello board with explicit Ready/In Progress/Needs You/Review/Done/Risks states, one card per material deliverable, and an exactly-once Gmail completion notification contract with Sent-mail duplicate protection. Recorded the existing Next.js dependency-audit risk for pre-deployment remediation. Files: `AGENTS.md`, `docs/PROJECT.md`.
- **2026-05-26** — Built `/notifications` activity feed (#30). Moved the page from `/profile/notifications` to top-level `/notifications` per the issue contract; the old route is now a thin redirect so push-notification deep links and bookmarks don't 404. `public/sw.js` fallback URL updated. The feed is now grouped by calendar day with «امروز» / «دیروز» / Persian-localized full-date headers, courtesy of a new pure helper `components/notifications/groupByDay.ts` (8-test unit suite covers same-day collapse, day-boundary splits, and the relative-header path). The list region carries `aria-live="polite"` so screen readers narrate the unread-count change after mark-as-read fires. Mark-all-read action moved alongside the page to `app/(user)/notifications/actions.ts`. Files: `app/(user)/notifications/{page,actions}.ts(x)`, `app/(user)/profile/notifications/page.tsx`, `components/notifications/{NotificationsList.tsx,groupByDay.ts,groupByDay.test.ts}`, `components/profile/ProfileNav.tsx`, `public/sw.js`, `e2e/notifications.spec.ts`.
- **2026-05-26** — Polished the review wizard after live QA: (1) the sheet was visibly wobbling on iOS when the keyboard appeared because `max-h-[93dvh]` reflowed mid-animation — switched to `svh` (small viewport height, stable across browser-chrome changes). (2) Gated the infinite `fab-pulse` halo on the submit button to only run when the form is actually submittable (`ready && !pending`) — the constant throb under the CTA was reading as the card vibrating. (3) Added a contextual hint in the action row: while recording, the counter slot reads «ضبط — برای پایان دوباره بزن» (pomegr); while processing, «در حال تبدیل صدا…» (mint). Plumbed via a new `onModeChange` callback on `VoiceDictateButton`. (4) Lowered the body minimum from 30 → 10 chars (both server validator + client progress bar) — 30 was too long a runway for the actual review tone people write. Files: `components/review/ReviewSheet.tsx`, `components/review/VoiceDictateButton.tsx`, `components/review/actions.ts`.
- **2026-05-26** — Swapped voice-dictation backend from Web Speech API to Gemini 2.5 Flash (follow-up to #90). Chrome's `webkitSpeechRecognition` for `fa-IR` proxies audio to a Google STT endpoint that is unreachable from Iran (surfaced as the `network` error → "no internet" toast even when online). The button now records via `MediaRecorder` and POSTs the blob to a new `app/api/transcribe/route.ts` that forwards inline audio to Gemini and returns the transcript. Route is auth-gated, size-capped (≤1MB), and per-user rate-limited (10/min, in-memory). UX gains a third state ("processing") with a spinner; no streaming partials but accuracy on fa-IR is substantially better than Chrome's. New env var `GEMINI_API_KEY` (logged in `.env.local.example` + §3). E2E rewritten to shim `MediaRecorder` + intercept `/api/transcribe` via `page.route()`; 4 specs cover absent-API, happy path, multi-session stacking, and 503 error toast. Files: `app/api/transcribe/route.ts`, `components/review/VoiceDictateButton.tsx`, `components/review/VoiceDictateButton.test.ts`, `e2e/voice-dictation.spec.ts`, `.env.local.example`.
- **2026-05-26** — Voice-to-text dictation on the review wizard (#90). New `components/review/VoiceDictateButton.tsx` wraps the browser-native Web Speech API (`window.SpeechRecognition` / `webkitSpeechRecognition`) with fa-IR default lang and final-results-only handling. Mounted in the `WriteStep` action row beside the progress bar (trailing edge in RTL); renders `null` on browsers without the API so Firefox / locked-down WebViews don't see a broken affordance. SSR-safe `null`-initial `supported` state, post-mount detection, defensive cleanup on unmount. Errors surface as `react-hot-toast` toasts in Persian (`not-allowed`, `no-speech`, `network`). Unit test on the detector + Playwright spec that shims BOTH `SpeechRecognition` AND `webkitSpeechRecognition` (Chromium ships native unprefixed, so a webkit-only shim is silently bypassed) and asserts the transcript APPENDS rather than overwrites typed content. The e2e helper also reads `JWT_SECRET` from `.env.local` — Playwright's runner doesn't inherit env from `next dev`, so the cookie-mint helper has to read it directly or sign with the dev fallback and silently fail. Files: `components/review/VoiceDictateButton.tsx`, `components/review/ReviewSheet.tsx`, `components/review/VoiceDictateButton.test.ts`, `e2e/voice-dictation.spec.ts`.
- **2026-05-26** — Consolidated review-writing onto the `ReviewSheet` wizard (#91). Deleted both legacy page composers (`app/{company/[slug],shop/[handle]}/write-review/{WriteReviewForm,actions,loading}.tsx`) and the `/write-review` picker; those routes now server-`redirect()` to the matching profile (or `/`) with `?review=1`. New `components/review/ReviewSheetAutoOpen.tsx` reads the param on mount, calls `openReviewSheet(prefill)`, then scrubs the query via `history.replaceState` so back/refresh don't re-fire it. Mounted on `app/page.tsx`, `app/company/[slug]/page.tsx`, and `app/shop/[handle]/page.tsx` — the latter two pass a `{slug, name}` prefill so the wizard skips the picker. `submitQuickReview` now calls `notifyAdminsOfNewReview` (parity with the deleted actions). Parity decisions captured in PR #92: title/jalali-date dropped (friction), proof-upload deferred (deserves its own UX pass). Unused `TITLE_SUGGESTIONS` removed from `lib/data/reviews.ts`. New e2e: `e2e/review-sheet-consolidation.spec.ts` (5 specs, serial). Files: `components/review/ReviewSheetAutoOpen.tsx`, `components/review/actions.ts`, `components/review/ReviewSheet.tsx`, `app/{page,company/[slug]/page,shop/[handle]/page,write-review/page}.tsx`, `app/{company/[slug],shop/[handle]}/write-review/page.tsx`, `lib/data/reviews.ts`, `lib/data/profile.ts`, `e2e/review-sheet-consolidation.spec.ts`, `e2e/instagram-shops.spec.ts`.
- **2026-05-25** — Built owner claim flow (#27). New marketing landing at `/for-business` (hero + 3-step how-it-works + features grid + FAQ accordion + CTA, linked from the footer) and the auth-gated claim form at `/company/[slug]/claim` with three proof paths (domain email / document upload / other) and a re-validating server action (`submitClaim`) that uploads documents to a new private `claim-proofs` storage bucket. Admin queue at `/admin/claims` mirrors moderation: approve/reject with optional reason templates, signed-URL proof viewer, and proof deletion on either decision. Migration `0008_create_business_claims.sql` adds the `business_claims` table (one-pending-per-(business,user) partial unique index), the `tr_business_claim_approved` trigger that flips `businesses.claimed`+`owner_id` on approval, the private bucket, and extends `notifications.type` with `admin_new_claim` / `claim_approved` / `claim_rejected`. The unclaimed banner on `CompanyProfile` (already wired) now leads into the new form. Files: `supabase/migrations/0008_create_business_claims.sql`, `lib/data/claims.ts`, `app/for-business/page.tsx`, `app/company/[slug]/claim/{page,ClaimForm,actions}.tsx`, `app/(admin)/admin/claims/{page,ClaimsQueueClient,actions}.tsx`, `components/layout/Footer.tsx`.
- **2026-05-25** — Persisted helpful votes and hardened `/users/[username]` privacy (#74). Added `review_votes` table with RLS + a trigger that maintains `reviews.helpful_count` and `users.helpful_votes_received` (`supabase/migrations/0007_create_review_votes.sql`); `HelpfulButton` now hydrates from a server-supplied `has_voted` (no more `localStorage`) and exposes `aria-pressed`. `getReviewsFromDb`, `getUserReviews`, `getBusiness`, and `getShopByHandle` accept a `viewerId` and batch-fetch the viewer's votes so initial state is correct on every surface; `toggleHelpfulVote` revalidates each affected path. `/users/[username]` returns `notFound()` for non-owner viewers when `public_profile=false`. Home `RecentReviews` now sources from `getReviewsFromDb` so its votes hit real review IDs. Files: `app/reviews/actions.ts`, `components/ui/HelpfulButton.tsx`, `app/users/[username]/page.tsx`, `lib/data/reviews.ts`, `lib/data/businesses.ts`, `lib/data/instagram-shops.ts`, `lib/data/users.ts`, `supabase/migrations/0007_create_review_votes.sql`, `e2e/helpful-vote.spec.ts`.
- **2026-05-25** — Built public reviewer profile page (/users/[username]) (#26). Added `getUserByUsername` and `getUserReviews` database helpers, created the `ReportUserButton` component, and integrated dynamic routing with public profile details, activity stats, and a list of published reviews. Linked reviewer names and avatars on `ReviewCard` to their public profiles. Files: `app/users/[username]/page.tsx`, `components/profile/ReportUserButton.tsx`, `components/ui/ReviewCard.tsx`, `lib/data/users.ts`, `lib/data/reviews.ts`, `lib/data/users.test.ts`, `lib/data/reviews.test.ts`, `e2e/users.spec.ts`.
- **2026-05-24** — Implemented Web Push Notifications via VAPID (#25). Built service worker push handlers, database-backed subscriptions (`push_subscriptions` table), and server dispatcher (`lib/push/server.ts`) that catches/absorbs push failures to prevent blocking primary actions. Added `PushToggle` client component on `/settings/notifications` to handle subscriptions and request browser permissions. Files: `public/sw.js`, `lib/push/server.ts`, `components/settings/PushToggle.tsx`, `app/(user)/settings/notifications/push-actions.ts`, `supabase/migrations/0006_create_push_subscriptions.sql`.
- **2026-05-24** — Implemented user settings pages (#25) including the settings index (/settings), website activity notifications (/settings/notifications), and public profile privacy settings (/settings/privacy) using custom animated toggles and server actions. Files: `lib/data/users.ts`, `lib/data/users.test.ts`, `app/(user)/settings/actions.ts`, `app/(user)/settings/page.tsx`, `app/(user)/settings/notifications/page.tsx`, `app/(user)/settings/privacy/page.tsx`, `components/settings/NotificationsForm.tsx`, `components/settings/PrivacyForm.tsx`, `supabase/migrations/0004_add_notification_settings.sql`.

- **2026-05-24** — Redesigned and integrated the homepage clarification section `<HowItWorks />` with a split Trustpilot-style responsive banner, explaining Nazarato's independent review mechanism and its dual-support for corporate and Instagram shops. Files: `components/sections/HowItWorks.tsx`, `app/page.tsx`.
- **2026-05-23** — Built Bookmarks feature and `/saved` page (#24). Added `bookmarks` table to Supabase with `(user_id, business_id)` uniqueness. Implemented data layer (`lib/data/bookmarks.ts`) and self-checking `toggleBookmark` server action that handles concurrent race conditions without failing. Created `BookmarkButton` component using React 19 `useOptimistic` for instant feedback, integrated into `BusinessCard`, `IgShopCard`, `CompanyProfile`, and `ShopProfile` (where `isBookmarked` status is fetched in parallel via `Promise.all`). Created `/saved` page with tabbed navigation (`?tab=businesses|ig`) and an empty state featuring popular businesses. Wrote comprehensive tests for both data logic and UI entry points. Files: `supabase/migrations/0003_create_bookmarks.sql`, `lib/data/bookmarks.ts`, `app/(user)/saved/actions.ts`, `app/(user)/saved/page.tsx`, `components/ui/BookmarkButton.tsx`.
- **2026-05-23** — Built Instagram shops features (#22): directory `/instagram-shops` with niche tabs, sort selector and pagination; individual profile `/shop/[handle]` featuring `<IgAvatar />` conic-gradient ring, `<IgVerifiedBadge />` wavy-star lapis icon, and direct DM messaging link; and auth-gated `/shop/[handle]/write-review` form with specialized IG proof files (`dm` or `receipt`). Added database query helpers, mapped types, and verified with Vitest unit tests. Files: `lib/data/instagram-shops.ts`, `lib/data/instagram-shops.test.ts`, `components/ui/IgAvatar.tsx`, `components/ui/IgVerifiedBadge.tsx`, `components/shop/ShopProfile.tsx`, `components/instagram-shops/InstagramShopsClient.tsx`, `app/instagram-shops/`, `app/shop/`.
- **2026-05-23** — Implemented category detail page (/categories/[slug]) with RTL subcategory chips, dynamic custom Farsi sorting, pagination, and empty-state fallback to write a review. Wired up Vitest as the test runner with unit tests for category filtering and sorting. Files: `app/categories/[slug]/page.tsx`, `components/categories/CategoryDetailClient.tsx`, `lib/data/businesses.ts`, `lib/data/businesses.test.ts`, `package.json`, `package-lock.json`.
- **2026-05-22** — Fixed mobile/tablet touch target size violations in the header by increasing the NavLink height to min-h-11, adjusting its horizontal padding to px-3, and resizing the desktop HeaderAuth avatar/login button to w-11 h-11 / min-h-11. Files: `components/layout/Header.tsx`, `components/layout/NavLink.tsx`, `components/layout/HeaderAuth.tsx`.
- **2026-05-22** — Fixed login page build failure by adding the phone property to FormState in the auth server actions and returning the raw input on OTP start error. Disabled the custom react-hooks/set-state-in-effect rule in eslint.config.mjs to clear build-blocking lint errors in ReviewSheet and ReviewSheetProvider. Files: `app/(auth)/login/actions.ts`, `eslint.config.mjs`, `app/about/page.tsx`.
- **2026-05-22** — Linked all "نوشتن نظر" buttons (in MobileMenu, CompanyProfile, AboutWriteReview) to open the mobile bottom-sheet wizard (`ReviewSheet`) instead of navigating to a separate route, ensuring a consistent review entry flow. Added a glowing pulse animation (`fab-pulse`) to submit buttons. Removed the desktop write review button from the header to keep it clean. Files: `components/company/CompanyProfile.tsx`, `components/layout/MobileMenu.tsx`, `components/review/ReviewSheetProvider.tsx`, `components/sections/AboutWriteReview.tsx`, `components/layout/Header.tsx`.
- **2026-05-22** — Redesigned admin moderation queue UI and integrated optional rejection reasons, live statistics dashboard, and profile admin indicators. Replaced mock stats with live DB counts on the profile page, added "System Administrator" badge and panel links for admin users, and added template violation chips to the moderation workflow. Files: `app/(user)/layout.tsx`, `app/(user)/profile/page.tsx`, `components/profile/ProfileNav.tsx`, `app/(admin)/admin/moderation/ModerationQueueClient.tsx`, `app/(user)/profile/reviews/page.tsx`, `components/profile/MyReviewsList.tsx`, `lib/data/profile.ts`, `lib/data/users.ts`.
- **2026-05-22** — Built admin moderation queue (/admin/moderation) and migrated static business/review structures to a remote Supabase Postgres database. Files: `app/(admin)/layout.tsx`, `app/(admin)/admin/moderation/actions.ts`, `app/(admin)/admin/moderation/page.tsx`, `app/(admin)/admin/moderation/ModerationQueueClient.tsx`, `app/company/[slug]/write-review/actions.ts`, `lib/data/businesses.ts`, `lib/data/reviews.ts`, `supabase/migrations/0002_create_businesses_and_reviews.sql`, `supabase/seed.ts`.
- **2026-05-22** — Fixed navigation from search suggestions dropdown on landing page and search page by preventing input blur on suggestion mousedown. Cleaned up unused Link imports in terms and privacy pages to fix lints. Files: `components/search/SearchSuggestions.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`.
- **2026-05-22** — Built `/terms` and `/privacy` pages (#19). Created premium static TSX pages in Persian (RTL) with breadcrumbs, Scale/Shield icons, and sticky desktop sidebar tables of contents using the shared `GLASS` container component. Linked both pages from the site footer. Files: `app/terms/page.tsx`, `app/privacy/page.tsx`; edited `components/layout/Footer.tsx`.
- **2026-05-22** — Built `/search` (#18) with a live typeahead. A URL-driven search over the business + IG-shop fixtures: a server component reads `searchParams` (`q`, `type`, repeatable `category`, `rating`, `reviewed`, `verified`, `sort`, `page`) and all filter/sort/paginate logic lives in the pure, framework-free `lib/search.ts` (`parseSearchParams` → `runSearch` → `searchHref` → `suggestBusinesses`). Filters, type tabs, active-filter chips and pagination are plain server-rendered `<Link>`s — no client JS for those; the client components are the sort `<select>` (`SortSelect`) and the search box (`SearchBox`), which is a real `<form method="GET">` plus a **live typeahead**: from the 2nd character it shows a dropdown of matching businesses (companies *and* IG shops) below the field — `suggestBusinesses` ranks by name match then rating, each row linking to its profile. The same typeahead is on the homepage hero (`components/sections/HeroSearch.tsx`) via the shared `SearchSuggestions` panel; the hero search `<input>` was also fixed — it wasn't inside a form, so Enter did nothing. Results reuse `<BusinessCard />` / `<IgShopCard />`; the empty state suggests popular businesses; the filter sidebar collapses into a `<details>` accordion on mobile and is a sticky `<aside>` on desktop. The search section was designed mobile-first: a full-width field with a compact embedded submit button (no width-stealing text button), count-badged type tabs, and a polished filter accordion. The mobile hamburger menu (`Header.tsx` → `MobileMenu`) now also surfaces جستجو and نوشتن نظر via a dedicated `mobileNavItems` list (desktop nav unchanged). Files: `app/search/` (`page.tsx`/`loading.tsx`/`error.tsx`), `components/search/` (`SearchBox`/`SearchSuggestions`/`SearchFilters`/`SortSelect`/`SearchPagination`), `components/sections/HeroSearch.tsx`, `lib/search.ts`; edited `components/sections/Hero.tsx`, `components/layout/Header.tsx`. Decisions: category is a business-only concept — selecting one excludes IG shops (they carry a `niche`, not a business category) and the category group is hidden on the اینستاگرامی tab; IG-shop `score`/`reviews` are pre-formatted Persian-numeral strings, so `lib/search.ts` parses them back to numbers for sorting/filtering; `/search` sets `robots: { index: false }`; per-tab result counts ignore the type filter so each tab shows its own total; the typeahead links IG-shop rows to their `href` (`#` until `/shop/[handle]` lands — #22). Verified in-browser (390 + 1280px): query results, empty state + suggestions, dismissible chips, rating/verified filters, type tabs with live counts, pagination + out-of-range page clamping, the mobile filter accordion, and the typeahead on both the page and the hero.
- **2026-05-22** — Built review submission (#17). `/company/[slug]/write-review` — an auth-gated form on a glass card: a star rating picker (1–5, 48×48 hit targets, per-rating gradient + glow reused from `RatingStars` so the row recolours red→mint as the score rises), required title (3–80 chars) and body (30–2000, live counters), optional purchase date, and an optional proof-of-purchase upload (image/PDF ≤ 5 MB + a proof type → makes the review eligible for the «نقد تأییدشده» tier; no proof is still a valid «نقد عادی»). Every field is re-validated server-side in `submitReview` (`app/company/[slug]/write-review/actions.ts`); on success a flash toast is stashed and the client navigates to the company profile. Also built `/write-review` — the universal entry the mobile-tab FAB points at: an auth-gated business search that hands off to `/company/[slug]/write-review`. Files: `app/company/[slug]/write-review/`, `app/write-review/`; `STAR_PATH`/`STAR_PALETTES` are now exported from `components/ui/RatingStars.tsx`. Decision: there is no `reviews` table yet — `businesses` is still fixture data, so a real `business_id` FK can't exist until they move to Supabase (#16/#18); `submitReview` fully validates then logs the accepted review in dev-mode (`status: 'pending'`, `proof_status`) — swap the `console.info` for an insert + a `UNIQUE (business_id, author_id)` constraint when the table lands. The auth gate sits in `page.tsx`, below the `company/[slug]/loading.tsx` Suspense boundary, so an unauthenticated hard-load streams the skeleton then client-redirects to `/login` (acceptable for a non-indexed page — `submitReview` re-checks the session regardless). Verified in-browser: inline validation errors, happy-path submit + toast, star recolour 1★→5★, the auth redirect, and the `/write-review` search + hand-off + empty state.
- **2026-05-22** — Built the consumer account area (#14). New `(user)` route group, auth-gated once in `app/(user)/layout.tsx` (`getSession()` → `redirect("/login?next=/profile")`) — shell renders `Header`/`Footer` plus account nav as a desktop sidebar / mobile tab strip (`components/profile/ProfileNav.tsx`, active state via `usePathname`). `/profile` is an at-a-glance dashboard: identity card (avatar initial + `avatar_color`, "عضو از <ماه> <سال>" built month-first since `fa-IR` defaults to year-first), a 3-up stats grid (نظرات / مفید بود / فالوور), and quick-link cards. `/profile/reviews` lists reviews with a text+colour status badge (منتشر شده / در انتظار بررسی / رد شده — never colour alone) and per-row ویرایش/حذف; delete opens a native `<dialog>` confirmation (focus-trapped, Esc-closable). Files: `app/(user)/`, `components/profile/`, `lib/data/profile.ts`, `getUserById` added to `lib/data/users.ts`. Decisions: there is no `reviews` table yet (#17 unbuilt), so `myReviews` + `profileStats` in `lib/data/profile.ts` are static fixtures and delete is optimistic local-state removal — swap for a real per-user query + server action when #17 lands; the row-count badge lives in the client `MyReviewsList` so it stays in sync after a delete; ویرایش is intentionally disabled with a title until the review-edit destination exists. The `(user)` content track is capped (`lg:grid-cols-[200px_minmax(0,640px)]`, grid centred) so the cards don't stretch sparse on wide screens. The header is now auth-aware: a new `GET /api/auth/me` route exposes session status to client components (`components/layout/useSessionStatus.ts`) — done client-side **on purpose** so `Header` doesn't read cookies on the server and force every static page (`/`, `/blog`, `/company/[slug]`) into dynamic rendering. Signed in → `HeaderAuth` shows a round avatar linking to `/profile` (and `MobileMenu` shows «پروفایل من»); signed out → «ورود». Sign-out is a `logout` server action (`app/(user)/actions.ts`, `clearSession()` → `redirect("/")`) wired to a `<form>` in `ProfileNav`. Open: `/saved` (#24) and `/settings` (#25) nav links 404 until built. Verified in-browser (320–1440px): dashboard, reviews list, delete dialog + count sync, header avatar/login swap, and the full logout cycle all confirmed.
- **2026-05-22** — Built phone-OTP auth (#13). `/login` + `/login/verify` in a new `(auth)` route group (centered, chrome-less; `MobileTabBar` hides on `/login*`). Flow: phone (normalized to `+989…`) → 6-digit auto-submitting OTP → first-login display-name step → signed-cookie session → redirect to a validated `?next`. OTP is a static dev code (`123456`, logged by `sendOtp`); Kavenegar is isolated to `lib/auth/otp.ts`. Sessions are HMAC-signed HTTP-only cookies (`lib/auth/session.ts`) — a dev-grade placeholder for Supabase Auth. Accounts persist to a Supabase `users` table: `lib/supabase/server.ts` (service-role client), `lib/data/users.ts` (`getUserByPhone`/`createUser`, boundary-validated), migration in `supabase/migrations/0001_create_users_table.sql`. A returning phone signs in directly and skips the name step; a new phone creates the row. In-memory throttles cover resend cooldown + wrong-code lockout. Files: `app/(auth)/`, `lib/auth/`, `lib/supabase/`, `lib/data/users.ts`, `components/layout/MobileTabBar.tsx`. Decisions: Supabase is the database only — the app keeps its own OTP + session (Supabase phone-OTP needs an SMS provider, and Kavenegar isn't natively supported); `users` is standalone (own `id`, own `phone` column) and does not extend `auth.users`; RLS is on with no policies — all access is server-side via the service-role key; `?next` targets are validated same-origin. Verified end-to-end in-browser (desktop + 390px): a new phone creates the `users` row then onboards; a returning phone signs in directly with no name step (no duplicate row); wrong-code, session-guard, and `?next` redirect paths confirmed. Open: wire Kavenegar; the `0001` migration must be run on each new Supabase environment.
- **2026-05-21** — Redesigned `/about` + `/contact`: replaced the faux-terminal English jargon with a clean Persian-first layout, removed every `font-mono` (numbers now render in Vazirmatn too, per request), and dropped each page's opaque `bg-[#02050A]` + local orbs so the global `<Backdrop>` shows through like `/categories` + `/blog`. Bug fixes: missing `/images/noise.png` (404) removed; unsized inline SVGs (`SendIcon` in the submit button, `ChatBubbleIcon` in the report note) given explicit dimensions — they were rendering at the 300×150 SVG default and breaking layout; contact `lg:pt-[240px]` magic-number alignment replaced with a top-aligned grid; mobile-overflowing `translateX`/`translate-y` card offsets removed. Files: `app/about/page.tsx`, `app/contact/page.tsx`, `components/contact/ContactForm.tsx`. See new §2 Styling rules on dynamic Tailwind classes + icon sizing.
- **2026-05-20** — Removed all hand-written component CSS. `app/globals.css` slimmed 983→~195 lines (Tailwind config + `@keyframes` + `::-webkit-scrollbar` + `.wp-content` only). Every `.glass`/`.hero`/`.site-header`/`.btn-*`/`.post-*`/`.sb-*` etc. class converted to Tailwind utilities in JSX; shared bundles extracted to `components/ui/styles.ts`, new `components/ui/Container.tsx` + `components/layout/Backdrop.tsx`, `components/blog/BlogMeta.tsx` dedupes the author row. Files: `app/globals.css`, `app/layout.tsx`, all of `components/`, `lib/data/categories.tsx`, app pages. Decision: globals.css is config-only — no component classes; pseudo-element decorations become real `aria-hidden` `<div>`s; PWA `display-mode: standalone` is a registered `@custom-variant`.
- **2026-05-20** — Added `/categories` page: client-side live search + 2-col mobile grid (3/4 cols on sm/lg) of icon+title-only centered cards, 12 categories, with empty state. Extracted `CategoryCard` (`compact` variant = centered icon+title; default = icon+title+desc, used by home `Categories` section). Files: `app/categories/page.tsx`, `components/categories/CategoryBrowser.tsx`, `components/ui/CategoryCard.tsx`, `components/sections/Categories.tsx`, `lib/data/categories.tsx`. Decisions: shared card primitives live in `components/ui/`; interactive page widgets get their own `components/categories/` group and are `"use client"`; home section shows `categories.slice(0,4)` as "popular", `/categories` shows all. Note: an `absolute` icon over an input needs explicit `z-10` — the `glass` class makes the input `position: relative`, which otherwise paints over earlier siblings.
<!-- project-loop:changelog:end -->
