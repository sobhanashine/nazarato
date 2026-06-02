import { describe, expect, it } from "vitest";
import { validateContactInput } from "./validation";

const valid = {
  name: "علی رضایی",
  email: "ali@example.com",
  subject: "سلام",
  message: "این یک پیام آزمایشی با طول کافی است.",
};

describe("validateContactInput", () => {
  it("accepts a well-formed submission and trims fields", () => {
    const r = validateContactInput({
      name: "  علی  ",
      email: " ali@example.com ",
      subject: " سلام ",
      message: "  این یک پیام آزمایشی است.  ",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.name).toBe("علی");
      expect(r.value.email).toBe("ali@example.com");
      expect(r.value.subject).toBe("سلام");
      expect(r.value.message).toBe("این یک پیام آزمایشی است.");
    }
  });

  it("allows an empty subject (optional field)", () => {
    const r = validateContactInput({ ...valid, subject: "" });
    expect(r.ok).toBe(true);
  });

  it.each([
    ["non-object input", "nope"],
    ["null", null],
    ["missing fields", {}],
  ])("rejects %s", (_label, raw) => {
    expect(validateContactInput(raw).ok).toBe(false);
  });

  it("rejects a too-short name", () => {
    expect(validateContactInput({ ...valid, name: "ا" }).ok).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(validateContactInput({ ...valid, email: "not-an-email" }).ok).toBe(
      false,
    );
  });

  it("rejects an over-long subject", () => {
    expect(
      validateContactInput({ ...valid, subject: "x".repeat(121) }).ok,
    ).toBe(false);
  });

  it("rejects a too-short message", () => {
    expect(validateContactInput({ ...valid, message: "کوتاه" }).ok).toBe(false);
  });

  it("rejects an over-long message", () => {
    expect(
      validateContactInput({ ...valid, message: "x".repeat(2001) }).ok,
    ).toBe(false);
  });
});
