import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import type { FastifyInstance } from "fastify";
import { makeApp, teardown, uniqueEmail } from "./helpers.js";

describe("auth", () => {
  let app: FastifyInstance;
  before(async () => {
    app = await makeApp();
  });
  after(() => teardown(app));

  test("register returns a token and user", async () => {
    const email = uniqueEmail();
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email, password: "password123" },
    });
    assert.equal(res.statusCode, 201);
    const body = res.json();
    assert.ok(body.token);
    assert.equal(body.user.email, email);
  });

  test("duplicate email returns 409", async () => {
    const email = uniqueEmail();
    const payload = { email, password: "password123" };
    await app.inject({ method: "POST", url: "/api/auth/register", payload });
    const dup = await app.inject({ method: "POST", url: "/api/auth/register", payload });
    assert.equal(dup.statusCode, 409);
  });

  test("login with wrong password returns 401", async () => {
    const email = uniqueEmail();
    await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email, password: "password123" },
    });
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email, password: "wrongpassword" },
    });
    assert.equal(res.statusCode, 401);
  });

  test("/me is 401 without a token and 200 with one", async () => {
    const anon = await app.inject({ method: "GET", url: "/api/auth/me" });
    assert.equal(anon.statusCode, 401);

    const email = uniqueEmail();
    const reg = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email, password: "password123" },
    });
    const token = reg.json().token;
    const me = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(me.statusCode, 200);
    assert.equal(me.json().user.email, email);
  });
});
