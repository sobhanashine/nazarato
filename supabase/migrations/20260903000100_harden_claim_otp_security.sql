-- Migration: 20260903000100_harden_claim_otp_security — harden owner claims
-- and add a private security audit trail.
-- Risk: additive columns/table plus a validated approval invariant.
-- Existing approved claims are grandfathered with their historical review time;
-- verified_by remains null when the old row did not retain a reviewer.
-- Apply remotely only after a backup and explicit deployment approval.

alter table public.business_claims
  add column if not exists verification_status text not null default 'manual_review',
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references public.users(id) on delete set null;

alter table public.business_claims
  drop constraint if exists business_claims_verification_status_check;
alter table public.business_claims
  add constraint business_claims_verification_status_check
  check (verification_status in ('manual_review', 'verified', 'failed'));

update public.business_claims
set verification_status = 'verified',
    verified_at = coalesce(reviewed_at, updated_at, created_at),
    verified_by = reviewed_by
where status = 'approved'
  and (
    verification_status <> 'verified'
    or verified_at is null
  );

update public.business_claims
set verification_status = 'failed'
where status = 'rejected'
  and verification_status <> 'failed';

alter table public.business_claims
  drop constraint if exists business_claims_approved_is_verified;
alter table public.business_claims
  add constraint business_claims_approved_is_verified
  check (
    status <> 'approved'
    or (
      verification_status = 'verified'
      and verified_at is not null
    )
  ) not valid;
alter table public.business_claims
  validate constraint business_claims_approved_is_verified;

create table if not exists public.security_audit_events (
  id              uuid primary key default gen_random_uuid(),
  event_type      text not null check (char_length(event_type) between 3 and 80),
  actor_user_id   uuid references public.users(id) on delete set null,
  subject_type    text not null check (char_length(subject_type) between 3 and 40),
  subject_id      text not null check (char_length(subject_id) between 1 and 160),
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists idx_security_audit_events_subject_created
  on public.security_audit_events (subject_type, subject_id, created_at desc);
create index if not exists idx_security_audit_events_type_created
  on public.security_audit_events (event_type, created_at desc);

alter table public.security_audit_events enable row level security;
revoke all on public.security_audit_events from anon, authenticated;

comment on table public.security_audit_events is
  'Private append-only server audit for OTP and ownership-claim security events.';

create or replace function public.audit_business_claim_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  audit_event_type text;
  audit_actor uuid;
begin
  if TG_OP = 'INSERT' then
    audit_event_type := 'business_claim_submitted';
    audit_actor := new.user_id;
  elsif old.status is distinct from new.status then
    audit_event_type := 'business_claim_' || new.status;
    audit_actor := new.reviewed_by;
  else
    return new;
  end if;

  insert into public.security_audit_events (
    event_type,
    actor_user_id,
    subject_type,
    subject_id,
    metadata
  ) values (
    audit_event_type,
    audit_actor,
    'business_claim',
    new.id::text,
    jsonb_build_object(
      'businessId', new.business_id,
      'proofType', new.proof_type,
      'verificationStatus', new.verification_status,
      'hasFile', new.proof_url is not null
    )
  );
  return new;
end;
$$;

drop trigger if exists tr_audit_business_claim_change on public.business_claims;
create trigger tr_audit_business_claim_change
after insert or update of status on public.business_claims
for each row execute function public.audit_business_claim_change();
