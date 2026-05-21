-- 0001_create_users_table.sql
-- nazarato — the `users` table: phone-verified consumer / owner accounts.
--
-- HOW TO RUN: Supabase Dashboard → SQL Editor → New query → paste all of this
-- → Run. It is idempotent (`if not exists`), so re-running is safe.
--
-- NOTE: auth is app-managed (phone OTP + signed-cookie sessions), so `users`
-- is a standalone table — it does NOT extend Supabase's `auth.users`, and it
-- carries its own `phone` column. See docs/data-model.md §2.
--
-- ROLLBACK:  drop table if exists public.users cascade;

create table if not exists public.users (
  id                      uuid primary key default gen_random_uuid(),
  phone                   text        not null unique,
  display_name            text        not null,
  username                text        unique,            -- set later (profile edit)
  avatar_url              text,
  avatar_color            text,
  bio                     text        check (bio is null or char_length(bio) <= 140),
  role                    text        not null default 'consumer'
                            check (role in ('consumer', 'admin')),
  public_profile          boolean     not null default true,
  is_banned               boolean     not null default false,
  reviews_count           integer     not null default 0,
  -- gamification counters — populated when the P3 engine ships (data-model.md §6)
  reputation_score        integer     not null default 0,
  helpful_votes_received  integer     not null default 0,
  verified_reviews_count  integer     not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Row-Level Security: ON, with no policies. The public/anon key can therefore
-- read or write nothing in this table; all access is server-side via the
-- service-role key (which bypasses RLS). Add a SELECT policy that respects
-- `public_profile` when public reviewer profiles land (issue #26).
alter table public.users enable row level security;
