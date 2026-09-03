import { describe, expect, it } from "vitest";
import { OtpSendRateLimiter } from "./otp-rate-limit";

describe("OtpSendRateLimiter", () => {
  it("enforces cooldown and a three-send rolling window", () => {
    const limiter = new OtpSendRateLimiter({
      cooldownMs: 60_000,
      windowMs: 15 * 60_000,
      maxSends: 3,
      maxEntries: 10,
    });

    expect(limiter.consume("phone-a", 0)).toEqual({ allowed: true });
    expect(limiter.consume("phone-a", 1_000)).toEqual({
      allowed: false,
      reason: "cooldown",
      retryAfterSeconds: 59,
    });
    expect(limiter.consume("phone-a", 60_000)).toEqual({ allowed: true });
    expect(limiter.consume("phone-a", 120_000)).toEqual({ allowed: true });
    expect(limiter.consume("phone-a", 180_000)).toEqual({
      allowed: false,
      reason: "window_limit",
      retryAfterSeconds: 720,
    });
    expect(limiter.consume("phone-a", 900_000)).toEqual({ allowed: true });
  });

  it("isolates keys and prunes stale entries when capacity is reached", () => {
    const limiter = new OtpSendRateLimiter({
      cooldownMs: 1_000,
      windowMs: 5_000,
      maxSends: 2,
      maxEntries: 1,
    });

    expect(limiter.consume("phone-a", 0).allowed).toBe(true);
    expect(limiter.consume("phone-b", 6_000).allowed).toBe(true);
    expect(limiter.size).toBe(1);
  });
});
