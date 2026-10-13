import { describe, expect, it } from "vitest";
import {
  inspectClaimProof,
  validateClaimContactPhone,
  validateClaimEmail,
} from "./claim-validation";

function proof(bytes: number[], type: string, name: string): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("claim boundary validation", () => {
  it("normalizes Iranian contact phones and rejects arbitrary text", () => {
    expect(validateClaimContactPhone("۰۹۱۲ ۱۲۳ ۴۵۶۷")).toEqual({
      ok: true,
      phone: "+989121234567",
    });
    expect(validateClaimContactPhone("12345678")).toEqual({
      ok: false,
      error: "شماره تماس معتبر نیست.",
    });
  });

  it("bounds and normalizes a work email", () => {
    expect(validateClaimEmail(" Owner@Example.IR ")).toEqual({
      ok: true,
      email: "owner@example.ir",
    });
    expect(validateClaimEmail(`a@${"x".repeat(250)}.ir`).ok).toBe(false);
  });

  it("accepts matching JPEG, PNG, WebP, and PDF signatures", async () => {
    const cases = [
      [proof([0xff, 0xd8, 0xff, 0x00], "image/jpeg", "fake.exe"), "jpg"],
      [proof([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "image/png", "a.png"), "png"],
      [proof([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50], "image/webp", "a.webp"), "webp"],
      [proof([0x25, 0x50, 0x44, 0x46, 0x2d], "application/pdf", "a.pdf"), "pdf"],
    ] as const;

    for (const [file, extension] of cases) {
      const result = await inspectClaimProof(file);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.extension).toBe(extension);
    }
  });

  it("rejects a spoofed MIME type and an oversized file", async () => {
    expect(
      await inspectClaimProof(proof([0x4d, 0x5a], "application/pdf", "malware.pdf")),
    ).toEqual({
      ok: false,
      error: "محتوای فایل با نوع اعلام‌شده هم‌خوانی ندارد.",
    });

    const oversized = new File(
      [new Uint8Array(5 * 1024 * 1024 + 1)],
      "large.pdf",
      { type: "application/pdf" },
    );
    expect((await inspectClaimProof(oversized)).ok).toBe(false);
  });
});
