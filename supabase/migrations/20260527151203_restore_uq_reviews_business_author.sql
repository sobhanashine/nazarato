delete from public.reviews r
using public.reviews older
where r.business_id = older.business_id
  and r.author_id   = older.author_id
  and r.created_at  > older.created_at;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'uq_reviews_business_author'
  ) then
    alter table public.reviews
      add constraint uq_reviews_business_author unique (business_id, author_id);
  end if;
end $$;;
