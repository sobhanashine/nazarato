-- Migration: add_owner_metric_version — reversible — brief ACCESS EXCLUSIVE;
-- backup: n/a (nullable additive column). Legacy baselines remain unchanged
-- and cannot be presented as comparable to the new qualified-review metric.
alter table public.business_improvement_actions add column if not exists metric_version text;
