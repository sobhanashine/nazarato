// Generates a reviewed, transactional staging-only COPY/import. Never connects.
import { readFileSync, writeFileSync } from "node:fs";
import { prepareStagingGolsar } from "../lib/import/staging-golsar.ts";
const [input, output] = process.argv.slice(2);
if (!input || !output) throw Error("Usage: node scripts/prepare-staging-golsar.mts <private-snapshot.json> <private-output.sql>");
const rows = prepareStagingGolsar(JSON.parse(readFileSync(input, "utf8")));
if (rows.length !== 22) throw Error("This reviewed import requires exactly the 22 selected cafes");
const copy = rows.map(row => `"${JSON.stringify(row).replaceAll('"', '""')}"`).join("\n");
const sql = `BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE TEMP TABLE staging_golsar_import (payload jsonb) ON COMMIT DROP;
COPY staging_golsar_import(payload) FROM STDIN WITH (FORMAT csv);
${copy}
\\.
DO $$ BEGIN
  IF (SELECT count(*) FROM staging_golsar_import) <> 22 THEN RAISE EXCEPTION 'Wrong cafe count'; END IF;
  IF EXISTS (
    SELECT 1 FROM staging_golsar_import i JOIN nazarato_staging.business_sources s ON s.id = (i.payload->>'id')::uuid
    WHERE s.payload_hash <> i.payload->>'payload_hash' OR s.source_type <> 'internal_preview'
  ) THEN RAISE EXCEPTION 'Existing source differs; reconcile before import'; END IF;
END $$;
INSERT INTO nazarato_staging.businesses
 (id,slug,name,type,category_slug,city,description,initial,color,contact,info,latitude,longitude,created_at)
SELECT (payload->>'id')::uuid,payload->>'slug',payload->>'name','company','cafe','رشت',
 payload->>'description',payload->>'initial',payload->>'color',payload->'contact',payload->'info',
 (payload->>'latitude')::numeric,(payload->>'longitude')::numeric,
 now() - ((payload->>'priority')::integer * interval '1 second')
FROM staging_golsar_import ON CONFLICT(id) DO NOTHING;
INSERT INTO nazarato_staging.business_sources
 (id,business_id,source_type,source_ref,permission_basis,field_payload,payload_hash,captured_at,status)
SELECT (payload->>'id')::uuid,(payload->>'id')::uuid,'internal_preview',payload->>'source_ref','unknown',
 payload->'field_payload',payload->>'payload_hash',(payload->>'captured_at')::timestamptz,'approved'
FROM staging_golsar_import ON CONFLICT(id) DO NOTHING;
DO $$ BEGIN
 IF (SELECT count(*) FROM nazarato_staging.business_sources s JOIN staging_golsar_import i ON s.id=(i.payload->>'id')::uuid) <> 22
 THEN RAISE EXCEPTION 'Incomplete staging import'; END IF;
END $$;
COMMIT;
`;
writeFileSync(output, sql, { mode: 0o600 });
console.log(JSON.stringify({ prepared: rows.length, schema: "nazarato_staging", importedOpinions: 0, databaseWrites: 0 }));
