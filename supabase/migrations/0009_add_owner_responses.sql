-- 0009_add_owner_responses.sql
-- nazarato — owner-reply storage on reviews (issue #28, Slice 2).
--
-- Stores the public response a business owner writes to a review. The boolean
-- `has_owner_response` already exists (added in 0002) — we now back it with
-- two real columns and a trigger that keeps the boolean in lockstep so
-- existing read paths don't have to change.
--
-- Length cap mirrors the user-side review body upper bound (2000) but a hair
-- tighter (1500) — an owner reply that runs longer than the review it answers
-- tends to read as defensive, and shorter caps push owners to be concise.
--
-- ROLLBACK:
--   drop trigger if exists tr_review_owner_response on public.reviews;
--   drop function if exists public.handle_review_owner_response;
--   alter table public.reviews
--     drop column if exists owner_response_body,
--     drop column if exists owner_response_at;

alter table public.reviews
  add column if not exists owner_response_body text
    check (owner_response_body is null or char_length(owner_response_body) between 10 and 1500),
  add column if not exists owner_response_at timestamptz;

-- Sync the denormalized boolean automatically — no app-side write coupling.
create or replace function public.handle_review_owner_response()
returns trigger as $$
begin
  if (new.owner_response_body is distinct from old.owner_response_body) then
    new.has_owner_response := new.owner_response_body is not null;
    if (new.owner_response_body is not null and new.owner_response_at is null) then
      new.owner_response_at := now();
    elsif (new.owner_response_body is null) then
      new.owner_response_at := null;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create or replace trigger tr_review_owner_response
before update of owner_response_body on public.reviews
for each row execute function public.handle_review_owner_response();

-- Owners filter the inbox by "unanswered". Existing
-- `idx_reviews_business_status_created` already covers the published filter,
-- so this partial index just makes the unanswered slice a direct hit.
create index if not exists idx_reviews_unanswered
  on public.reviews (business_id, created_at desc)
  where status = 'published' and has_owner_response = false;

-- Two new notification types for the owner flow:
--   owner_replied        → review author, when owner posts a reply
--   admin_review_flagged → all admins, when an owner flags a review for removal
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'admin_new_review',
    'review_approved',
    'review_rejected',
    'admin_new_claim',
    'claim_approved',
    'claim_rejected',
    'owner_replied',
    'admin_review_flagged'
  ));

-- Public bucket for owner-uploaded logo/cover photos. Public (vs. claim-proofs)
-- because these images need to render on `/company/[slug]` for everyone.
-- 3 MB cap is enough for a 1600px-wide JPEG with reasonable compression.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-photos',
  'business-photos',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 3145728,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];
