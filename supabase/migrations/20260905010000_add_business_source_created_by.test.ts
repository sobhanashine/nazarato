import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("./20260905010000_add_business_source_created_by.sql", import.meta.url),
  "utf8",
);
const rollback = readFileSync(
  new URL(
    "../rollbacks/20260905010000_add_business_source_created_by.down.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("business source creator migration", () => {
  it("adds nullable creator attribution without changing publication status", () => {
    expect(migration).toMatch(
      /add column if not exists created_by uuid references public\.users\(id\) on delete set null/i,
    );
    expect(migration).not.toMatch(/update\s+public\.business_sources/i);
    expect(migration).not.toMatch(/status\s*=\s*'approved'/i);
  });

  it("has an explicit rollback", () => {
    expect(rollback).toContain("drop column if exists created_by");
  });
});
