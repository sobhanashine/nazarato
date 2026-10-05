// Reproducible fresh-schema/permissions/counter test in a new, owned cluster.
// Uses a unique Unix socket, never a linked Supabase URL or shared database.
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
const binary = name => process.env.PG_BIN ? join(process.env.PG_BIN,name) : name;
const scratch = mkdtempSync(join(tmpdir(),"nazarato-migration-test-"));
let started = false;
function run(name,args) { return execFileSync(binary(name),args,{encoding:"utf8",stdio:["ignore","pipe","pipe"]}); }
function sql(text) { const path=join(scratch,"check.sql");writeFileSync(path,text);return run("psql",["-h",scratch,"-d","postgres","-v","ON_ERROR_STOP=1","-f",path]); }
try {
  run("initdb",["-D",join(scratch,"data"),"-A","trust","--no-locale"]);
  run("pg_ctl",["-D",join(scratch,"data"),"-l",join(scratch,"server.log"),"-o",`-h '' -k ${scratch}`,"start"]);started=true;
  sql(`create role anon;create role authenticated;create role service_role bypassrls;
    create schema auth;create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
    create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;`);
  const migrations=readdirSync("supabase/migrations").filter(n=>n.endsWith(".sql")).sort();
  for (const migration of migrations) sql(readFileSync(join("supabase/migrations",migration),"utf8"));
  const profile={modelId:"nabz-real-evidence",modelVersion:"1.0.0",scenario:"date",weights:{taste:1/6,service:1/6,value:1/6,atmosphere:1/6,cleanliness:1/6,wait_time:1/6},evidenceCount:5,signalCount:0,updatedAt:"2026-10-06T12:00:00Z"};
  const user="10000000-0000-4000-8000-000000000900",user2="10000000-0000-4000-8000-000000000901",business="10000000-0000-4000-8000-000000000001";
  sql(`grant usage on schema public to anon,authenticated,service_role;grant all on all tables in schema public to service_role;grant select on public.businesses,public.reviews,public.review_votes,public.taste_profiles to anon,authenticated;
    insert into public.users(id,phone,display_name) values('${user}','+989000000001','isolated test'),('${user2}','+989000000002','isolated test');
    insert into public.businesses(id,slug,name,category_slug,initial,color) values('${business}','isolated','isolated','cafe','T','#20584B');
    insert into public.taste_profiles(user_id,model_id,model_version,dimension_weights) values('${user}','fictional-demo','0','{}');
    set role service_role;select public.save_real_taste_profile('${user}','${JSON.stringify(profile)}');reset role;
    do $$ begin if (select count(*) from public.taste_profiles where user_id='${user}')<>2 or (select count(*) from public.taste_profiles where user_id='${user}' and is_active)<>1 then raise exception 'taste transition/history';end if;end $$;
    insert into public.reviews(business_id,author_id,rating,body,status) values('${business}','${user}',5,'isolated unknown review','published');
    do $$ begin if (select review_count from public.businesses where id='${business}')<>0 then raise exception 'unknown review counted';end if;end $$;
    insert into public.reviews(business_id,author_id,rating,body,status,origin_kind) values('${business}','${user2}',4,'isolated first party review','published','first_party');
    do $$ begin if (select review_count from public.businesses where id='${business}')<>1 or (select rating_sum from public.businesses where id='${business}')<>4 then raise exception 'qualified counter';end if;end $$;
    update public.reviews set origin_kind='first_party' where author_id='${user}';
    do $$ begin if (select review_count from public.businesses where id='${business}')<>2 then raise exception 'origin transition';end if;end $$;
    update public.reviews set origin_kind='development_fixture' where author_id='${user}';
    do $$ begin if (select review_count from public.businesses where id='${business}')<>1 then raise exception 'fixture counter';end if;end $$;
    insert into public.review_votes(review_id,user_id) select id,'${user}' from public.reviews where author_id='${user2}';
    set role anon;do $$ begin if (select count(*) from public.businesses)<>0 or (select count(*) from public.reviews)<>0 or (select count(*) from public.review_votes)<>0 or (select count(*) from public.taste_profiles)<>0 then raise exception 'anonymous leak';end if;end $$;reset role;`);
  let denied=false;try{sql(`set role anon;select public.save_real_taste_profile('${user}','{}');`);}catch(error){denied=String(error.stderr).includes("permission denied for function");}if(!denied) throw new Error("anon RPC not denied");
  // Verify new rollback SQL in a transaction, then discard the rollback.
  const names=["20261006000300_add_review_origin_gate","20261006000200_close_direct_public_catalog_reads","20261006000100_add_owner_metric_version","20261006000000_create_real_taste_save"];
  sql("begin;"+names.map(n=>readFileSync(join("supabase/rollbacks",`${n}.down.sql`),"utf8")).join("\n")+"\nrollback;");
  process.stdout.write(`PASS: ${migrations.length} migrations; real taste history/privacy, origin counters, anon denial and four rollback scripts.\n`);
} finally {
  if(started) run("pg_ctl",["-D",join(scratch,"data"),"stop","-m","fast"]);
  rmSync(scratch,{recursive:true,force:true});
}
