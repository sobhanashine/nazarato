import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
describe("private real profile transition",()=>{
  it("serializes model changes and restricts execution to the service role",()=>{const sql=readFileSync(new URL("./20261006000000_create_real_taste_save.sql",import.meta.url),"utf8");expect(sql).toContain("pg_advisory_xact_lock");expect(sql).toContain("revoke all on function public.save_real_taste_profile(uuid,jsonb) from public,anon,authenticated");expect(sql).toContain("where user_id = p_user_id");expect(sql).toContain("on conflict(user_id,model_id,model_version)");});
});
