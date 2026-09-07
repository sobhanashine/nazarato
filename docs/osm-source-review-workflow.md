# Spec: OSM source review workflow

Status: **implemented; review and publication storage applied to development
Supabase; no source published**
Decision dates: 2026-09-05 (review), 2026-09-07 (publication gate)

## Problem

The Nazarato admin can inspect 50 quarantined Rasht OSM candidates, but cannot
record whether a row needs correction, is ready for a later publication
decision, or should be rejected. Using `business_sources.status` for this work
would mix an internal quality decision with the publication boundary and would
erase the reasoning behind later changes.

## User action

1. An authenticated admin opens `/admin/businesses/osm-review` and expands one
   candidate.
2. The page shows the current review state, the factual acceptance checklist,
   and the previous decision history.
3. The admin chooses `نیازمند اصلاح`, `آماده بررسی انتشار`, `ردشده`, or returns
   the row to `بررسی‌نشده`.
4. A note is required for correction and rejection; the client and server both
   enforce the limit.
5. Submitting appends one review event and refreshes the row. The source remains
   quarantined and the business remains pending regardless of the chosen state.

## Explicit publication extension

A latest `ready_for_approval` decision only reveals the separate green
publication gate; it never publishes by itself. The gate is enabled only when
the current deterministic pre-screen is `low_risk_review` at 75 or higher and
the source still has an identity-matching OSM URL, exact ODbL metadata and
attribution, bounded Rasht coordinates, a valid Iranian phone, and an address or
digital channel. The admin must confirm identity, factual-only scope, and visible
attribution, then type the exact business slug.

The server requires all three confirmations and validates the slug before
opening the privileged database path. One security-definer RPC then locks only
that source and business, rechecks the admin plus every current invariant,
appends an immutable publication event, changes the source to `approved`, and
changes the business to `active` in one transaction. Failure rolls back all
three writes. Repeating an already audited approval is an explicit no-op.

Migration `20260907150000_create_osm_publication_approval.sql` and its rollback
are applied to the linked development project. Remote migration parity and
database lint pass. A deliberate call against an unreviewed row was rejected,
public audit-table access was denied, no audit event was created, and the source
and business remained `quarantined`/`pending`. All 50 OSM candidates remain
private until a human explicitly selects and approves a qualifying row.

## Explainable pre-screening

Before the human opens a row, `nazarato-osm-prescreen/0.1.0` computes a
deterministic recommendation from retained factual and provenance fields. The
machine output is calculated on read, does not need a new table, and cannot
change a human decision or publication status.

| Signal | Weight |
| --- | ---: |
| Valid OSM source, ODbL metadata, and attribution | 35 |
| Coordinates inside the bounded Rasht pilot area | 20 |
| Structurally valid normalized Iranian phone | 20 |
| Address | 15 |
| Website or Instagram | 10 |

The recommendation is one of `low_risk_review`, `needs_completion`, or
`high_risk_exception`. Low risk requires at least 75 points, a valid phone, and
either an address or digital channel. Invalid provenance, a source/profile
identity mismatch, missing or out-of-bounds coordinates, and a malformed phone
are hard exceptions. Every result includes allowlisted reason codes so the admin
can see why it was produced.

The reviewed 50-record snapshot currently produces 30 low-risk review rows, 20
completion rows, and zero high-risk exceptions. This is a queue-quality result,
not approval evidence. Exceptions and incomplete rows sort first. New human
review events retain the exact machine version, recommendation, score, and
reason codes that were visible at decision time; older events without this
field remain readable.

## Data changes

- `business_source_review_events`: additive, private, append-only events with
  `source_id`, `reviewer_id`, `decision`, bounded `note`, a factual
  `criteria_snapshot`, and `created_at`. New snapshots include the versioned
  pre-screen result inside the existing JSON field; no schema migration is
  required.
- Index `(source_id, created_at desc, id desc)` supports the current state and
  per-source history reads.
- RLS is enabled with no browser policy; all reads and writes go through an
  admin-authorized server data layer using parameterized Supabase queries.
- The existing `business_sources.status`, `reviewed_by`, and `reviewed_at`
  columns are not written by a review decision. They are written only by the
  separate atomic publication RPC after all publication checks pass.
- `business_source_publication_events`: additive, private, one immutable event
  per approved source, including the exact review event and source/provenance
  snapshot used for the decision.

## Failure modes

- **Invalid decision or note:** the server rejects the request and the row shows
  a concise Persian validation error; no event is written.
- **Stale or ineligible source:** only pending Rasht OSM rows with quarantined
  open-licence provenance are accepted; otherwise the server returns a generic
  unavailable message and does not mutate publication state.
- **Database or network failure:** the row keeps the entered note, shows a retry
  message, and does not optimistically change its current state.
- **Repeated submit:** the form disables while pending; the server also treats
  an immediately repeated identical latest decision and note as a no-op.

## Out of scope

Editing imported factual fields, merging completion proposals, bulk publication,
automatic decisions, learned/AI ranking, owner access, and publishing any row
without a fresh explicit admin action.

## Done when

An authenticated admin can append and revisit review decisions for the 50 OSM
candidates while database verification still reports 50 quarantined sources,
50 pending businesses, and zero public records. The queue must also expose the
versioned recommendation, score, and human-readable reasons without horizontal
overflow at 390 px or 1280 px.

Verification on 2026-09-05 appended one explicit `unreviewed` QA event. A
repeated identical action was a no-op, the immutable trigger blocked an update,
the public client could read zero events, and the linked source/business remained
`quarantined`/`pending`.

On 2026-09-08 the founder authorized only the limited OSM payload for
`رستوران گیله مرد اصیل` to enter internal review. The authenticated admin path
appended event `41d39a96-157a-455a-b7c2-2f4d5a31ab37` with decision
`ready_for_approval`, the current versioned pre-screen snapshot, and an explicit
note excluding street-address enrichment and third-party reviews, ratings,
images, or copied text. A post-write read confirmed that the source is still
`quarantined`, the business is still `pending`, and approved OSM source, active
Rasht business, and publication-event counts are all zero. This event is not a
publication authorization.
