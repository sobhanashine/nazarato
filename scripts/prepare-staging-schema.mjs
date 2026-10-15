// Input must be an inspected pg_dump --schema=public --schema-only --no-owner
// --no-privileges. This creates SQL for a NEW schema; it never connects remotely.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const [input, output] = process.argv.slice(2);
if (!input || !output) throw Error("Usage: node scripts/prepare-staging-schema.mjs <inspected-schema.sql> <output.sql>");
const source = readFileSync(input, "utf8");
if (!source.includes("CREATE SCHEMA public;") || !source.includes("CREATE TABLE public.businesses (") || /COPY .* FROM stdin|^INSERT INTO /m.test(source)) {
  throw Error("Expected an inspected schema-only application dump");
}
// pg_dump emits lowercase public for schema identifiers and quoted search paths.
// Rebind routines as well as tables/FKs; leaving a public reference is forbidden.
const clone = source.replace(/\bpublic\b/g, "nazarato_staging")
  .replace(/^SET transaction_timeout = 0;\n/m, "");
if (/\bpublic\./i.test(clone)) throw Error("Cross-schema reference in generated SQL");
const hardening = readFileSync("supabase/staging/202610160001_staging_boundary.sql", "utf8");
writeFileSync(output, `-- Original schema SHA256: ${createHash("sha256").update(source).digest("hex")}\nBEGIN;\n${clone}\n${hardening}\nCOMMIT;\n`, { mode: 0o600 });
console.log("Prepared isolated staging bootstrap; no database connection made.");
