-- Migration: create review_votes — reversible — safe (table creation) — backup: n/a
-- Creates the review_votes table, indexes, triggers, and RLS policies.

CREATE TABLE public.review_votes (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id   uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at  timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT uq_review_votes_review_user UNIQUE (review_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_review_votes_review ON public.review_votes (review_id);
CREATE INDEX idx_review_votes_user ON public.review_votes (user_id);

-- RLS Policies
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of review votes" ON public.review_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own review votes" ON public.review_votes
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own review votes" ON public.review_votes
    FOR DELETE USING (user_id = auth.uid());

-- Trigger to increment/decrement helpful_count on reviews and helpful_votes_received on users
CREATE OR REPLACE FUNCTION public.handle_review_vote_changes()
RETURNS trigger as $$
DECLARE
  v_author_id uuid;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Increment review's helpful_count
    UPDATE public.reviews
    SET helpful_count = helpful_count + 1
    WHERE id = new.review_id
    RETURNING author_id INTO v_author_id;

    -- Increment author's helpful_votes_received
    UPDATE public.users
    SET helpful_votes_received = helpful_votes_received + 1
    WHERE id = v_author_id;

  ELSIF (TG_OP = 'DELETE') THEN
    -- Decrement review's helpful_count
    UPDATE public.reviews
    SET helpful_count = greatest(0, helpful_count - 1)
    WHERE id = old.review_id
    RETURNING author_id INTO v_author_id;

    -- Decrement author's helpful_votes_received
    UPDATE public.users
    SET helpful_votes_received = greatest(0, helpful_votes_received - 1)
    WHERE id = v_author_id;
  END IF;

  RETURN null;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tr_review_vote_changes
AFTER INSERT OR DELETE ON public.review_votes
FOR EACH ROW EXECUTE FUNCTION public.handle_review_vote_changes();

/*
-- DOWN MIGRATION (Reversibility Note)
DROP TRIGGER IF EXISTS tr_review_vote_changes ON public.review_votes;
DROP FUNCTION IF EXISTS public.handle_review_vote_changes();
DROP TABLE IF EXISTS public.review_votes CASCADE;
*/
