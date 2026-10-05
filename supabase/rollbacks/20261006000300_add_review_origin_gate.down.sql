-- DESTRUCTIVE rollback: back up reviews.id + origin_kind before use on a
-- populated database. Restores the legacy counter definition, which includes
-- unknown/test reviews. Application must roll back with this migration.
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

drop index if exists public.idx_reviews_public_origin_business;
alter table public.reviews drop column if exists origin_kind;
update public.businesses b set review_count=(select count(*) from public.reviews r where r.business_id=b.id and r.status='published'),rating_sum=coalesce((select sum(rating) from public.reviews r where r.business_id=b.id and r.status='published'),0),last_review_at=(select max(created_at) from public.reviews r where r.business_id=b.id and r.status='published');
update public.users u set reviews_count=(select count(*) from public.reviews r where r.author_id=u.id and r.status='published');
