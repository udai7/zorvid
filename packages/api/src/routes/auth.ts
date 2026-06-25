import type { FastifyInstance } from "fastify";
import argon2 from "argon2";
import { pool } from "../db/pool.js";

interface Credentials {
  email: string;
  password: string;
}

/** Auth routes, mounted under /api/auth. */
export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/register — hash password, create user, return a token.
  app.post("/register", async (req, reply) => {
    const { email, password } = (req.body ?? {}) as Partial<Credentials>;
    if (!email || !password) {
      return reply.code(400).send({ error: "email and password are required" });
    }

    const passwordHash = await argon2.hash(password);
    try {
      const { rows } = await pool.query<{ id: string; email: string }>(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
        [email, passwordHash]
      );
      const user = rows[0];
      const token = app.jwt.sign({ id: user.id, email: user.email });
      return reply.code(201).send({ token, user });
    } catch (err) {
      // 23505 = unique_violation (email already exists)
      if ((err as { code?: string }).code === "23505") {
        return reply.code(409).send({ error: "email already registered" });
      }
      throw err;
    }
  });

  // POST /api/auth/login — verify password, issue a token.
  app.post("/login", async (req, reply) => {
    const { email, password } = (req.body ?? {}) as Partial<Credentials>;
    if (!email || !password) {
      return reply.code(400).send({ error: "email and password are required" });
    }

    const { rows } = await pool.query<{
      id: string;
      email: string;
      password_hash: string;
    }>("SELECT id, email, password_hash FROM users WHERE email = $1", [email]);
    const user = rows[0];

    if (!user || !(await argon2.verify(user.password_hash, password))) {
      return reply.code(401).send({ error: "invalid credentials" });
    }

    const token = app.jwt.sign({ id: user.id, email: user.email });
    return reply.send({ token, user: { id: user.id, email: user.email } });
  });

  // GET /api/auth/me — protected; echoes the authenticated user.
  app.get("/me", { preHandler: [app.authenticate] }, async (req) => {
    return { user: req.user };
  });
}
