-- 0005_create_notifications.sql
-- In-app notifications inbox. Each row is one notification for one user.
--
-- Producers:
--  - review submitted        → one row per admin (type: admin_new_review)
--  - admin approves a review → one row for the review author (type: review_approved)
--  - admin rejects a review  → one row for the review author (type: review_rejected)
--
-- Consumers: /profile/notifications (per-user list) + a small bell badge in the
-- account nav. read_at = NULL means unread.
--
-- ROLLBACK: drop table if exists public.notifications cascade;

create table if not exists public.notifications (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.users(id) on delete cascade,
  type        text        not null
                check (type in ('admin_new_review', 'review_approved', 'review_rejected')),
  title       text        not null,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id) where read_at is null;

-- RLS on, no policies: all access goes through the service-role key from the
-- server (matches the rest of the project's auth model).
alter table public.notifications enable row level security;
