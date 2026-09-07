import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260907150000_create_osm_publication_approval.sql",
  "utf8",
);
const rollback = readFileSync(
  "supabase/rollbacks/20260907150000_create_osm_publication_approval.down.sql",
  "utf8",
);

describe("OSM publication approval migration", () => {
  it("creates private append-only evidence for per-source approvals", () => {
    expect(migration).toContain(
      "create table if not exists public.business_source_publication_events",
    );
    expect(migration).toContain(
      "constraint uq_business_source_publication_events_source unique (source_id)",
    );
    expect(migration).toContain(
      "before update or delete on public.business_source_publication_events",
    );
    expect(migration).toContain(
      "alter table public.business_source_publication_events enable row level security",
    );
    expect(migration).not.toMatch(
      /create policy[\s\S]+business_source_publication_events/i,
    );
  });

  it("locks one source and business and validates human plus machine evidence", () => {
    expect(migration).toContain("for update of s, b");
    expect(migration).toContain("latest_review.decision <> 'ready_for_approval'");
    expect(migration).toContain("nazarato-osm-prescreen/0.1.0");
    expect(migration).toContain("low_risk_review");
    expect(migration).toContain("ODbL-1.0");
    expect(migration).toContain("publication source identity mismatch");
    expect(migration).toContain("publication current prescreen inputs invalid");
    expect(migration).toContain("is distinct from target.business_slug");
    expect(migration).toContain("is distinct from 'true'::jsonb");
    expect(migration).toContain("target.latitude < 37.22");
    expect(migration).toContain("target.longitude > 49.69");
    expect(migration).toContain("target.source_ref <> 'https://www.openstreetmap.org/'");
  });

  it("writes the audit event and both publication states inside one function", () => {
    expect(migration).toMatch(
      /insert into public\.business_source_publication_events[\s\S]+update public\.business_sources[\s\S]+update public\.businesses/,
    );
    expect(migration).toContain("set status = 'approved'");
    expect(migration).toContain("set status = 'active'");
    expect(migration).toContain("'noAction', true");
  });

  it("exposes the RPC only to the service role and has a real rollback", () => {
    expect(migration).toMatch(
      /revoke all on function public\.approve_osm_business_source_for_publication[\s\S]+from public, anon, authenticated/,
    );
    expect(migration).toContain("to service_role");
    expect(migration).toContain(
      "revoke all on table public.business_source_publication_events",
    );
    expect(rollback).toContain(
      "drop function if exists public.approve_osm_business_source_for_publication",
    );
    expect(rollback).toContain(
      "drop table if exists public.business_source_publication_events",
    );
  });
});
