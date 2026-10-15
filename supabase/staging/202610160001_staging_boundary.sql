-- Only run after creating NEW nazarato_staging tables/routines from the reviewed
-- schema-only dump. This file is deliberately outside public migration history.
-- No production data, roles, ownership or source approval is changed.

ALTER TABLE nazarato_staging.business_sources
  DROP CONSTRAINT business_sources_source_type_check,
  ADD CONSTRAINT business_sources_source_type_check CHECK (source_type IN (
    'owner_submission','manual_public_facts','open_dataset','written_permission',
    'development_fixture','internal_preview'
  )),
  DROP CONSTRAINT ck_business_sources_permission_status,
  ADD CONSTRAINT ck_business_sources_permission_status CHECK (
    permission_basis <> 'unknown' OR status = 'quarantined' OR (
      source_type = 'internal_preview' AND status = 'approved'
      AND (field_payload->>'usage_scope') IS NOT DISTINCT FROM 'staging_only'
      AND (field_payload->>'publication_status') IS NOT DISTINCT FROM 'not_approved'
    )
  );

COMMENT ON SCHEMA nazarato_staging IS
  'Nazarato staging only. Internal candidate use is not production publication or owner verification.';
REVOKE ALL ON SCHEMA nazarato_staging FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA nazarato_staging FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA nazarato_staging FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA nazarato_staging FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA nazarato_staging TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA nazarato_staging TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA nazarato_staging TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA nazarato_staging TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA nazarato_staging REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Upload paths are isolated too; no existing bucket definition is updated.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES
  ('claim-proofs-staging','claim-proofs-staging',false,5242880,ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('business-photos-staging','business-photos-staging',true,5242880,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT(id) DO NOTHING;
