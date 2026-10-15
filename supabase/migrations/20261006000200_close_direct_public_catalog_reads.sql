-- Migration: close_direct_public_catalog_reads — reversible — policy metadata;
-- backup: n/a (no rows changed). App-managed sessions use server-side service
-- role access; direct anon reads must not bypass the approved-source contract
-- or reveal the identities behind individual helpful votes.
drop policy if exists "Allow public read of active businesses" on public.businesses;
drop policy if exists "Allow public read of published reviews" on public.reviews;
drop policy if exists "Allow public read of review votes" on public.review_votes;
