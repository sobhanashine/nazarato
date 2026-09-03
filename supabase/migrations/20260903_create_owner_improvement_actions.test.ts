import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = readFileSync(
  join(root, "supabase/migrations/20260903_create_owner_improvement_actions.sql"),
  "utf8",
);
const rollback = readFileSync(
  join(root, "supabase/rollbacks/20260903_create_owner_improvement_actions.down.sql"),
  "utf8",
);

describe("owner improvement action migration", () => {
  it("stores a versioned baseline and a measurable follow-up target", () => {
    expect(migration).toContain("create table if not exists public.business_improvement_actions");
    expect(migration).toContain("baseline_review_count");
    expect(migration).toContain("baseline_negative_rate");
    expect(migration).toContain("target_negative_rate");
    expect(migration).toContain("follow_up_date");
    expect(migration).toContain("follow_up_negative_rate");
    expect(migration).toContain("measured_at");
    expect(migration).toContain("model_version");
  });

  it("permits only one active action per business", () => {
    expect(migration).toContain("uq_business_improvement_actions_active");
    expect(migration).toMatch(/where status in \('planned', 'active'\)/);
  });

  it("keeps action data behind the service-role boundary", () => {
    expect(migration).toContain(
      "alter table public.business_improvement_actions enable row level security",
    );
    expect(migration).not.toMatch(
      /create policy[\s\S]+on public\.business_improvement_actions/i,
    );
  });

  it("has a reversible rollback", () => {
    expect(rollback).toContain(
      "drop table if exists public.business_improvement_actions",
    );
  });
});
