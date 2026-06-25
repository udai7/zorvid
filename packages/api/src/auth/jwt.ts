import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fastifyJwt from "@fastify/jwt";

// The shape of our JWT payload and the decoded `request.user`.
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { id: string; email: string };
    user: { id: string; email: string };
  }
}

declare module "fastify" {
  interface FastifyInstance {
    /** preHandler that rejects requests without a valid Bearer token. */
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/**
 * Register the JWT plugin and an `authenticate` preHandler on the app.
 * Must be awaited at the top level so child route plugins inherit both.
 */
export async function registerAuth(app: FastifyInstance) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");

  await app.register(fastifyJwt, {
    secret,
    sign: { expiresIn: process.env.JWT_EXPIRES_IN ?? "7d" },
  });

  app.decorate("authenticate", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      reply.code(401).send({ error: "unauthorized" });
    }
  });
}
