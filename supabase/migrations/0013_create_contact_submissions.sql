-- Migration: create contact_submissions — reversible — safe (table creation) — backup: n/a
-- Durable intake for the /contact form. Previously submissions were only
-- console.logged and silently lost (issue #142); this gives them a home.

CREATE TABLE contact_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    subject text,
    message text NOT NULL,
    status text NOT NULL DEFAULT 'new',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT contact_submissions_status_check
        CHECK (status IN ('new', 'read', 'archived'))
);

-- Inbox is read newest-first.
CREATE INDEX idx_contact_submissions_created ON contact_submissions (created_at DESC);

-- RLS on, no policies: the table is reachable only via the service-role client
-- (lib/supabase/server.ts, which bypasses RLS). anon/authenticated clients get
-- nothing — contact messages must never be publicly readable.
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

/*
-- DOWN MIGRATION (Reversibility Note)
DROP TABLE IF EXISTS contact_submissions CASCADE;
*/
