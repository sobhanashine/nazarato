# Nazarato: prompts for the implementation AI

Use Prompt A first. It asks the other AI to reconcile the evidence without changing the product. Prompt B is for a later, explicitly authorized implementation task. The reply format at the end lets the founders relay context between AIs manually.

## Prompt A — reconcile the product and explain the recovery plan

```text
Audit Nazarato's product alignment and propose a bounded recovery plan.

Allowed scope:
- https://github.com/sobhanashine/nazarato
- https://trello.com/b/eHnJFMki/nazarato-14-day-mvp
- Local checkouts of this exact repository, if available.
Do not inspect other projects, boards, accounts, conversations, Gmail, or linked
Google Docs. Links inside a card do not expand this authorization. Do not read
private exports or secrets. Do not message another AI or person; I will relay
context manually. Do not implement, merge, deploy, migrate, or publish data in
this reconciliation task.

Read the attached product-alignment-audit.md, trello-coverage.csv, and
evidence-summary.json. Treat the 6 October 2026 audit as a dated observation;
verify relevant current refs and code before concluding that anything is still
missing. If the files are not available, use the details below and state that
you did not inspect the full report.

Product contract:
Nazarato starts with Rasht cafés/restaurants and local discovery, then contextual
Duels/micro-reviews create first-party evidence. That evidence feeds a private
Taste Graph, explained “کجابریم؟” recommendations, and Persian customer-voice
insights that help an owner choose and measure one improvement.
Local discovery is the first slice, not a replacement of that product loop.

Primary decision records:
- Strategy: https://trello.com/c/yeXSvWke
- Locked roadmap: https://trello.com/c/qy0wEf4I
- Duels: https://trello.com/c/8HfC9Mtp
- Taste/concierge: https://trello.com/c/nMChR3oe
- Persian intelligence: https://trello.com/c/XycHMQQC
- Owner actions: https://trello.com/c/zCCz7ZOn
- Latest design scope: https://trello.com/c/cqeDNvLy
- Current delivery map: https://trello.com/c/j9EZSh93

Important later decisions:
- Owner introductions/outreach are deferred. Continue internal development
  without asking for introductions as a starting dependency:
  https://trello.com/c/c72f0wYV
- Manual area selection and one-click café discovery are intentional.
- Voice was intentionally removed. Do not restore it while recovering old code.
- Keep the existing Supabase for now; no new WordPress installation is needed.
- Public login stays closed until real per-challenge SMS is configured and
  verified. Never re-enable the development fixed code in production.
- Private Golsar data and synthetic interactions are not public customer data.
- Source eligibility, factual accuracy, and verified ownership are separate.
- Self-hosting is post-MVP. Wider categories, rewards, leaderboards, generic
  AI chat, and Instagram scam-lookup work do not automatically enter this MVP.

Dated findings to verify:
1. main was 86b70d41d2fb93c690a3d8d9d42aa9cd692b5b45.
   dev was db36aae0c8a484a1ad8d1c450939688897d74713; no content diff from main.
2. codex/review-intake-provenance at
   73500d5d7117c940d932655cecb5cb7d01f88de0 was 35 commits ahead and 12 behind main.
   It contains Nabz, intelligence, OTP/Claim hardening, source review/publication,
   owner action work, and provenance tests absent from main.
3. Main protects discovery and direct business profiles, but lacks full source
   eligibility checks in global/user review feeds, review submission, and
   bookmark paths. It still contains public mock-user/review fallbacks.
4. Main queries business_sources without shipping its defining migration.
   Publication tools and source/license attribution also need reconciliation.
5. Even the older branch's live Duel flow ends with a vote receipt. Its taste
   persistence and concierge use the demo place model. Real votes are not yet
   connected to the promised real recommendation payoff.
6. The older owner workflow creates an action/baseline/target. Follow-up result
   columns exist, but no application path writes the observed outcome.
7. The mobile redesign is local uncommitted work on codex/nazarato-mobile-redesign
   at /Users/sobhan/.codex/worktrees/nazarato-mobile-redesign/nazarato.
   Preserve it. Its discovery design does not include the missing Nabz modules.
8. Main's unchanged suite passed 127 tests; the older branch passed 278.
   Running the older five review-data tests on a disposable main snapshot
   produced two failures for missing business_sources!inner. TypeScript and
   lint on main passed. None of these proves the product journey is complete.

Required response:
1. State the active product promise in two sentences, citing the latest board
   decision. Explicitly identify any actual superseding decision you find.
2. Give a matrix: requirement | Trello evidence | main | other branch/WIP |
   genuinely missing work | blocker | acceptance proof.
3. Identify work to reuse, conflicting later changes to preserve, and migrations
   needing history reconciliation. Do not suggest a blind merge or rebuild.
4. Propose the next three small tasks in dependency order. Separate agent-owned
   work from genuinely external decisions/access. Do not request credentials
   or owner introductions merely to start independent development.
5. Distinguish implemented, tested, integrated, deployed, and pilot-validated.
   Explain differences from the audit with exact code/commit/card evidence.

Return a concrete recovery plan, not a new general product brainstorm.
```

## Prompt B — implement one explicitly selected recovery slice

```text
Implement only the recovery slice I name in this message. Use the attached
Nazarato audit and the accepted reconciliation plan as context. If I have not
named a slice, prepare the smallest concrete proposal before changing behavior.

Scope stays restricted to sobhanashine/nazarato and Trello board eHnJFMki.
This instruction authorizes local implementation and its tests, not production
deployment, external service access, database migration/publication, messaging,
or unrelated card changes. Preserve any broader authorization I explicitly
provide separately.

Before editing:
- Recheck GitHub refs, local status, and applicable repository instructions.
- Preserve both existing dirty worktrees. Use an appropriate isolated branch
  from current main for integration; never overwrite either ongoing checkout.
- Read the relevant installed Next.js documentation before framework changes.
- List the exact prior commits/modules to reuse and later decisions to retain.
- Record the selected task and acceptance criteria on the specified board.

Recovery constraints:
- Preserve current Cloudflare/OpenNext runtime fixes and the public auth lock.
- Preserve voice removal, manual location, truthful empty states, and private
  Golsar isolation. Never restore old fixtures as public content.
- Port provenance behavior with its negative tests: discovery, direct profiles,
  public/user review feeds, bookmarks, popular/saved reads, and write targets.
- Restore migration files through a reviewed history reconciliation. Do not
  replay renamed/applied migrations or access a remote DB without authorization.
- Restore approved-source attribution before public use of source-derived data.
- Keep demo, test, and real evidence distinct, including taste persistence.
- Do not confuse generic web-search chat with the contextual local concierge.
- Do not change paid providers, request new infrastructure, or invent rankings.

If the selected slice is the real consumer loop:
Prove scenario -> five accepted choices -> private, versioned taste summary ->
explained eligible recommendation (or explicit insufficient-evidence result).
Use real-shaped isolated IDs and provenance. Test duplicate/retry behavior,
insufficient supply, withdrawn eligibility, account restore and privacy.
Keep first interactions anonymous. Do not require SMS to test independent logic.

If the selected slice is the owner loop:
Prove review -> versioned analysis -> cited/confidence-bounded issue -> retained
human correction -> action/baseline/target -> observed follow-up result.
Keep individual taste data private. Distinguish measured change from a claim
that the action caused it; withhold conclusions with inadequate evidence.

If the selected slice is design integration:
Reuse the existing mobile redesign. Verify 320/360/390/430px and desktop, RTL,
44px controls, focus/keyboard, draft preservation, persistent receipt, area
continuity, and separate empty/no-match/service-error states. Do not present
unavailable features as working, or silently remove the future product loop.

Before completion:
- Perform code review and appropriate TypeScript/unit/lint checks.
- Verify changed UI in a browser using isolated data; do not run remote-write
  fixtures against the shared development database by default.
- Show the exact diff, tests, known gaps, branch/commit/PR status if applicable.
- Update the product decision record and the scoped Trello task truthfully.
- A build or merge is not deployment proof; a test demo is not pilot proof.

If an external gate is closed, finish the independent safe work and describe
the remaining dependency precisely. Do not stop all development for SMS or
owner introductions that the chosen slice does not need.
```

## Short reply to relay back for a second audit

```text
Nazarato reconciliation reply
Date:
Current main / integration branch / inspected worktrees:
Product decision retained or changed (with Trello link):
Audit findings confirmed:
Audit findings disputed (with exact evidence):
Code recovered and original commits:
Later behavior preserved:
Still missing:
Checks performed and environment:
Integrated / deployed / pilot-validated status:
Next three tasks:
Only genuinely required founder inputs:
```

The audit report and this prompt can be pasted or attached manually. No automatic communication with another AI has been configured or performed.
