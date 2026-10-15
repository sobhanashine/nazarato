# Nazarato: active product and delivery status

Updated: 2026-10-15. Integration branch: `codex/main-design-dev`, targeting `dev`.
Tracking: [task 31](https://trello.com/c/NiG1G2HJ); prior [recovery task 29](https://trello.com/c/3pXvWcUi).

The founder selected **main's original dark/glass design** and authorized staging
to share this project's main Supabase database. The light redesign is superseded.
Read `main-design-dev-verification.md` for current delivery and database limits.

## Active product contract

Start with cafés and restaurants in Rasht. The connected journey is local
discovery → contextual choices and first-party experiences → a private taste
summary and recommendations with evidence → owner issues, correction, action
and a later observation. Listing count is not the product outcome.

The [September locked roadmap](https://trello.com/c/qy0wEf4I) and
[Rasht strategy](https://trello.com/c/yeXSvWke) replace the May Instagram
scam-lookup pivot as the active MVP direction. The
[mobile discovery slice](https://trello.com/c/cqeDNvLy) preserves that larger
direction. No decision on the inspected board cancelled private taste or owner
intelligence. Use [the locked product spec](nabz-rasht-mvp.md) for the roadmap
and [the recovery spec](product-recovery-spec.md) for this implementation.

Later decisions remain active: manual area choice, retired voice input, the
existing Supabase, optional WordPress, closed production login until real SMS
verification, and [deferred owner outreach](https://trello.com/c/c72f0wYV).
Owner introductions are not a prerequisite for independent development.

## Delivery vocabulary

- `planned`: agreed work without an implementation.
- `implemented`: code exists on a named branch.
- `tested`: named checks exercised that implementation.
- `integrated`: code and dependencies are reconciled on the delivery branch.
- `deployed`: the provider is verified serving the corresponding revision.
- `pilot-validated`: consenting users exercised the product on real eligible
  data and the observed outcome is recorded.

These stages can coexist. A Trello Done card may finish a technical task
without establishing deployment or product validation. Task 29 stays in Review
until its deliverable is accepted. Do not infer deployment from a passing build.

| Capability | Recovery delivery | Public/pilot gate |
|---|---|---|
| Discovery and approved-source profiles | Existing `main` behavior retained; shared read/write eligibility restored | Approved factual supply; no source approval is granted by this PR |
| Mobile RTL design | Main Persian Aurora restored; recovered mobile behavior retained | Review, merge and provider verification |
| Five contextual choices → result (`/nabz`) | Real UUIDs, server-stored votes, versioned signals and cited result implemented | Four eligible businesses; adequate current first-party evidence |
| Private account save/restore | Server-scoped real model, service-only transactional save implemented | Existing signed account; new public login remains closed |
| Persian customer voice | Deterministic versioned baseline and persistence recovered | Synthetic evaluation is not evidence of real-language/pilot accuracy |
| Owner issue → correction → action → observation | Recovered action/correction UI; measurement and denominator/version gates completed | Consenting owner session and sufficient real evidence |
| OSM review, approval and visible licence credit | Recovered admin workflow; company and shop attribution integrated | Explicit admin publication approval, independent of ownership |
| Review provenance | New `origin_kind` and first-party read/count gates implemented | Per-record reconciliation of existing reviews before their public inclusion |
| Community trends, broader social/gamification and monetization | Roadmap/backlog only | Separate product decisions; not activated by recovery |

The dated [recovery verification record](product-recovery-verification.md)
records the checks. Task 29 did not deploy or apply remote migrations. Task 30 deployed DEV staging;
task 31 restores main design. Remote migrations, real SMS delivery, publication
approval and owner pilot validation remain separate gates.

## Audit closure map

| Finding | Concrete correction | Review evidence |
|---|---|---|
| F1: core exists only on another branch | Recover Nabz, intelligence, owner and admin-source code from `73500d5`; preserve `main@86b70d4` runtime fixes | `lib/{nabz,intelligence,admin}`, owner/admin routes |
| F2: inconsistent public boundaries | Shared approved-source/status gates; first-party review origin; no synthesized public users; revalidate write targets | Data-layer regressions, direct profile/feed and stale-target tests |
| F3: schema cannot be rebuilt from main | Restore six September migrations; add four bounded recovery migrations and rollback files | Fresh local PostgreSQL verification; [reconciliation plan](migration-reconciliation.md) |
| F4: real choices stop before payoff | `/api/nabz/result` reconstructs only the caller's accepted votes; `/nabz` displays traceable current evidence | Real-result engine/API tests and isolated account restore journey |
| F5: owner observation has no writer | Authorized measurement/cancellation; stable denominator, windows and model/metric versions; sparse samples stay active | Follow-up unit/actions tests and isolated owner UI |
| F6: redesign remains uncommitted | Superseded by task 31: main dark/glass design with Nabz and recovered workflows | Mobile width/input checks and inspected screenshots |
| F7: conflicting status/specs | Dated supersession notes and this stage vocabulary | README, PROJECT, Pages Master, data model and agent instructions |
| F8: tests miss the connected journey | Default Playwright run uses a loopback-only substitute with dummy credentials; separate fresh SQL harness | Isolated browser happy/failure cases; legacy remote-write tests require explicit opt-in |

## Rules for the next AI

1. Read this file, the locked product spec and `docs/PROJECT.md` before work.
2. Stay within the Nazarato repository and the named Trello board. Do not browse
   other founder projects, boards or documents to fill context gaps.
3. Preserve private Golsar data, closed production OTP, voice 410, main-only SEO,
   the existing Cloudflare runtime and the lighter mobile design.
4. Keep demo model/fixture IDs out of real results. Five choices alone do not
   prove a learned preference or adequate recommendation evidence.
5. Run the isolated suite by default. Never publish synthetic content to make
   a test pass or run legacy write tests against the product database.
6. Before a remote apply, inspect actual migration history and catalog under a
   separately authorized release step. Follow the reconciliation plan; do not
   replay renamed legacy files or blanket-promote unknown review origins.
7. Report implemented, tested, integrated, deployed and pilot-validated stages
   separately. Record remaining activation work without calling the MVP shipped.

Older `[Pivot]` GitHub issues are historical ideas, not current requirements.
They were not automatically closed or retitled. Reclassify them with a deliberate
backlog decision rather than treating their existence as authority to revive
scam reports, subscriptions or a Telegram launch.
