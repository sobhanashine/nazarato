import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("./20260903_harden_claim_otp_security.sql", import.meta.url),
  "utf8",
);
const rollback = readFileSync(
  new URL(
    "../rollbacks/20260903_harden_claim_otp_security.down.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("claim and OTP hardening migration", () => {
  it("requires verified ownership before claim approval", () => {
    expect(migration).toContain("verification_status");
    expect(migration).toContain("business_claims_approved_is_verified");
    expect(migration).toContain("status <> 'approved'");
    expect(migration).toContain("verification_status = 'verified'");
  });

  it("creates a private append-only audit trail", () => {
    expect(migration).toContain(
      "create table if not exists public.security_audit_events",
    );
    expect(migration).toContain(
      "alter table public.security_audit_events enable row level security",
    );
    expect(migration).not.toMatch(
      /create policy[\s\S]+on public\.security_audit_events/i,
    );
    expect(migration).toContain("tr_audit_business_claim_change");
    expect(migration).toContain("after insert or update of status");
  });

  it("has an explicit rollback", () => {
    expect(rollback).toContain(
      "drop constraint if exists business_claims_approved_is_verified",
    );
    expect(rollback).toContain(
      "drop table if exists public.security_audit_events",
    );
    expect(rollback).toContain("drop function if exists public.audit_business_claim_change");
    expect(rollback).toContain("drop column if exists verification_status");
  });
});
