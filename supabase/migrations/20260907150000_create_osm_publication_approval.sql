-- Migration: 20260907150000_create_osm_publication_approval
-- Reversible additive audit table + transactional approval function.
-- Locking: brief ROW EXCLUSIVE locks only when the RPC approves one source/business.
-- Backup: n/a before apply (new empty audit table; no existing rows are rewritten).
--
-- Rollback: supabase/rollbacks/20260907150000_create_osm_publication_approval.down.sql

create table if not exists public.business_source_publication_events (
  id                   uuid primary key default gen_random_uuid(),
  source_id            uuid not null references public.business_sources(id) on delete restrict,
  business_id          uuid not null references public.businesses(id) on delete restrict,
  reviewer_id          uuid not null references public.users(id) on delete restrict,
  decision             text not null check (decision = 'approved'),
  publication_snapshot jsonb not null check (
                         jsonb_typeof(publication_snapshot) = 'object'
                         and jsonb_typeof(publication_snapshot -> 'businessSlug') = 'string'
                         and jsonb_typeof(publication_snapshot -> 'sourceRef') = 'string'
                         and jsonb_typeof(publication_snapshot -> 'payloadHash') = 'string'
                         and jsonb_typeof(publication_snapshot -> 'reviewEventId') = 'string'
                         and jsonb_typeof(publication_snapshot -> 'criteriaSnapshot') = 'object'
                       ),
  created_at           timestamptz not null default now(),
  constraint uq_business_source_publication_events_source unique (source_id)
);

create index if not exists idx_business_source_publication_events_business_created
  on public.business_source_publication_events (business_id, created_at desc);

comment on table public.business_source_publication_events is
  'Append-only evidence for explicit, per-record source publication approvals.';

create or replace function public.prevent_business_source_publication_event_mutation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  raise exception 'business source publication events are append-only';
end;
$$;

drop trigger if exists tr_business_source_publication_events_append_only
  on public.business_source_publication_events;
create trigger tr_business_source_publication_events_append_only
  before update or delete on public.business_source_publication_events
  for each row execute function public.prevent_business_source_publication_event_mutation();

alter table public.business_source_publication_events enable row level security;

revoke all on table public.business_source_publication_events
  from public, anon, authenticated;

create or replace function public.approve_osm_business_source_for_publication(
  p_source_id uuid,
  p_reviewer_id uuid,
  p_confirmation_slug text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target record;
  latest_review record;
  existing_event_id uuid;
  new_event_id uuid;
  approved_at timestamptz := clock_timestamp();
begin
  if p_source_id is null or p_reviewer_id is null then
    raise exception 'invalid publication approval input' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.users
    where id = p_reviewer_id
      and role = 'admin'
      and is_banned = false
  ) then
    raise exception 'publication approval forbidden' using errcode = '42501';
  end if;

  select
    s.id as source_id,
    s.business_id,
    s.source_type,
    s.source_ref,
    s.permission_basis,
    s.license_name,
    s.license_url,
    s.attribution_text,
    s.field_payload,
    s.payload_hash,
    s.captured_at,
    s.status as source_status,
    b.slug as business_slug,
    b.name as business_name,
    b.category_slug,
    b.city,
    b.latitude,
    b.longitude,
    b.status as business_status
  into target
  from public.business_sources s
  join public.businesses b on b.id = s.business_id
  where s.id = p_source_id
  for update of s, b;

  if not found then
    raise exception 'publication target unavailable' using errcode = 'P0002';
  end if;

  if lower(btrim(coalesce(p_confirmation_slug, ''))) <> target.business_slug then
    raise exception 'publication confirmation mismatch' using errcode = '22023';
  end if;

  if target.source_status = 'approved' and target.business_status = 'active' then
    select id
    into existing_event_id
    from public.business_source_publication_events
    where source_id = target.source_id;

    if existing_event_id is null then
      raise exception 'approved publication is missing audit evidence' using errcode = '55000';
    end if;

    return jsonb_build_object(
      'noAction', true,
      'sourceId', target.source_id,
      'businessId', target.business_id,
      'eventId', existing_event_id
    );
  end if;

  if target.source_status <> 'quarantined' or target.business_status <> 'pending' then
    raise exception 'publication target state changed' using errcode = '55000';
  end if;

  if target.source_type <> 'open_dataset'
     or target.permission_basis <> 'open_license'
     or target.license_name <> 'ODbL-1.0'
     or target.license_url <> 'https://www.openstreetmap.org/copyright'
     or target.attribution_text <> '© OpenStreetMap contributors'
     or target.source_ref !~ '^https://www\.openstreetmap\.org/(node|way|relation)/[1-9][0-9]*$'
     or target.source_ref <> 'https://www.openstreetmap.org/'
          || replace(substr(target.business_slug, length('rasht-osm-') + 1), '-', '/')
     or target.payload_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'publication provenance invalid' using errcode = '55000';
  end if;

  if target.city <> 'رشت'
     or target.category_slug not in ('cafe', 'restaurant')
     or target.business_slug !~ '^rasht-osm-(node|way|relation)-[1-9][0-9]*$'
     or target.latitude is null
     or target.longitude is null
     or target.latitude < 37.22
     or target.latitude > 37.36
     or target.longitude < 49.5
     or target.longitude > 49.69 then
    raise exception 'publication business identity invalid' using errcode = '55000';
  end if;

  if jsonb_typeof(target.field_payload) is distinct from 'object'
     or target.field_payload ->> 'slug' is distinct from target.business_slug
     or target.field_payload ->> 'name' is distinct from target.business_name
     or target.field_payload ->> 'category_slug' is distinct from target.category_slug
     or target.field_payload ->> 'city' is distinct from target.city
     or jsonb_typeof(target.field_payload -> 'latitude') is distinct from 'number'
     or jsonb_typeof(target.field_payload -> 'longitude') is distinct from 'number'
     or (target.field_payload ->> 'latitude')::numeric is distinct from target.latitude
     or (target.field_payload ->> 'longitude')::numeric is distinct from target.longitude then
    raise exception 'publication source identity mismatch' using errcode = '55000';
  end if;

  if jsonb_typeof(target.field_payload -> 'contact') is distinct from 'object'
     or nullif(btrim(target.field_payload -> 'contact' ->> 'phone'), '') is null
     or btrim(target.field_payload -> 'contact' ->> 'phone')
          !~ '^\+98[0-9]{10}(\s*;\s*\+98[0-9]{10}){0,2}$'
     or (
       nullif(btrim(target.field_payload -> 'contact' ->> 'address'), '') is null
       and nullif(btrim(target.field_payload -> 'contact' ->> 'website'), '') is null
       and nullif(btrim(target.field_payload -> 'contact' ->> 'instagram'), '') is null
     ) then
    raise exception 'publication current prescreen inputs invalid' using errcode = '55000';
  end if;

  select id, decision, criteria_snapshot
  into latest_review
  from public.business_source_review_events
  where source_id = target.source_id
  order by created_at desc, id desc
  limit 1;

  if not found or latest_review.decision <> 'ready_for_approval' then
    raise exception 'publication review is not ready' using errcode = '55000';
  end if;

  if latest_review.criteria_snapshot -> 'valid_source_links' is distinct from 'true'::jsonb
     or jsonb_typeof(latest_review.criteria_snapshot -> 'prescreen') is distinct from 'object'
     or latest_review.criteria_snapshot -> 'prescreen' ->> 'version'
          is distinct from 'nazarato-osm-prescreen/0.1.0'
     or latest_review.criteria_snapshot -> 'prescreen' ->> 'recommendation'
          is distinct from 'low_risk_review'
     or jsonb_typeof(latest_review.criteria_snapshot -> 'prescreen' -> 'score')
          is distinct from 'number'
     or (latest_review.criteria_snapshot -> 'prescreen' ->> 'score')::integer < 75 then
    raise exception 'publication review evidence invalid' using errcode = '55000';
  end if;

  insert into public.business_source_publication_events (
    source_id,
    business_id,
    reviewer_id,
    decision,
    publication_snapshot
  ) values (
    target.source_id,
    target.business_id,
    p_reviewer_id,
    'approved',
    jsonb_build_object(
      'businessSlug', target.business_slug,
      'businessName', target.business_name,
      'categorySlug', target.category_slug,
      'city', target.city,
      'sourceRef', target.source_ref,
      'payloadHash', target.payload_hash,
      'licenseName', target.license_name,
      'licenseUrl', target.license_url,
      'attributionText', target.attribution_text,
      'capturedAt', target.captured_at,
      'reviewEventId', latest_review.id,
      'criteriaSnapshot', latest_review.criteria_snapshot
    )
  )
  returning id into new_event_id;

  update public.business_sources
  set status = 'approved',
      reviewed_by = p_reviewer_id,
      reviewed_at = approved_at,
      updated_at = approved_at
  where id = target.source_id
    and status = 'quarantined';

  if not found then
    raise exception 'publication source update failed' using errcode = '55000';
  end if;

  update public.businesses
  set status = 'active',
      updated_at = approved_at
  where id = target.business_id
    and status = 'pending';

  if not found then
    raise exception 'publication business update failed' using errcode = '55000';
  end if;

  return jsonb_build_object(
    'noAction', false,
    'sourceId', target.source_id,
    'businessId', target.business_id,
    'eventId', new_event_id
  );
end;
$$;

revoke all on function public.approve_osm_business_source_for_publication(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.approve_osm_business_source_for_publication(uuid, uuid, text)
  to service_role;
