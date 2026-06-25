import Fastify from "fastify";
import { registerAuth } from "./auth/jwt.js";
import { authRoutes } from "./routes/auth.js";

const port = Number(process.env.API_PORT ?? 3000);

async function main() {
  const app = Fastify({ logger: true });

  // JWT plugin + `authenticate` preHandler (awaited so routes inherit them).
  await registerAuth(app);

  app.get("/health", async () => ({ status: "ok" }));
  await app.register(authRoutes, { prefix: "/api/auth" });

  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
