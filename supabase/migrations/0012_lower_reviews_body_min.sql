-- Lower the reviews.body minimum length from 30 to 10 to match the form.
--
-- Context (issue #117): PR #98 lowered `BODY_MIN` to 10 in the review wizard
-- and server action — but the DB check constraint from migration 0002 still
-- required 30. Any 10–29 char body passed both client and server validation
-- then failed at insert time, surfacing as a generic «خطا در ثبت نظر».
--
-- Postgres has no `ALTER ... ALTER CONSTRAINT` for check constraints, so we
-- drop and re-add. Idempotent by guarding on pg_constraint name — safe to
-- re-run, and safe on a fresh DB where 0002 already shipped the new bound
-- (the IF EXISTS / NOT EXISTS guards skip).

do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'reviews_body_check'
  ) then
    alter table public.reviews drop constraint reviews_body_check;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'reviews_body_check'
  ) then
    alter table public.reviews
      add constraint reviews_body_check
      check (char_length(body) between 10 and 2000);
  end if;
end $$;
