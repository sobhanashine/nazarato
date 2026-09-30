import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOtpChallenge: vi.fn(async () => ({ phone: "+989000000001", verified: true })),
  setOtpChallenge: vi.fn(),
  clearOtpChallenge: vi.fn(),
  setSession: vi.fn(),
  sendOtp: vi.fn(),
  getUserByPhone: vi.fn(async () => ({ id: "user", phone: "+989000000001", display_name: "آزمایش", is_banned: false })),
  createUser: vi.fn(),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({
  getOtpChallenge: mocks.getOtpChallenge,
  setOtpChallenge: mocks.setOtpChallenge,
  clearOtpChallenge: mocks.clearOtpChallenge,
  setSession: mocks.setSession,
}));
vi.mock("@/lib/data/users", () => ({ getUserByPhone: mocks.getUserByPhone, createUser: mocks.createUser }));
vi.mock("@/lib/auth/otp", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth/otp")>()),
  sendOtp: mocks.sendOtp,
}));

import { completeProfile, resendOtp, startOtp, verifyOtp } from "./actions";

describe("development OTP boundary", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllEnvs());

  it.each([startOtp, resendOtp, verifyOtp, completeProfile])(
    "rejects every production entry point before reading cookies or accessing accounts",
    async (action) => {
      vi.stubEnv("NODE_ENV", "production");
      const form = new FormData();
      form.set("phone", "09000000001");
      form.set("terms", "on");
      form.set("code", "123456");
      form.set("name", "آزمایش");
      const result = await action({ ok: false }, form);
      expect(result.ok).toBe(false);
      expect(result.error).toContain("ورود");
      for (const mock of Object.values(mocks)) expect(mock).not.toHaveBeenCalled();
    },
  );

  it("preserves the development verification flow", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const form = new FormData();
    form.set("code", "123456");
    expect(await verifyOtp({ ok: false }, form)).toEqual({ ok: true, redirectUrl: "/" });
    expect(mocks.setSession).toHaveBeenCalledOnce();
  });
});
