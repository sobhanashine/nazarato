import { describe, expect, it } from "vitest";
import { isLoginEnabled } from "./login-policy";

const staging = { NODE_ENV: "production", NAZARATO_DEPLOYMENT_ENV: "staging", NAZARATO_SMS_ENABLED: "true", KAVENEGAR_API_KEY: "provider-key", KAVENEGAR_TEMPLATE: "Login", JWT_SECRET: "s".repeat(40) };
describe("staging login activation", () => {
  it("requires explicit staging and real provider configuration", () => {
    expect(isLoginEnabled(staging)).toBe(true);
    for (const key of ["NAZARATO_SMS_ENABLED", "KAVENEGAR_API_KEY", "KAVENEGAR_TEMPLATE", "JWT_SECRET"]) {
      expect(isLoginEnabled({ ...staging, [key]: "" })).toBe(false);
    }
  });
  it("keeps production closed and never uses local OTP on staging", () => {
    expect(isLoginEnabled({ ...staging, NAZARATO_DEPLOYMENT_ENV: "production" })).toBe(false);
    expect(isLoginEnabled({ NODE_ENV: "development", NAZARATO_DEPLOYMENT_ENV: "staging" })).toBe(false);
    expect(isLoginEnabled({ NODE_ENV: "development" })).toBe(true);
  });
});
