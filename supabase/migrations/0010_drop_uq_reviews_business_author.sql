-- Drop the (business_id, author_id) uniqueness so a user can leave more than
-- one review on the same business (e.g. a follow-up after a second purchase).
-- Per-business per-author was a Phase-1 spam guard; with the moderation queue
-- handling abuse, the constraint is no longer needed and was blocking a real
-- user request to write multiple reviews on the same shop.

alter table public.reviews
  drop constraint if exists uq_reviews_business_author;
