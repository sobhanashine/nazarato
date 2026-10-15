import { afterEach, describe, expect, it } from "vitest";
import { testDatabase } from "../staging/test-database";
import { consumeLimit } from "../staging/database";
import { createOtpChallenge } from "./otp";
import { consumeStagingOtp, readStagingOtp, storeStagingOtp, verifyStagingOtp } from "./staging-otp";

const databases: ReturnType<typeof testDatabase>[] = [];
function database() { const db = testDatabase(); databases.push(db); return db; }
const challenge = () => createOtpChallenge({ phone: "+989120000000", code: "748215" });
afterEach(() => { databases.splice(0).forEach((db) => db.close()); });

describe("durable staging OTP", () => {
  it("locks after five wrong guesses even when the original cookie is replayed", async () => {
    const db = database(); const original = challenge();
    await storeStagingOtp(original, db);
    for (let i = 0; i < 5; i++) await verifyStagingOtp(original, "000000", db);
    expect((await verifyStagingOtp(original, "748215", db)).status).toBe("locked");
    expect((await readStagingOtp(original.id, db))?.attempts).toBe(5);
    expect(await consumeStagingOtp(original.id, db)).toBe(false);
  });
  it("verifies and consumes only once across concurrent requests", async () => {
    const db = database(); const original = challenge();
    await storeStagingOtp(original, db);
    const result = await Promise.all([verifyStagingOtp(original, "۷۴۸۲۱۵", db), verifyStagingOtp(original, "748215", db)]);
    expect(result.map((r) => r.status).sort()).toEqual(["already_verified", "verified"]);
    expect(await Promise.all([consumeStagingOtp(original.id, db), consumeStagingOtp(original.id, db)])).toEqual([true, false]);
    expect(await readStagingOtp(original.id, db)).toBeNull();
  });
  it("rejects expired and superseded challenges", async () => {
    const db = database(); const original = challenge();
    await storeStagingOtp(original, db);
    expect((await verifyStagingOtp(original, "748215", db, original.expiresAt)).status).toBe("expired");
    await storeStagingOtp(challenge(), db);
    expect(await readStagingOtp(original.id, db)).toBeNull();
  });
  it("enforces atomic rate and cooldown budgets across callers", async () => {
    const db = database(); const now = Date.now();
    expect(await consumeLimit(db, "sms:test", 2, 1000, 100, now)).toBe(true);
    expect(await consumeLimit(db, "sms:test", 2, 1000, 100, now + 50)).toBe(false);
    expect(await consumeLimit(db, "sms:test", 2, 1000, 100, now + 100)).toBe(true);
    expect(await consumeLimit(db, "sms:test", 2, 1000, 100, now + 200)).toBe(false);
    expect(await consumeLimit(db, "sms:test", 2, 1000, 100, now + 1000)).toBe(true);
  });
});
