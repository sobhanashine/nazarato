alter table public.reviews
  add column if not exists owner_response_body text
    check (owner_response_body is null or char_length(owner_response_body) between 10 and 1500),
  add column if not exists owner_response_at timestamptz;

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

drop trigger if exists tr_review_owner_response on public.reviews;
create trigger tr_review_owner_response
before update of owner_response_body on public.reviews
for each row execute function public.handle_review_owner_response();

create index if not exists idx_reviews_unanswered
  on public.reviews (business_id, created_at desc)
  where status = 'published' and has_owner_response = false;;
