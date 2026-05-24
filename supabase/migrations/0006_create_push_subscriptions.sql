-- 0006_create_push_subscriptions.sql
-- Web push subscriptions, one row per (user, device). Used by the server to
-- deliver browser push notifications via VAPID.
--
-- endpoint is unique globally — the same physical subscription can't be
-- registered twice (the browser hands out a single endpoint per origin/device).
--
-- ROLLBACK: drop table if exists public.push_subscriptions cascade;

create table if not exists public.push_subscriptions (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.users(id) on delete cascade,
  endpoint    text        not null unique,
  p256dh      text        not null,
  auth        text        not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
