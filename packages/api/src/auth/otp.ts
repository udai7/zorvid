import argon2 from "argon2";
import { pool } from "../db/pool.js";

const TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

export type OtpPurpose = "register" | "login";

/** Cryptographically-simple 6-digit code (000000–999999). */
function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Issue a fresh OTP for a user+purpose, invalidating any prior unconsumed ones.
 * Returns the plaintext code (to email / log); only its hash is stored.
 */
export async function createOtp(userId: string, purpose: OtpPurpose): Promise<string> {
  const code = generateCode();
  const codeHash = await argon2.hash(code);

  await pool.query(
    `UPDATE email_otps SET consumed_at = now()
     WHERE user_id = $1 AND purpose = $2 AND consumed_at IS NULL`,
    [userId, purpose]
  );
  await pool.query(
    `INSERT INTO email_otps (user_id, code_hash, purpose, expires_at)
     VALUES ($1, $2, $3, now() + ($4 || ' minutes')::interval)`,
    [userId, codeHash, purpose, String(TTL_MINUTES)]
  );
  return code;
}

/**
 * Verify a submitted code for a user+purpose. Consumes the code on success;
 * counts failed attempts and locks the code after MAX_ATTEMPTS.
 */
export async function verifyOtp(userId: string, purpose: OtpPurpose, code: string): Promise<boolean> {
  const { rows } = await pool.query<{ id: string; code_hash: string; attempts: number }>(
    `SELECT id, code_hash, attempts FROM email_otps
     WHERE user_id = $1 AND purpose = $2 AND consumed_at IS NULL AND expires_at > now()
     ORDER BY created_at DESC LIMIT 1`,
    [userId, purpose]
  );
  const otp = rows[0];
  if (!otp || otp.attempts >= MAX_ATTEMPTS) return false;

  const ok = await argon2.verify(otp.code_hash, code).catch(() => false);
  if (!ok) {
    await pool.query("UPDATE email_otps SET attempts = attempts + 1 WHERE id = $1", [otp.id]);
    return false;
  }

  await pool.query("UPDATE email_otps SET consumed_at = now() WHERE id = $1", [otp.id]);
  return true;
}
