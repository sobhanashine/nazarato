-- Restores the legacy, weaker public policy. Use only with the corresponding
-- application rollback and an explicit review of the public-data boundary.
create policy "Allow public read of active businesses" on public.businesses
  for select using (status in ('active', 'merged'));
create policy "Allow public read of published reviews" on public.reviews
  for select using (status = 'published');
create policy "Allow public read of review votes" on public.review_votes
  for select using (true);
