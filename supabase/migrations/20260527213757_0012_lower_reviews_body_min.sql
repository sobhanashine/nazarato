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
end $$;;
