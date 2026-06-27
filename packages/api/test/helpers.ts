// Sane defaults so tests run against local containers (or CI services) without
// requiring a .env. Real values (set by CI or the shell) always win.
process.env.JWT_SECRET ||= "test-secret-please-ignore-0123456789";
process.env.DATABASE_URL ||= "postgres://vp:secret@localhost:5432/video_processing";
process.env.REDIS_URL ||= "redis://localhost:6379";
process.env.MINIO_ENDPOINT ||= "localhost";
process.env.MINIO_PORT ||= "9000";
process.env.MINIO_USE_SSL ||= "false";
process.env.MINIO_ROOT_USER ||= "minioadmin";
process.env.MINIO_ROOT_PASSWORD ||= "minioadmin";
process.env.BUCKET_INPUTS ||= "inputs";
process.env.BUCKET_OUTPUTS ||= "outputs";
process.env.BUCKET_THUMBS ||= "thumbnails";
process.env.SIGNED_URL_TTL ||= "3600";

import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/server.js";
import { pool } from "../src/db/pool.js";
import { transcodeQueue } from "../src/queue/producer.js";

export async function makeApp(): Promise<FastifyInstance> {
  return buildApp({ logger: false });
}

/** Release shared singletons so the test process can exit cleanly. */
export async function teardown(app: FastifyInstance): Promise<void> {
  await app.close();
  await transcodeQueue.close();
  await pool.end();
}

export const uniqueEmail = (): string =>
  `t_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`;

/** A complete registration payload; override fields as needed. */
export const registerPayload = (over: Record<string, unknown> = {}) => ({
  email: uniqueEmail(),
  password: "password123",
  firstName: "Test",
  lastName: "User",
  phone: "+1 555 0100",
  ...over,
});

/**
 * Register a fresh user and return their bearer token, completing the email
 * OTP challenge when 2FA is enabled (the dev code is returned by the API when
 * SMTP is unconfigured, as it is in tests).
 */
export async function registerUser(app: FastifyInstance): Promise<string> {
  const payload = registerPayload();
  const reg = await app.inject({ method: "POST", url: "/api/auth/register", payload });
  const body = reg.json();
  if (body.token) return body.token as string; // 2FA disabled

  const ver = await app.inject({
    method: "POST",
    url: "/api/auth/verify-otp",
    payload: { email: payload.email, code: body.devCode, purpose: "register" },
  });
  return ver.json().token as string;
}
