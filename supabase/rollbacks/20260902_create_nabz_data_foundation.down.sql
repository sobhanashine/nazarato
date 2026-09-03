-- Rollback for 20260902_create_nabz_data_foundation.sql.
-- This deletes Nabz data and removes its nullable business columns. Back up any
-- environment with real Nabz rows before running this file.

drop table if exists public.taste_profiles cascade;
drop table if exists public.review_analysis_corrections cascade;
drop table if exists public.review_analyses cascade;
drop table if exists public.comparison_votes cascade;
drop table if exists public.business_sources cascade;

drop index if exists public.idx_businesses_city_neighborhood_status;
drop index if exists public.idx_businesses_city_status;

alter table public.businesses
  drop constraint if exists businesses_price_band_check,
  drop constraint if exists businesses_longitude_check,
  drop constraint if exists businesses_latitude_check,
  drop column if exists price_band,
  drop column if exists longitude,
  drop column if exists latitude,
  drop column if exists neighborhood_slug;
