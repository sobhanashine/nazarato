-- 0002_create_businesses_and_reviews.sql
-- nazarato — businesses and reviews tables, triggers, indexes, and storage bucket.
--
-- ROLLBACK:
--   drop trigger if exists tr_review_changes on public.reviews;
--   drop function if exists public.handle_review_changes;
--   drop table if exists public.reviews cascade;
--   drop table if exists public.businesses cascade;
--   delete from storage.buckets where id = 'proofs';

-- 1. Create businesses table
create table if not exists public.businesses (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text not null unique,
  type                    text not null default 'company'
                            check (type in ('company', 'ig_shop')),
  name                    text not null,
  category_slug           text not null,
  city                    text,
  description             text,
  initial                 text not null,
  color                   text not null,
  logo_url                text,
  cover_url               text,
  contact                 jsonb not null default '{}'::jsonb,
  hours                   jsonb,
  info                    jsonb not null default '[]'::jsonb,
  claimed                 boolean not null default false,
  owner_id                uuid references public.users(id) on delete set null,
  verified                boolean not null default false,
  status                  text not null default 'active'
                            check (status in ('active', 'pending', 'merged', 'hidden')),
  review_count            integer not null default 0,
  rating_sum              integer not null default 0,
  rating_avg              numeric(2,1) generated always as (
                            case when review_count = 0 then 0.0
                            else round((rating_sum::numeric / review_count), 1) end
                          ) stored,
  last_review_at          timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- 2. Create reviews table
create table if not exists public.reviews (
  id                      uuid primary key default gen_random_uuid(),
  business_id             uuid not null references public.businesses(id) on delete cascade,
  author_id               uuid not null references public.users(id) on delete cascade,
  rating                  smallint not null check (rating between 1 and 5),
  title                   text check (title is null or char_length(title) <= 80),
  body                    text not null check (char_length(body) between 30 and 2000),
  status                  text not null default 'pending'
                            check (status in ('pending', 'published', 'rejected')),
  rejection_reason        text,
  verified                boolean not null default false,
  proof_status            text not null default 'none'
                            check (proof_status in ('none', 'submitted', 'approved', 'rejected')),
  proof_url               text,
  proof_type              text check (proof_type is null or proof_type in ('invoice', 'sms', 'tracking', 'dm', 'receipt')),
  purchase_date           date,
  helpful_count           integer not null default 0,
  report_count            integer not null default 0,
  has_owner_response      boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  edited_at               timestamptz,
  constraint uq_reviews_business_author unique (business_id, author_id)
);

-- 3. Indexes (as defined in data-model.md §6)
create index if not exists idx_reviews_business_status_created on public.reviews (business_id, status, created_at);
create index if not exists idx_reviews_author on public.reviews (author_id);
create index if not exists idx_businesses_category_status on public.businesses (category_slug, status);
create index if not exists idx_businesses_slug on public.businesses (slug);

-- 4. Row-Level Security
alter table public.businesses enable row level security;
alter table public.reviews enable row level security;

-- Policies for public (anon/authenticated) reads (safe since sensitive fields like proof_url aren't readable directly without the service key)
create policy "Allow public read of active businesses"
  on public.businesses for select
  using (status in ('active', 'merged'));

create policy "Allow public read of published reviews"
  on public.reviews for select
  using (status = 'published');

-- 5. Trigger to update denormalized counters automatically
create or replace function public.handle_review_changes()
returns trigger as $$
begin
  -- On INSERT
  if (TG_OP = 'INSERT') then
    if (new.status = 'published') then
      update public.businesses
      set review_count = review_count + 1,
          rating_sum = rating_sum + new.rating,
          last_review_at = new.created_at
      where id = new.business_id;
      
      update public.users
      set reviews_count = reviews_count + 1
      where id = new.author_id;
    end if;
  
  -- On UPDATE
  elsif (TG_OP = 'UPDATE') then
    -- If status changed to published
    if (old.status != 'published' and new.status = 'published') then
      update public.businesses
      set review_count = review_count + 1,
          rating_sum = rating_sum + new.rating,
          last_review_at = greatest(last_review_at, new.created_at)
      where id = new.business_id;
      
      update public.users
      set reviews_count = reviews_count + 1
      where id = new.author_id;
    -- If status changed from published to something else
    elsif (old.status = 'published' and new.status != 'published') then
      update public.businesses
      set review_count = greatest(0, review_count - 1),
          rating_sum = greatest(0, rating_sum - old.rating)
      where id = new.business_id;
      
      update public.users
      set reviews_count = greatest(0, reviews_count - 1)
      where id = old.author_id;
    -- If status remains published, but rating changed
    elsif (old.status = 'published' and new.status = 'published' and old.rating != new.rating) then
      update public.businesses
      set rating_sum = greatest(0, rating_sum - old.rating + new.rating)
      where id = new.business_id;
    end if;

  -- On DELETE
  elsif (TG_OP = 'DELETE') then
    if (old.status = 'published') then
      update public.businesses
      set review_count = greatest(0, review_count - 1),
          rating_sum = greatest(0, rating_sum - old.rating)
      where id = old.business_id;
      
      update public.users
      set reviews_count = greatest(0, reviews_count - 1)
      where id = old.author_id;
    end if;
  end if;
  
  return null;
end;
$$ language plpgsql;

create or replace trigger tr_review_changes
after insert or update or delete on public.reviews
for each row execute function public.handle_review_changes();

-- 6. Setup Private Proofs Bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'proofs',
  'proofs',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
