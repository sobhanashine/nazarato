# Staging Golsar data and complete product paths

Authorized by the founder on 2026-10-16: put the previously screened cafe
dataset on staging, retain main's design, use the existing Supabase project,
and activate available providers. Main promotion is not authorized.

**Problem.** The 22 selected Golsar cafes exist only in an ignored local
snapshot. Staging has a working database connection but no eligible catalog.

**User action.** Open staging, search the 22 cafes, open their native profiles,
choose pairs in Nabz, then sign in by real SMS to save preferences, bookmarks
and pending first-party experiences. Chat uses the supplied Gemini credential.
Owner/admin permissions remain real permissions, not an automatic bypass.

**Data changes.** Use `nazarato_staging` inside the same Supabase project.
Reproduce the inspected application schema without copying production rows;
all foreign keys, triggers and routines must remain inside the new schema.
Only the service role receives access. Import the 22 factual candidate records
idempotently, with stable identities and their original source metadata.
`internal_preview` sources are approved for staging use only; their permission
basis stays unknown and publication/ownership remain unconfirmed. Do not import
Google opinions, ratings, photos, reviewers or the legacy synthetic accounts.
Use separate staging storage buckets and the existing isolated D1/Push state.

**Failure modes.** A wrong/missing staging schema fails closed, never falls back
to public. A malformed or duplicate candidate stops the import. Missing provider
credentials show explicit unavailable states. Missing real first-party evidence
produces an insufficient-evidence result, not fabricated recommendations.

**Done when.** All 22 cafes are database-backed and browsable on staging with
main's theme; data isolation, source provenance, routes and available providers
are verified. SMS and actual Push receipt are separate gates until a valid
Kavenegar key/template and a consenting test device are available.

Tracking: https://trello.com/c/L7OhGwkq . Provider activation continues card 33.
Custom schema client configuration follows
[Supabase documentation](https://supabase.com/docs/guides/api/using-custom-schemas),
with service-only grants instead of anonymous grants.
