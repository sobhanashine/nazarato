import { describe, expect, it } from "vitest";
import { buildSmflowIdentity, getSmflowConfig } from "./smflow";

describe("getSmflowConfig", () => {
  // process.env mutations affect later tests if not restored — vitest's afterEach
  // helper isn't needed because we explicitly set each value at the top of every it.
  it("returns null when the kill switch is off", () => {
    process.env.NEXT_PUBLIC_SMFLOW_ENABLED = "false";
    process.env.NEXT_PUBLIC_SMFLOW_BUSINESS_ID = "x";
    process.env.SMFLOW_WIDGET_SECRET = "y";
    expect(getSmflowConfig()).toBeNull();
  });

  it("returns null when the kill switch is missing", () => {
    delete process.env.NEXT_PUBLIC_SMFLOW_ENABLED;
    process.env.NEXT_PUBLIC_SMFLOW_BUSINESS_ID = "x";
    process.env.SMFLOW_WIDGET_SECRET = "y";
    expect(getSmflowConfig()).toBeNull();
  });

  it("returns null when business id is missing even if enabled", () => {
    process.env.NEXT_PUBLIC_SMFLOW_ENABLED = "true";
    delete process.env.NEXT_PUBLIC_SMFLOW_BUSINESS_ID;
    process.env.SMFLOW_WIDGET_SECRET = "y";
    expect(getSmflowConfig()).toBeNull();
  });

  it("returns null when secret is missing even if enabled", () => {
    process.env.NEXT_PUBLIC_SMFLOW_ENABLED = "true";
    process.env.NEXT_PUBLIC_SMFLOW_BUSINESS_ID = "x";
    delete process.env.SMFLOW_WIDGET_SECRET;
    expect(getSmflowConfig()).toBeNull();
  });

  it("returns the config when fully enabled", () => {
    process.env.NEXT_PUBLIC_SMFLOW_ENABLED = "true";
    process.env.NEXT_PUBLIC_SMFLOW_BUSINESS_ID = "biz-1";
    process.env.SMFLOW_WIDGET_SECRET = "super-secret";
    expect(getSmflowConfig()).toEqual({
      businessId: "biz-1",
      secret: "super-secret",
    });
  });

  it("treats any value other than 'true' as off", () => {
    process.env.NEXT_PUBLIC_SMFLOW_BUSINESS_ID = "x";
    process.env.SMFLOW_WIDGET_SECRET = "y";
    for (const v of ["TRUE", "1", "yes", "on", "True"]) {
      process.env.NEXT_PUBLIC_SMFLOW_ENABLED = v;
      expect(getSmflowConfig(), `value=${v}`).toBeNull();
    }
  });
});

describe("buildSmflowIdentity", () => {
  it("produces deterministic email + hex hash", () => {
    const got = buildSmflowIdentity(
      { id: "user-123", name: "Sobhan" },
      "secret-shh",
    );
    expect(got.email).toBe("user-123@users.nazarato.ir");
    expect(got.name).toBe("Sobhan");
    // 64 lowercase hex chars = HMAC-SHA256 in hex.
    expect(got.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is stable across calls for the same input", () => {
    const a = buildSmflowIdentity({ id: "u", name: "n" }, "s");
    const b = buildSmflowIdentity({ id: "u", name: "n" }, "s");
    expect(a.hash).toBe(b.hash);
  });

  it("changes hash when secret rotates", () => {
    const a = buildSmflowIdentity({ id: "u", name: "n" }, "s1");
    const b = buildSmflowIdentity({ id: "u", name: "n" }, "s2");
    expect(a.hash).not.toBe(b.hash);
  });
});
