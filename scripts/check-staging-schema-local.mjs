// Own disposable cluster only. Accepts prepared private artifacts, never a URL.
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
const [source, bootstrap, imports] = process.argv.slice(2);
if (!source || !bootstrap || !imports || !process.env.PG_BIN) throw Error("PG_BIN and three prepared SQL files required");
const scratch=mkdtempSync(join(tmpdir(),"nazarato-staging-sql-"));
const binary=name=>join(process.env.PG_BIN,name);
const run=(name,args,input)=>execFileSync(binary(name),args,{input,encoding:"utf8",stdio:["pipe","pipe","pipe"]});
const sql=input=>run("psql",["-X","-h",scratch,"-d","postgres","-v","ON_ERROR_STOP=1"],input);
let started=false;
try {
  run("initdb",["-D",join(scratch,"db"),"-A","trust","--no-locale"]);
  run("pg_ctl",["-D",join(scratch,"db"),"-l",join(scratch,"log"),"-o",`-h '' -k ${scratch}`,"start"]); started=true;
  sql(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE ROLE authenticator;
    CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$;
    CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    CREATE TABLE storage.objects(id uuid,bucket_id text);
    DROP SCHEMA public;`);
  sql(readFileSync(source,"utf8").replace(/^SET transaction_timeout = 0;\n/m,""));
  sql(`INSERT INTO public.users(id,phone,display_name) VALUES('10000000-0000-4000-8000-000000000901','+989000000001','local sentinel');
    INSERT INTO public.businesses(id,slug,name,category_slug,initial,color) VALUES('10000000-0000-4000-8000-000000000902','sentinel','sentinel','cafe','T','#20584B');`);
  sql(readFileSync(bootstrap,"utf8"));
  sql(readFileSync(imports,"utf8"));
  sql(readFileSync(imports,"utf8")); // Must not duplicate or overwrite.
  sql(`DO $$ BEGIN
    IF (SELECT count(*) FROM nazarato_staging.businesses)<>22 OR (SELECT count(*) FROM nazarato_staging.business_sources)<>22 THEN RAISE EXCEPTION 'idempotence'; END IF;
    IF EXISTS(SELECT 1 FROM pg_constraint c JOIN pg_class r ON r.oid=c.confrelid WHERE c.connamespace='nazarato_staging'::regnamespace AND r.relnamespace<>'nazarato_staging'::regnamespace) THEN RAISE EXCEPTION 'cross-schema FK'; END IF;
    IF EXISTS(SELECT 1 FROM pg_proc WHERE pronamespace='nazarato_staging'::regnamespace AND (prosrc LIKE '%public.%' OR array_to_string(proconfig,',') LIKE '%public%')) THEN RAISE EXCEPTION 'cross-schema routine'; END IF;
    IF has_schema_privilege('anon','nazarato_staging','USAGE') OR has_schema_privilege('authenticated','nazarato_staging','USAGE') THEN RAISE EXCEPTION 'client schema access'; END IF;
  END $$;
  SET ROLE service_role;
  INSERT INTO nazarato_staging.users(id,phone,display_name) VALUES('10000000-0000-4000-8000-000000000903','+989000000003','isolated SQL test');
  INSERT INTO nazarato_staging.reviews(id,business_id,author_id,rating,body,status,origin_kind)
    SELECT '10000000-0000-4000-8000-000000000904',id,'10000000-0000-4000-8000-000000000903',4,'isolated local SQL check','published','first_party' FROM nazarato_staging.businesses LIMIT 1;
  INSERT INTO nazarato_staging.bookmarks(user_id,business_id) SELECT '10000000-0000-4000-8000-000000000903',business_id FROM nazarato_staging.reviews;
  SELECT nazarato_staging.save_real_taste_profile('10000000-0000-4000-8000-000000000903','{"modelId":"nabz-real-evidence","modelVersion":"1.0.0","scenario":"date","weights":{"taste":0.2,"service":0.2,"value":0.2,"atmosphere":0.2,"cleanliness":0.1,"wait_time":0.1},"evidenceCount":5,"signalCount":0,"updatedAt":"2026-10-16T00:00:00Z"}');
  RESET ROLE;
  DO $$ BEGIN
    IF (SELECT sum(review_count) FROM nazarato_staging.businesses)<>1 THEN RAISE EXCEPTION 'staging counter trigger'; END IF;
    IF (SELECT count(*) FROM public.businesses)<>1 OR (SELECT sum(review_count) FROM public.businesses)<>0 OR (SELECT count(*) FROM public.users)<>1 OR EXISTS(SELECT 1 FROM public.reviews) THEN RAISE EXCEPTION 'production data changed'; END IF;
    IF (SELECT count(*) FROM nazarato_staging.taste_profiles)<>1 THEN RAISE EXCEPTION 'staging RPC'; END IF;
  END $$;`);
  let denied=false;
  try { sql("SET ROLE anon; SELECT * FROM nazarato_staging.businesses;"); } catch { denied=true; }
  if(!denied) throw Error("anonymous schema read unexpectedly succeeded");
  let guarded=false;
  try { sql(readFileSync(resolve("supabase/staging/rollback.sql"),"utf8")); } catch { guarded=true; }
  if(!guarded) throw Error("rollback accepted populated staging");
  sql("DELETE FROM nazarato_staging.users WHERE id='10000000-0000-4000-8000-000000000903';");
  sql("ALTER ROLE authenticator SET pgrst.db_schemas='public,graphql_public,nazarato_staging';");
  let exposureGuarded=false;
  try { sql(readFileSync(resolve("supabase/staging/rollback.sql"),"utf8")); } catch { exposureGuarded=true; }
  if(!exposureGuarded) throw Error("rollback accepted an exposed schema");
  sql("ALTER ROLE authenticator SET pgrst.db_schemas='public,graphql_public';");
  sql(readFileSync(resolve("supabase/staging/rollback.sql"),"utf8"));
  console.log("PASS: 22-cafe import/reimport, FK/routine isolation, service-only access, review counters, bookmarks, taste RPC, unchanged production sentinel, guarded rollback.");
} catch(error) {
  // SQL may contain private factual source rows; print only the database error.
  const message=String(error.stderr??error.message).split("\n").filter(l=>/^ERROR:|^DETAIL:|^CONTEXT:/.test(l)).join("\n");
  console.error(message||"Local staging schema test failed");process.exitCode=1;
} finally {
  if(started)run("pg_ctl",["-D",join(scratch,"db"),"stop","-m","fast"]);
  rmSync(scratch,{recursive:true,force:true});
}
