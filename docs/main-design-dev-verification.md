# DEV in main's visual system — task 31

Tracking: https://trello.com/c/NiG1G2HJ
User decision: 2026-10-15. Main design is authoritative; new features belong
inside it. Shared main Supabase is explicitly allowed; management access will
be supplied later. No main promotion is authorized.

## Source and integration

Started `codex/main-design-dev` from `origin/main@86b70d4` in an isolated
worktree, then integrated `origin/dev@7a204d2` without rewriting history.
The original dirty checkout is untouched. Presentation was restored from main;
recovery APIs, data eligibility, schemas and protected workflows remain intact.

## Product coverage

| Existing Trello capability | Entry and implementation | Verified boundary |
|---|---|---|
| Local Rasht discovery | Main hero/search and glass café/restaurant category cards; remembered area and explicit area links | Real approved-source catalog only; restaurant search never falls back to cafés |
| Nabz contextual five-choice flow | Main header/mobile nav, new home section and `/nabz?scenario=…` | Five persisted distinct choices; no synthetic recommendations on weak evidence |
| Private taste and evidence | `/nabz` result, source citations, authenticated save/restore | Account isolation; no public taste exposure |
| First-party experience | Original profile layout plus recovered native review dialog | Explicit rating continue, focus containment, retained draft, pending receipt |
| Persian analysis and correction | `/business/insights` in main palette | Versioned analysis and append-only correction; citations open the original review tab |
| Owner action and follow-up | Owner entry on `/for-business`, protected insights controls | Ownership, one active action, fixed denominators and dated before/after observations |
| OSM provenance and publication | Admin source review and public profile attribution | Source review, completion and publication gates preserved; no source automatically approved |
| Profiles, bookmarks, contact and blog | Main layouts with recovered behavior | Private metadata protection, accessible tabs/share fallback, validated contact and functional share links |
| Staging release | Separate Worker, DEV source, dark banner and noindex | Main remains unchanged; configured explicit shared-main target |

Broader social/gamification/monetization roadmap items remain backlog. Restoring
main's design does not turn those ideas into implemented capabilities.

## Verification

- 378 unit tests (73 files) pass, including three new shared-main target cases.
- 19 browser tests pass, with no skips. Coverage includes main visual identity at 390/1280px, 320/360/390/430px
  route layout, touch search suggestions, preserved area/category, keyboard tabs,
  share fallback, draft retention, five choices, private save/restore, public
  attribution, moderation, analysis correction and owner follow-up.
- TypeScript and lint pass; OpenNext staging build and Wrangler dry-run pass.
- Actual built Worker inspected in the browser. No production DB writes were
  used for automated verification; the browser suite uses loopback-only records.
- Focused code/security review: explicit scenario allowlist and DB target,
  unchanged server authorization/source guards, no secret literals introduced.

## Access and data still pending

Exact-project REST reads work, but the management connection returns Forbidden.
The user asked to continue now and provide keys later. No remote SQL was run.
Schema inspection found no `save_real_taste_profile` RPC, no `reviews.origin_kind`,
and no `business_improvement_actions.metric_version`. Apply only the reconciled
missing migrations after access arrives, then configure this Worker's secrets
and rerun real read/auth/owner checks. Public SMS remains closed and approved
real supply/evidence must be checked before claiming a usable pilot.

A working staging UI and a passing isolated suite are **not** confirmation that
account save, first-party reviews and owner actions work against the live DB.
See `staging-release.md` for exact setup and `migration-reconciliation.md` for
schema gates. Provider deployment identity and actual live status are recorded
on task 31 after deployment.

## Handoff to the next AI

Use main@86b70d4's Persian Aurora as the visual reference. Preserve navy, mint,
lapis, glass cards, the header, hero and mobile navigation. Extend this UI for
new Trello features. Keep recovery behavior, privacy/provenance guards and
validated source links. Never restore the superseded light redesign or fake
usage counts. Ship through a feature branch into DEV and verify staging before
any separately authorized main promotion. The founder allowed the exact main
Supabase target for staging; keys/migrations remain pending, so inspect current
runtime/schema rather than assuming the database is ready.
