-- 0004_add_notification_settings.sql
-- Add in-website notification preferences to the users table

alter table public.users
add column if not exists notification_replies boolean not null default true,
add column if not exists notification_bookmarks boolean not null default true;
