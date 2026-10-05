import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = readFileSync(
  join(
    root,
    "supabase/migrations/20260905000000_create_business_source_review_events.sql",
  ),
  "utf8",
);
const rollback = readFileSync(
  join(
    root,
    "supabase/rollbacks/20260905000000_create_business_source_review_events.down.sql",
  ),
  "utf8",
);

describe("business source review event migration", () => {
  it("keeps review decisions append-only and separate from publication state", () => {
    expect(migration).toContain(
      "create table if not exists public.business_source_review_events",
    );
    expect(migration).toContain("criteria_snapshot");
    expect(migration).toMatch(
      /decision in \(\s*'unreviewed',\s*'needs_correction',\s*'ready_for_approval',\s*'rejected'\s*\)/,
    );
    expect(migration).not.toMatch(/update\s+public\.business_sources/i);
  });

  it("indexes the latest decision lookup and keeps browser access closed", () => {
    expect(migration).toContain(
      "idx_business_source_review_events_source_created",
    );
    expect(migration).toContain(
      "alter table public.business_source_review_events enable row level security",
    );
    expect(migration).not.toMatch(
      /create policy[\s\S]+on public\.business_source_review_events/i,
    );
  });

  it("has a real reversible rollback", () => {
    expect(rollback).toContain(
      "drop table if exists public.business_source_review_events",
    );
  });
});
