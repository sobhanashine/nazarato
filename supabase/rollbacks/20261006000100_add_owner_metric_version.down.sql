-- Back up the recorded metric-version values before using this rollback on
-- a populated database. Dropping this column disables new follow-up writes.
alter table public.business_improvement_actions drop column if exists metric_version;
