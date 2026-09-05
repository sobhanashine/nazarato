-- Append-only internal review decisions for imported business source records.
-- This table deliberately does not update business_sources.status or
-- businesses.status; review readiness and publication remain separate states.

create table if not exists public.business_source_review_events (
  id                uuid primary key default gen_random_uuid(),
  source_id         uuid not null references public.business_sources(id) on delete restrict,
  reviewer_id       uuid not null references public.users(id) on delete restrict,
  decision          text not null check (decision in (
                      'unreviewed',
                      'needs_correction',
                      'ready_for_approval',
                      'rejected'
                    )),
  note              text,
  criteria_snapshot jsonb not null check (
                      jsonb_typeof(criteria_snapshot) = 'object'
                      and jsonb_typeof(criteria_snapshot -> 'has_phone') = 'boolean'
                      and jsonb_typeof(criteria_snapshot -> 'has_address') = 'boolean'
                      and jsonb_typeof(criteria_snapshot -> 'has_website') = 'boolean'
                      and jsonb_typeof(criteria_snapshot -> 'has_instagram') = 'boolean'
                      and jsonb_typeof(criteria_snapshot -> 'valid_source_links') = 'boolean'
                    ),
  created_at        timestamptz not null default now(),
  constraint ck_business_source_review_events_note_length
    check (note is null or char_length(note) between 1 and 500),
  constraint ck_business_source_review_events_reason_required
    check (
      decision not in ('needs_correction', 'rejected')
      or nullif(btrim(note), '') is not null
    )
);

create index if not exists idx_business_source_review_events_source_created
  on public.business_source_review_events (source_id, created_at desc, id desc);

comment on table public.business_source_review_events is
  'Append-only internal source-quality decisions; never a publication command.';

create or replace function public.prevent_business_source_review_event_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'business source review events are append-only';
end;
$$;

drop trigger if exists tr_business_source_review_events_append_only
  on public.business_source_review_events;
create trigger tr_business_source_review_events_append_only
  before update or delete on public.business_source_review_events
  for each row execute function public.prevent_business_source_review_event_mutation();

alter table public.business_source_review_events enable row level security;
