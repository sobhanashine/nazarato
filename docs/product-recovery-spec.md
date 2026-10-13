# Product recovery — 6 October 2026

The founders requested implementation of audit F1–F8 after receiving the audit. This is the execution specification for that accepted scope, not a new strategy proposal.

**Problem.** People in Rasht need a local choice with an explanation. Owners need a cited customer issue, an improvement and an observation afterwards. The release branch contains only the discovery slice; tested logic and a mobile redesign remain on separate development lines.

**User action.**
1. Discover an approved café/restaurant through the existing remembered area selector.
2. Open `/nabz`, choose a situation and make five distinct comparisons without signing in. Insufficient supply stays an explicit empty state.
3. Receive a private preference summary from actual choices and versioned evidence. Recommendations cite published reviews; weak or unavailable evidence yields «داده کافی نداریم». Fixture results never enter this path.
4. Optionally save/restore the summary through an authenticated account. The production login restriction remains until real SMS is separately verified.
5. A verified owner reads cited issues, corrects an analysis, records an action and measures a non-overlapping follow-up window using the same analysis version. Sparse evidence produces no success claim.

**Data changes.** Recover `business_sources`, comparison votes, versioned analyses/corrections, private taste profiles, owner actions and publication events from the existing branch. Reconcile legacy migration filenames rather than replay duplicates. Public reads/writes share one status/source contract. New code uses existing tables where possible; follow-up fields already exist. No remote migration or public data approval is performed here.

**Failure modes.**
- Missing/revoked source, invalid ID or synthetic target: fail closed in reads and writes; no mock fallback.
- Fewer than four eligible businesses/five distinct pairs or insufficient current review evidence: clear empty/uncertain state, no automatic demo substitution.
- Vote/result/save/read error: preserve choices and text, provide a retry, never claim persistence.
- Owner evidence unavailable, model changed, date not reached or fewer than three usable follow-up reviews: refuse completion; preserve the active action.

**Integration constraints.** Start at `main@86b70d4`. Preserve Next 16.3.8/OpenNext 1.20.7, Worker configuration, profile runtime fixes, closed public auth, retired voice endpoint, repository blog and private local preview. Copy the existing mobile redesign into the isolated recovery checkout without altering its source checkout. Audit documents are historical evidence; do not rewrite their verdict.

**Out of scope.** Merge/deploy, remote DB application, publication approvals, SMS activation, owner outreach and other projects. These are operational gates, not reasons to postpone the internal implementation.

**Done when.** The recovered and completed journeys pass unit/type/lint/build and isolated browser tests, have a reviewable feature PR, updated requirement/delivery documents and a truthful completion email.
