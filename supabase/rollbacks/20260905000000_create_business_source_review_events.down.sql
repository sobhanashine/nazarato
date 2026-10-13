-- Rollback for 20260905000000_create_business_source_review_events.sql.
-- Back up the event table before running this rollback in an environment that
-- contains real review decisions.

drop table if exists public.business_source_review_events;
drop function if exists public.prevent_business_source_review_event_mutation();
