-- Migration: 20260905010000_add_business_source_created_by — reversible — brief
-- ACCESS EXCLUSIVE lock on business_sources — backup: n/a (nullable metadata only)
--
-- Rollback: supabase/rollbacks/20260905010000_add_business_source_created_by.down.sql

alter table public.business_sources
  add column if not exists created_by uuid references public.users(id) on delete set null;

comment on column public.business_sources.created_by is
  'Admin or owner who captured this source row; null for legacy/imported rows.';
