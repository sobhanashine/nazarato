-- Reverses creator attribution for business source rows.
-- Destructive only to the nullable audit column introduced by the matching up migration.

alter table public.business_sources
  drop column if exists created_by;
