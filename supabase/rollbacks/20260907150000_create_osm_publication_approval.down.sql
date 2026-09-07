-- DESTRUCTIVE to publication audit history. Back up the new table before rollback
-- after any production approval has been recorded.

revoke all on function public.approve_osm_business_source_for_publication(uuid, uuid, text)
  from public, anon, authenticated, service_role;
drop function if exists public.approve_osm_business_source_for_publication(uuid, uuid, text);

drop trigger if exists tr_business_source_publication_events_append_only
  on public.business_source_publication_events;
drop function if exists public.prevent_business_source_publication_event_mutation();
drop table if exists public.business_source_publication_events;
