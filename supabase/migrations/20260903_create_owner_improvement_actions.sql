-- Migration: 20260903_create_owner_improvement_actions — reversible —
-- CREATE TABLE/INDEX metadata locks — backup: n/a (new additive table)
-- Stores a versioned baseline and target for one owner-led improvement cycle.
-- Not applied to a remote database by this task.
-- Rollback: supabase/rollbacks/20260903_create_owner_improvement_actions.down.sql

create table if not exists public.business_improvement_actions (
  id                         uuid primary key default gen_random_uuid(),
  business_id                uuid not null references public.businesses(id) on delete cascade,
  created_by                 uuid references public.users(id) on delete set null,
  title                      text not null check (char_length(title) between 5 and 160),
  target_aspect              text not null check (target_aspect in (
                               'taste', 'service', 'value', 'atmosphere',
                               'cleanliness', 'wait_time'
                             )),
  target_issue_cluster       text not null check (target_issue_cluster in (
                               'taste_quality', 'service_experience', 'price_value',
                               'atmosphere_comfort', 'cleanliness_hygiene',
                               'wait_time', 'general_dissatisfaction'
                             )),
  baseline_window_start      date not null,
  baseline_window_end        date not null,
  baseline_review_count      integer not null check (baseline_review_count >= 0),
  baseline_negative_mentions integer not null check (baseline_negative_mentions >= 0),
  baseline_negative_rate     numeric(5, 4) not null check (
                               baseline_negative_rate between 0 and 1
                             ),
  target_reduction_pct       smallint not null check (target_reduction_pct between 1 and 90),
  target_negative_rate       numeric(5, 4) not null check (
                               target_negative_rate between 0 and 1
                             ),
  follow_up_date             date not null,
  follow_up_window_start     date,
  follow_up_window_end       date,
  follow_up_review_count     integer check (follow_up_review_count >= 0),
  follow_up_negative_mentions integer check (follow_up_negative_mentions >= 0),
  follow_up_negative_rate    numeric(5, 4) check (
                               follow_up_negative_rate between 0 and 1
                             ),
  measured_at                timestamptz,
  model_id                   text not null check (char_length(model_id) between 1 and 120),
  model_version              text not null check (char_length(model_version) between 1 and 120),
  status                     text not null default 'active' check (
                               status in ('planned', 'active', 'completed', 'cancelled')
                             ),
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  constraint ck_business_improvement_actions_window
    check (baseline_window_start <= baseline_window_end),
  constraint ck_business_improvement_actions_follow_up
    check (follow_up_date > baseline_window_end),
  constraint ck_business_improvement_actions_mentions
    check (baseline_negative_mentions <= baseline_review_count),
  constraint ck_business_improvement_actions_follow_up_state
    check (
      num_nonnulls(
        follow_up_window_start,
        follow_up_window_end,
        follow_up_review_count,
        follow_up_negative_mentions,
        follow_up_negative_rate,
        measured_at
      ) = 0
      or (
        num_nonnulls(
          follow_up_window_start,
          follow_up_window_end,
          follow_up_review_count,
          follow_up_negative_mentions,
          follow_up_negative_rate,
          measured_at
        ) = 6
        and follow_up_window_start <= follow_up_window_end
        and follow_up_negative_mentions <= follow_up_review_count
      )
    )
);

create unique index if not exists uq_business_improvement_actions_active
  on public.business_improvement_actions (business_id)
  where status in ('planned', 'active');

create index if not exists idx_business_improvement_actions_follow_up
  on public.business_improvement_actions (follow_up_date, status);

alter table public.business_improvement_actions enable row level security;

-- Deliberately no anon/authenticated policies. The app-managed signed session
-- is checked at the server action boundary and service-role performs the write.
