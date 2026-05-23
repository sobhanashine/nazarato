-- Migration: create bookmarks — reversible — safe (table creation) — backup: n/a
-- Creates the bookmarks table, indexes, and RLS policies.

CREATE TABLE bookmarks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT uq_bookmarks_user_business UNIQUE (user_id, business_id)
);

-- Partial index for /saved list queries by user_id ordered by recency
CREATE INDEX idx_bookmarks_user_created ON bookmarks (user_id, created_at DESC);

-- RLS Policies
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookmarks" ON bookmarks
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own bookmarks" ON bookmarks
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own bookmarks" ON bookmarks
    FOR DELETE USING (user_id = auth.uid());

/*
-- DOWN MIGRATION (Reversibility Note)
DROP TABLE IF EXISTS bookmarks CASCADE;
*/
