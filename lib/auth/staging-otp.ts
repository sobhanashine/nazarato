import { createOtpChallenge, OTP_MAX_ATTEMPTS, toEnglishDigits, type OtpChallenge, type OtpVerificationResult } from "./otp";
import { stagingDatabase, type StagingDatabase } from "../staging/database";

type Row = { id: string; phone: string; code_digest: string; issued_at: number; expires_at: number; resend_available_at: number; attempts: number; delivery_count: number; verified_at: number | null; consumed_at: number | null };
function challenge(row: Row): OtpChallenge {
  return { id: row.id, phone: row.phone, codeDigest: row.code_digest, issuedAt: row.issued_at, expiresAt: row.expires_at, resendAvailableAt: row.resend_available_at, attempts: row.attempts, deliveryCount: row.delivery_count, verifiedAt: row.verified_at };
}

export async function storeStagingOtp(value: OtpChallenge, db?: StagingDatabase): Promise<void> {
  db ??= await stagingDatabase();
  await db.batch([
    db.prepare("DELETE FROM otp_challenges WHERE expires_at < ?").bind(Date.now()),
    db.prepare("DELETE FROM rate_limits WHERE last_used_at < ?").bind(Date.now() - 86_400_000),
    db.prepare(`INSERT INTO otp_challenges (id,phone,code_digest,issued_at,expires_at,resend_available_at,attempts,delivery_count,verified_at)
      VALUES (?,?,?,?,?,?,?,?,NULL) ON CONFLICT(phone) DO UPDATE SET id=excluded.id,code_digest=excluded.code_digest,
      issued_at=excluded.issued_at,expires_at=excluded.expires_at,resend_available_at=excluded.resend_available_at,
      attempts=excluded.attempts,delivery_count=excluded.delivery_count,verified_at=NULL,consumed_at=NULL`)
      .bind(value.id,value.phone,value.codeDigest,value.issuedAt,value.expiresAt,value.resendAvailableAt,value.attempts,value.deliveryCount),
  ]);
}

export async function readStagingOtp(id: string, db?: StagingDatabase, now = Date.now()): Promise<OtpChallenge | null> {
  db ??= await stagingDatabase();
  const row = await db.prepare("SELECT * FROM otp_challenges WHERE id=? AND expires_at>? AND consumed_at IS NULL").bind(id, now).first<Row>();
  return row ? challenge(row) : null;
}

export async function verifyStagingOtp(value: OtpChallenge, input: string, db?: StagingDatabase, now = Date.now()): Promise<OtpVerificationResult> {
  db ??= await stagingDatabase();
  const code = toEnglishDigits(input).trim();
  if (!/^\d{6}$/.test(code)) return { status: "invalid_format", challenge: value };
  const digest = createOtpChallenge({ phone: value.phone, challengeId: value.id, code }).codeDigest;
  const row = await db.prepare(`UPDATE otp_challenges SET
    attempts=attempts+CASE WHEN code_digest=? THEN 0 ELSE 1 END,
    verified_at=CASE WHEN code_digest=? THEN ? ELSE NULL END
    WHERE id=? AND expires_at>? AND verified_at IS NULL AND consumed_at IS NULL AND attempts<? RETURNING *`)
    .bind(digest,digest,now,value.id,now,OTP_MAX_ATTEMPTS).first<Row>();
  if (!row) {
    const current = await readStagingOtp(value.id, db, now);
    return { status: !current ? "expired" : current.verifiedAt !== null ? "already_verified" : "locked", challenge: current ?? value };
  }
  return { status: row.verified_at !== null ? "verified" : row.attempts >= OTP_MAX_ATTEMPTS ? "locked" : "incorrect", challenge: challenge(row) };
}

/** Consume exactly once before creating a session, including concurrent requests. */
export async function consumeStagingOtp(id: string, db?: StagingDatabase, now = Date.now()): Promise<boolean> {
  db ??= await stagingDatabase();
  const row = await db.prepare(`UPDATE otp_challenges SET consumed_at=? WHERE id=? AND expires_at>?
    AND verified_at IS NOT NULL AND consumed_at IS NULL RETURNING id`).bind(now,id,now).first<{ id: string }>();
  return row !== null;
}
