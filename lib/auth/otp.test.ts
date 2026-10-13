import { describe, expect, it } from "vitest";
import {
  createOtpChallenge,
  createOtpCode,
  createOtpDeliveryProvider,
  getOtpResendWaitSeconds,
  verifyOtpChallenge,
} from "./otp";

const PHONE = "+989121234567";
const SECRET = "test-secret-that-is-at-least-32-characters-long";

describe("OTP challenge", () => {
  it("stores a keyed digest instead of the six-digit code", () => {
    const challenge = createOtpChallenge({
      phone: PHONE,
      code: "123456",
      now: 1_000,
      challengeId: "11111111-1111-4111-8111-111111111111",
      secret: SECRET,
    });

    expect(challenge.codeDigest).not.toContain("123456");
    expect(challenge).not.toHaveProperty("code");
    expect(challenge.expiresAt).toBe(301_000);
    expect(challenge.resendAvailableAt).toBe(61_000);
    expect(challenge.attempts).toBe(0);
  });

  it("increments signed challenge attempts and locks after five failures", () => {
    let challenge = createOtpChallenge({
      phone: PHONE,
      code: "123456",
      now: 1_000,
      challengeId: "11111111-1111-4111-8111-111111111111",
      secret: SECRET,
    });

    for (let attempts = 1; attempts <= 5; attempts += 1) {
      const result = verifyOtpChallenge({
        challenge,
        code: "654321",
        now: 2_000,
        secret: SECRET,
      });
      challenge = result.challenge;
      expect(challenge.attempts).toBe(attempts);
      expect(result.status).toBe(attempts === 5 ? "locked" : "incorrect");
    }

    expect(
      verifyOtpChallenge({
        challenge,
        code: "123456",
        now: 2_000,
        secret: SECRET,
      }).status,
    ).toBe("locked");
  });

  it("expires explicitly and rejects replay after successful verification", () => {
    const challenge = createOtpChallenge({
      phone: PHONE,
      code: "123456",
      now: 1_000,
      challengeId: "11111111-1111-4111-8111-111111111111",
      secret: SECRET,
    });

    expect(
      verifyOtpChallenge({
        challenge,
        code: "123456",
        now: challenge.expiresAt,
        secret: SECRET,
      }).status,
    ).toBe("expired");

    const verified = verifyOtpChallenge({
      challenge,
      code: "123456",
      now: 2_000,
      secret: SECRET,
    });
    expect(verified.status).toBe("verified");
    expect(verified.challenge.verifiedAt).toBe(2_000);
    expect(
      verifyOtpChallenge({
        challenge: verified.challenge,
        code: "123456",
        now: 3_000,
        secret: SECRET,
      }).status,
    ).toBe("already_verified");
  });

  it("reports the remaining resend cooldown without rounding down", () => {
    const challenge = createOtpChallenge({
      phone: PHONE,
      code: "123456",
      now: 1_000,
      challengeId: "11111111-1111-4111-8111-111111111111",
      secret: SECRET,
    });

    expect(getOtpResendWaitSeconds(challenge, 1_001)).toBe(60);
    expect(getOtpResendWaitSeconds(challenge, 61_000)).toBe(0);
  });
});

describe("OTP delivery", () => {
  it("uses the visible fixed code only outside production", () => {
    expect(createOtpCode({ NODE_ENV: "development" })).toBe("123456");
    expect(
      createOtpCode(
        { NODE_ENV: "production" },
        () => 42,
      ),
    ).toBe("000042");
  });

  it("fails closed in production when Kavenegar credentials are absent", () => {
    expect(() =>
      createOtpDeliveryProvider({ NODE_ENV: "production" }),
    ).toThrow(/KAVENEGAR_API_KEY/);
  });

  it("sends a URL-encoded Kavenegar verify request without logging the code", async () => {
    let capturedUrl: string | URL | Request | undefined;
    let capturedInit: RequestInit | undefined;
    const fetcher: typeof fetch = async (url, init) => {
      capturedUrl = url;
      capturedInit = init;
      return new Response(
        JSON.stringify({
          return: { status: 200, message: "تایید شد" },
          entries: [{ messageid: 1, status: 1 }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };
    const provider = createOtpDeliveryProvider(
      {
        NODE_ENV: "production",
        KAVENEGAR_API_KEY: "secret-api-key",
        KAVENEGAR_TEMPLATE: "NazaratoLogin",
      },
      fetcher,
    );

    await provider.send({ phone: PHONE, code: "123456" });

    expect(String(capturedUrl)).toContain("/verify/lookup.json");
    expect(capturedInit?.method).toBe("POST");
    expect(String(capturedInit?.body)).toContain("receptor=09121234567");
    expect(String(capturedInit?.body)).toContain("token=123456");
    expect(String(capturedInit?.body)).toContain("template=NazaratoLogin");
  });
});
