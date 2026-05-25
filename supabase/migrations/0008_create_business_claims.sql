-- Migration: create business_claims — reversible — safe (table creation) — backup: n/a
-- Owner-claim workflow for #27. A row records an owner's request to claim a
-- business listing; an admin then approves (sets businesses.owner_id +
-- claimed=true and deletes the proof file) or rejects (with optional reason).
--
-- ROLLBACK:
--   drop trigger if exists tr_business_claim_approved on public.business_claims;
--   drop function if exists public.handle_business_claim_approved;
--   drop table if exists public.business_claims cascade;
--   delete from storage.buckets where id = 'claim-proofs';

-- 1. business_claims
create table if not exists public.business_claims (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  proof_type      text not null
                    check (proof_type in ('domain_email', 'document', 'other')),
  -- For 'domain_email': the work email at the business domain.
  -- For 'document' / 'other': null (the file lives in storage at proof_url).
  proof_email     text,
  -- For 'document' / 'other': storage path inside the private 'claim-proofs' bucket.
  proof_url       text,
  contact_phone   text not null,
  notes           text check (notes is null or char_length(notes) <= 1000),
  status          text not null default 'pending'
                    check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by     uuid references public.users(id) on delete set null,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 2. Indexes
create index if not exists idx_business_claims_status_created on public.business_claims (status, created_at);
create index if not exists idx_business_claims_business on public.business_claims (business_id);
create index if not exists idx_business_claims_user on public.business_claims (user_id);

-- One open claim per (business, user). Admin can re-claim after a rejection.
create unique index if not exists uq_business_claims_one_pending
  on public.business_claims (business_id, user_id)
  where status = 'pending';

-- 3. Row-Level Security — all writes go through server actions with the
--    service-role key. Lock direct anon/authenticated writes; allow users to
--    read their own claims so a future "track my claim" UI works.
alter table public.business_claims enable row level security;

create policy "Users can read their own claims"
  on public.business_claims for select
  using (user_id = auth.uid());

-- 4. Trigger — on approval, flip the business to claimed and set the owner.
create or replace function public.handle_business_claim_approved()
returns trigger as $$
begin
  if (TG_OP = 'UPDATE' and old.status != 'approved' and new.status = 'approved') then
    update public.businesses
    set owner_id = new.user_id,
        claimed  = true,
        updated_at = now()
    where id = new.business_id;
  end if;
  return null;
end;
$$ language plpgsql;

create or replace trigger tr_business_claim_approved
after update on public.business_claims
for each row execute function public.handle_business_claim_approved();

-- 5. Extend notifications.type to cover claim lifecycle events.
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'admin_new_review',
    'review_approved',
    'review_rejected',
    'admin_new_claim',
    'claim_approved',
    'claim_rejected'
  ));

-- 6. Private storage bucket for proof documents.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'claim-proofs',
  'claim-proofs',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
