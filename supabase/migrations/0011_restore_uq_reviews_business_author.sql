-- Restore the (business_id, author_id) uniqueness that 0010 dropped.
--
-- Context: PR #102 dropped this constraint so users could leave multiple
-- reviews per business. We rolled that decision back; this migration puts
-- the constraint back. Existing duplicate rows (from the window the
-- constraint was off) are deduped first — we keep the oldest row per
-- (business_id, author_id) pair and delete the rest.
--
-- Both the dedupe and the ADD CONSTRAINT are written to be idempotent:
-- safe to re-apply, safe on a fresh database where 0010 was never in the
-- migrations folder (the constraint already exists from 0002 and the
-- IF NOT EXISTS guard skips).

-- 1. Dedupe — keep the oldest review per (business_id, author_id).
delete from public.reviews r
using public.reviews older
where r.business_id = older.business_id
  and r.author_id   = older.author_id
  and r.created_at  > older.created_at;

-- 2. Restore the constraint, idempotently.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'uq_reviews_business_author'
  ) then
    alter table public.reviews
      add constraint uq_reviews_business_author unique (business_id, author_id);
  end if;
end $$;
