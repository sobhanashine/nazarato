-- Migration: add_review_origin_gate — reversible with provenance backup —
-- brief ACCESS EXCLUSIVE for additive column; counter backfill takes row locks.
-- No review text/status is changed. Existing rows stay unknown until explicit
-- per-record reconciliation. Never infer first-party origin from publication.
alter table public.reviews add column if not exists origin_kind text not null default 'unknown'
  check (origin_kind in ('first_party','development_fixture','unknown'));
create index if not exists idx_reviews_public_origin_business
  on public.reviews(business_id,created_at desc) where status='published' and origin_kind='first_party';
create or replace function public.handle_review_changes()
returns trigger language plpgsql set search_path=public as $$
declare old_visible boolean := false; new_visible boolean := false; b uuid; u uuid; n integer; s integer;
begin
 if TG_OP <> 'INSERT' then old_visible := old.status='published' and old.origin_kind='first_party'; end if;
 if TG_OP <> 'DELETE' then new_visible := new.status='published' and new.origin_kind='first_party'; end if;
 for b in select distinct x from unnest(array[case when old_visible then old.business_id end,case when new_visible then new.business_id end]) x where x is not null order by x loop
   n := (case when new_visible and new.business_id=b then 1 else 0 end) - (case when old_visible and old.business_id=b then 1 else 0 end);
   s := (case when new_visible and new.business_id=b then new.rating else 0 end) - (case when old_visible and old.business_id=b then old.rating else 0 end);
   update public.businesses set review_count=greatest(0,review_count+n),rating_sum=greatest(0,rating_sum+s),
     last_review_at=(select max(created_at) from public.reviews where business_id=b and status='published' and origin_kind='first_party') where id=b;
 end loop;
 for u in select distinct x from unnest(array[case when old_visible then old.author_id end,case when new_visible then new.author_id end]) x where x is not null order by x loop
   n := (case when new_visible and new.author_id=u then 1 else 0 end) - (case when old_visible and old.author_id=u then 1 else 0 end);
   update public.users set reviews_count=greatest(0,reviews_count+n) where id=u;
 end loop;
 return null;
end;
$$;
update public.businesses b set review_count=(select count(*) from public.reviews r where r.business_id=b.id and r.status='published' and r.origin_kind='first_party'),
 rating_sum=coalesce((select sum(rating) from public.reviews r where r.business_id=b.id and r.status='published' and r.origin_kind='first_party'),0),
 last_review_at=(select max(created_at) from public.reviews r where r.business_id=b.id and r.status='published' and r.origin_kind='first_party');
update public.users u set reviews_count=(select count(*) from public.reviews r where r.author_id=u.id and r.status='published' and r.origin_kind='first_party');
