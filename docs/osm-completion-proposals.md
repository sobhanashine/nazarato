# Spec: source-backed OSM completion proposals

Status: implemented, migrated to development, and browser verified on 2026-09-05

## Problem

The explainable OSM pre-screen identifies 20 of the 50 private Rasht candidates
as needing completion. Missing factual contact fields should be researchable,
but directory or marketplace data must not silently become Nazarato data. The
workflow therefore needs evidence capture, not an automatic enrichment or
publication path.

## Operator flow

1. An authenticated admin expands an incomplete row in
   `/admin/businesses/osm-review`.
2. The form renders only the OSM fields that are currently missing: phone,
   address, website, or Instagram.
3. The admin supplies at least one factual value, the exact HTTPS source URL,
   and one permission basis.
4. The server re-authorizes the admin, validates the payload, and re-reads the
   original eligible OSM row before writing.
5. A separate `business_sources` row is appended in `quarantined` status. The
   page displays it in proposal history after refresh.

## Permission states

| Input source | Stored permission | Meaning |
| --- | --- | --- |
| Business-controlled official page with public factual contact data | `public_factual_contact` | Usable only as review evidence; it is still quarantined |
| Google Maps, Neshan, Balad, Digikala, Basalam, Torob, Snapp, Bilbooard, or another directory/marketplace | `unknown` | Lead only; explicitly not usable until rights are resolved |

Known directories are rejected if an admin attempts to label them
`public_factual_contact`. The safe default in the UI is `unknown`.

## Storage contract

The evidence row uses:

- `source_type = 'manual_public_facts'`
- `status = 'quarantined'`
- `field_payload = { contact: { ...allowlisted factual fields } }`
- deterministic `payload_hash` for duplicate protection
- `created_by` for authenticated creator attribution
- `captured_at` and the exact source URL for traceability

`created_by` is a nullable foreign key because the 50 legacy/imported source
rows predate this operator workflow. Adding it requires the reversible migration
`20260905010000_add_business_source_created_by.sql`.

## Safety invariants

- The original OSM source row and `businesses` row are never updated.
- Completion evidence does not change factual completeness, machine score,
  human review state, source approval, business activation, or publication.
- A field already present in the trusted OSM snapshot cannot be proposed again.
- Reviews, ratings, images, menus, and copied commercial descriptions are not
  accepted by either the client form or the server contract.
- Source URLs must be HTTPS and cannot contain credentials. Unsafe stored URLs
  render as warnings, never clickable links.
- Duplicate payloads are a successful no-op; database and stale-target failures
  fail closed.
- Service-role access happens only after the admin authorization boundary.

## Acceptance evidence

- Domain tests cover normalization, source/permission classification, copied
  content rejection, stable hashing, stale overwrite prevention, safe history
  parsing, and score isolation.
- Data tests cover authorization-before-database access, separate quarantined
  insertion, creator attribution, duplicate no-op, and history attachment.
- Migration tests prove the nullable foreign key and explicit rollback without
  any status update.
- Browser verification must cover the real authenticated queue at 390 px and
  1280 px, source-link safety, proposal visibility after refresh, RTL layout,
  overflow, and console errors.

All of these gates pass. The browser check created one uniquely identified
`unknown` QA proposal, verified that it stayed quarantined against a pending
business and did not change the displayed score, then deleted exactly that test
row and confirmed zero QA rows remained.

## Out of scope

Scraping or API ingestion, approving a proposal, merging it into a business
profile, recalculating the pre-screen from proposals, changing OSM fields,
publishing a business, and importing third-party content are separate decisions
and are not part of this slice.
