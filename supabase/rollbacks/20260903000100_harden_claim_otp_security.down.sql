-- Rollback for 20260903000100_harden_claim_otp_security.sql.
-- WARNING: this removes the security audit history created after migration.

alter table public.business_claims
  drop constraint if exists business_claims_approved_is_verified;
alter table public.business_claims
  drop constraint if exists business_claims_verification_status_check;

drop trigger if exists tr_audit_business_claim_change on public.business_claims;
drop function if exists public.audit_business_claim_change;
drop table if exists public.security_audit_events;

alter table public.business_claims
  drop column if exists verified_by,
  drop column if exists verified_at,
  drop column if exists verification_status;
