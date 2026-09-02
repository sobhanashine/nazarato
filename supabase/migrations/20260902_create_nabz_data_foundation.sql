-- Migration: 20260902_create_nabz_data_foundation — reversible — brief ACCESS
-- EXCLUSIVE lock on businesses for nullable columns; new tables/indexes — backup: n/a
-- (additive migration, not applied to a remote database by this task)
--
-- Rollback: supabase/rollbacks/20260902_create_nabz_data_foundation.down.sql

-- 1. Minimal local-discovery fields. All are nullable so existing rows remain valid.
alter table public.businesses
  add column if not exists neighborhood_slug text,
  add column if not exists latitude numeric(9, 6),
  add column if not exists longitude numeric(9, 6),
  add column if not exists price_band smallint;

alter table public.businesses
  drop constraint if exists businesses_latitude_check,
  add constraint businesses_latitude_check
    check (latitude is null or latitude between -90 and 90),
  drop constraint if exists businesses_longitude_check,
  add constraint businesses_longitude_check
    check (longitude is null or longitude between -180 and 180),
  drop constraint if exists businesses_price_band_check,
  add constraint businesses_price_band_check
    check (price_band is null or price_band between 1 and 4);

create index if not exists idx_businesses_city_status
  on public.businesses (city, status);
create index if not exists idx_businesses_city_neighborhood_status
  on public.businesses (city, neighborhood_slug, status)
  where neighborhood_slug is not null;

-- 2. Field-level source evidence for imported business profiles.
create table if not exists public.business_sources (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references public.businesses(id) on delete cascade,
  source_type       text not null check (source_type in (
                      'owner_submission',
                      'manual_public_facts',
                      'open_dataset',
                      'written_permission',
                      'development_fixture'
                    )),
  source_ref        text not null check (char_length(source_ref) between 1 and 500),
  permission_basis text not null check (permission_basis in (
                      'owner_consent',
                      'public_factual_contact',
                      'open_license',
                      'written_permission',
                      'unknown'
                    )),
  license_name      text,
  license_url       text,
  attribution_text  text,
  field_payload     jsonb not null check (jsonb_typeof(field_payload) = 'object'),
  payload_hash      text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  captured_at       timestamptz not null,
  status            text not null default 'quarantined'
                      check (status in ('approved', 'quarantined', 'rejected')),
  reviewed_by       uuid references public.users(id) on delete set null,
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint uq_business_sources_business_payload_hash
    unique (business_id, payload_hash),
  constraint ck_business_sources_permission_status
    check (permission_basis <> 'unknown' or status = 'quarantined'),
  constraint ck_business_sources_type_permission
    check (
      permission_basis = 'unknown'
      or (source_type = 'owner_submission' and permission_basis = 'owner_consent')
      or (
        source_type = 'manual_public_facts'
        and permission_basis = 'public_factual_contact'
      )
      or (source_type = 'open_dataset' and permission_basis = 'open_license')
      or (
        source_type = 'written_permission'
        and permission_basis = 'written_permission'
      )
    ),
  constraint ck_business_sources_open_license_metadata
    check (
      permission_basis <> 'open_license'
      or (
        nullif(btrim(license_name), '') is not null
        and license_url ~ '^https://'
        and nullif(btrim(attribution_text), '') is not null
      )
    ),
  constraint ck_business_sources_fixture_status
    check (source_type <> 'development_fixture' or (
      permission_basis = 'unknown' and status = 'quarantined'
    )),
  constraint ck_business_sources_review_state
    check (
      (reviewed_at is null and reviewed_by is null)
      or reviewed_at is not null
    )
);

create index if not exists idx_business_sources_business_status
  on public.business_sources (business_id, status);
create index if not exists idx_business_sources_status_captured
  on public.business_sources (status, captured_at desc);

-- 3. Contextual pairwise choices. Raw votes stay private and feed aggregates only.
create table if not exists public.comparison_votes (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references public.users(id) on delete cascade,
  anonymous_session_id  text,
  city_slug             text not null check (char_length(city_slug) between 1 and 100),
  scenario_slug         text not null check (
                          scenario_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
                        ),
  winner_business_id    uuid not null references public.businesses(id) on delete cascade,
  loser_business_id     uuid not null references public.businesses(id) on delete cascade,
  pair_key              text generated always as (
                          least(winner_business_id::text, loser_business_id::text)
                          || ':' ||
                          greatest(winner_business_id::text, loser_business_id::text)
                        ) stored,
  reason_text           text check (
                          reason_text is null or char_length(reason_text) between 1 and 280
                        ),
  moderation_status     text not null default 'accepted'
                          check (moderation_status in ('accepted', 'flagged', 'rejected')),
  weight                numeric(5, 4) not null default 1
                          check (weight between 0 and 1),
  vote_window           date not null default (timezone('UTC', now())::date),
  created_at            timestamptz not null default now(),
  constraint ck_comparison_votes_distinct_businesses
    check (winner_business_id <> loser_business_id),
  constraint ck_comparison_votes_one_identity
    check ((user_id is null) <> (anonymous_session_id is null)),
  constraint ck_comparison_votes_anonymous_session
    check (
      anonymous_session_id is null
      or char_length(anonymous_session_id) between 16 and 128
    )
);

create unique index if not exists uq_comparison_votes_user_pair_window
  on public.comparison_votes (user_id, city_slug, scenario_slug, pair_key, vote_window)
  where user_id is not null;
create unique index if not exists uq_comparison_votes_session_pair_window
  on public.comparison_votes (
    anonymous_session_id,
    city_slug,
    scenario_slug,
    pair_key,
    vote_window
  )
  where anonymous_session_id is not null;
create index if not exists idx_comparison_votes_ranking
  on public.comparison_votes (city_slug, scenario_slug, moderation_status, created_at desc);
create index if not exists idx_comparison_votes_winner
  on public.comparison_votes (winner_business_id, scenario_slug, created_at desc);
create index if not exists idx_comparison_votes_loser
  on public.comparison_votes (loser_business_id, scenario_slug, created_at desc);

-- 4. Versioned, evidence-bearing analysis. Original review text is never replaced.
create table if not exists public.review_analyses (
  review_id          uuid not null references public.reviews(id) on delete cascade,
  model_id           text not null check (char_length(model_id) between 1 and 120),
  model_version      text not null check (char_length(model_version) between 1 and 120),
  normalized_text    text not null,
  aspect_scores      jsonb not null check (jsonb_typeof(aspect_scores) = 'object'),
  sentiment          text not null check (
                       sentiment in ('positive', 'neutral', 'mixed', 'negative')
                     ),
  evidence_spans     jsonb not null check (jsonb_typeof(evidence_spans) = 'array'),
  issue_cluster      text,
  suspicious_score  numeric(5, 4) not null check (suspicious_score between 0 and 1),
  confidence         numeric(5, 4) not null check (confidence between 0 and 1),
  human_status       text not null default 'unreviewed'
                       check (human_status in (
                         'unreviewed', 'confirmed', 'corrected', 'rejected'
                       )),
  is_active          boolean not null default true,
  analyzed_at        timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  primary key (review_id, model_id, model_version)
);

create unique index if not exists uq_review_analyses_active_review
  on public.review_analyses (review_id)
  where is_active;
create index if not exists idx_review_analyses_model_status
  on public.review_analyses (model_id, model_version, human_status);
create index if not exists idx_review_analyses_issue_cluster
  on public.review_analyses (issue_cluster, analyzed_at desc)
  where is_active and issue_cluster is not null;

-- 5. Private per-user preference weights. Only server-side access is permitted.
create table if not exists public.taste_profiles (
  user_id            uuid not null references public.users(id) on delete cascade,
  model_id           text not null check (char_length(model_id) between 1 and 120),
  model_version      text not null check (char_length(model_version) between 1 and 120),
  dimension_weights  jsonb not null check (jsonb_typeof(dimension_weights) = 'object'),
  evidence_count     integer not null default 0 check (evidence_count >= 0),
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  primary key (user_id, model_id, model_version)
);

create unique index if not exists uq_taste_profiles_active_user
  on public.taste_profiles (user_id)
  where is_active;
create index if not exists idx_taste_profiles_model
  on public.taste_profiles (model_id, model_version, updated_at desc);

-- 6. Private-by-default RLS. Auth is app-managed, so future user-facing access
-- must go through a server boundary that applies the signed-session user id.
alter table public.business_sources enable row level security;
alter table public.comparison_votes enable row level security;
alter table public.review_analyses enable row level security;
alter table public.taste_profiles enable row level security;

-- Deliberately no anon/authenticated policies for these four tables.
-- The service-role-backed server layer is the only read/write path.
