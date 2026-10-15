-- Disable staging traffic / point to its previous release first. Export the
-- namespace before rollback: future real staging submissions must not be lost.
-- This guard prevents removal of any populated user state. Restore from the
-- task-specific backup if explicitly approving removal after real usage.
-- FIRST remove only nazarato_staging from authenticator's pgrst.db_schemas,
-- notify pgrst to reload config, and verify public REST still responds while
-- the removed schema returns 406. Dropping an exposed schema can break REST.
BEGIN;
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_roles r, unnest(r.rolconfig) setting
    WHERE r.rolname='authenticator' AND setting LIKE 'pgrst.db_schemas=%'
      AND 'nazarato_staging' = ANY(regexp_split_to_array(split_part(setting,'=',2), '\s*,\s*'))
  ) THEN RAISE EXCEPTION 'Remove nazarato_staging from REST exposure and verify reload before rollback'; END IF;
  IF EXISTS (SELECT 1 FROM nazarato_staging.users)
     OR EXISTS (SELECT 1 FROM nazarato_staging.comparison_votes)
     OR EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id IN ('claim-proofs-staging','business-photos-staging'))
  THEN RAISE EXCEPTION 'Staging has user data; export and review before rollback'; END IF;
END $$;
DROP SCHEMA nazarato_staging CASCADE;
DELETE FROM storage.buckets WHERE id IN ('claim-proofs-staging','business-photos-staging');
COMMIT;
