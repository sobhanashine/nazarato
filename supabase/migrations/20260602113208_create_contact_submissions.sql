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

CREATE INDEX idx_contact_submissions_created ON contact_submissions (created_at DESC);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;;
