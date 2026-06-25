import Fastify, { type FastifyInstance } from "fastify";
import fastifyMultipart from "@fastify/multipart";
import { registerAuth } from "./auth/jwt.js";
import { authRoutes } from "./routes/auth.js";
import { videoRoutes } from "./routes/videos.js";
import { streamRoutes } from "./routes/streams.js";
import { ensureBuckets } from "./storage/s3.js";

const port = Number(process.env.API_PORT ?? 3000);

/**
 * Build the fully-wired Fastify app without listening. Exported so tests can
 * drive it via `app.inject(...)`; `start()` adds the network listener.
 */
export async function buildApp(opts: { logger?: boolean } = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true });

  // JWT plugin + `authenticate` preHandler (awaited so routes inherit them).
  await registerAuth(app);

  // Streaming multipart uploads (single file, capped at MAX_UPLOAD_BYTES).
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: Number(process.env.MAX_UPLOAD_BYTES ?? 2 * 1024 ** 3),
      files: 1,
    },
    throwFileSizeLimit: false,
  });

  // Best-effort bucket creation; don't block API boot if MinIO is down.
  try {
    await ensureBuckets();
  } catch (err) {
    app.log.warn({ err }, "could not ensure MinIO buckets at startup");
  }

  app.get("/health", async () => ({ status: "ok" }));
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(videoRoutes, { prefix: "/api/videos" });
  await app.register(streamRoutes, { prefix: "/api/videos" });

  return app;
}

async function start() {
  const app = await buildApp();
  await app.listen({ port, host: "0.0.0.0" });
}

// Only auto-start when run directly (not when imported by tests).
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  start().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
