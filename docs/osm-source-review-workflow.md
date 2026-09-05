# Spec: OSM source review workflow

Status: **implemented; review storage applied to development Supabase**
Decision date: 2026-09-05

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
  columns are not written by this workflow. Publication remains a later,
  explicit operation.

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

Publishing or approving a source, editing imported factual fields, bulk review,
automatic decisions, learned/AI ranking, owner access, and changing the business
status.

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
