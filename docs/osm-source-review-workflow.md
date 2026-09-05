# Spec: OSM source review workflow

Status: **implemented and applied to development Supabase**
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

## Data changes

- `business_source_review_events`: additive, private, append-only events with
  `source_id`, `reviewer_id`, `decision`, bounded `note`, a factual
  `criteria_snapshot`, and `created_at`.
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
automatic decisions, owner access, and changing the business status.

## Done when

An authenticated admin can append and revisit review decisions for the 50 OSM
candidates while database verification still reports 50 quarantined sources,
50 pending businesses, and zero public records.

Verification on 2026-09-05 appended one explicit `unreviewed` QA event. A
repeated identical action was a no-op, the immutable trigger blocked an update,
the public client could read zero events, and the linked source/business remained
`quarantined`/`pending`.
