import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import type { FastifyInstance } from "fastify";
import { makeApp, teardown, uniqueEmail, registerPayload } from "./helpers.js";

/** Register through the OTP challenge and return { token, user, email }. */
async function fullRegister(app: FastifyInstance, over: Record<string, unknown> = {}) {
  const payload = registerPayload(over);
  const reg = await app.inject({ method: "POST", url: "/api/auth/register", payload });
  assert.equal(reg.statusCode, 201);
  const challenge = reg.json();
  assert.equal(challenge.challenge, "otp");
  assert.ok(challenge.devCode, "dev code should be present without SMTP");

  const ver = await app.inject({
    method: "POST",
    url: "/api/auth/verify-otp",
    payload: { email: payload.email, code: challenge.devCode, purpose: "register" },
  });
  assert.equal(ver.statusCode, 200);
  return { ...ver.json(), email: payload.email, password: payload.password };
}

describe("auth", () => {
  let app: FastifyInstance;
  before(async () => {
    app = await makeApp();
  });
  after(() => teardown(app));

  test("register issues an OTP challenge, verify-otp returns a verified user", async () => {
    const { token, user } = await fullRegister(app, { firstName: "Ada", lastName: "Lovelace" });
    assert.ok(token);
    assert.equal(user.firstName, "Ada");
    assert.equal(user.emailVerified, true);
  });

  test("verify-otp rejects a wrong code", async () => {
    const payload = registerPayload();
    await app.inject({ method: "POST", url: "/api/auth/register", payload });
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/verify-otp",
      payload: { email: payload.email, code: "000000", purpose: "register" },
    });
    assert.equal(res.statusCode, 400);
  });

  test("register requires name and phone", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: uniqueEmail(), password: "password123" },
    });
    assert.equal(res.statusCode, 400);
  });

  test("register rejects short passwords", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: registerPayload({ password: "short" }),
    });
    assert.equal(res.statusCode, 400);
  });

  test("duplicate email returns 409", async () => {
    const payload = registerPayload();
    await app.inject({ method: "POST", url: "/api/auth/register", payload });
    const dup = await app.inject({ method: "POST", url: "/api/auth/register", payload });
    assert.equal(dup.statusCode, 409);
  });

  test("login starts an OTP challenge, verify-otp returns a token", async () => {
    const { email, password } = await fullRegister(app);
    const login = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email, password },
    });
    assert.equal(login.statusCode, 200);
    const challenge = login.json();
    assert.equal(challenge.challenge, "otp");

    const ver = await app.inject({
      method: "POST",
      url: "/api/auth/verify-otp",
      payload: { email, code: challenge.devCode, purpose: "login" },
    });
    assert.equal(ver.statusCode, 200);
    assert.ok(ver.json().token);
  });

  test("login with wrong password returns 401", async () => {
    const { email } = await fullRegister(app);
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email, password: "wrongpassword" },
    });
    assert.equal(res.statusCode, 401);
  });

  test("/me is 401 without a token and returns the profile with one", async () => {
    const anon = await app.inject({ method: "GET", url: "/api/auth/me" });
    assert.equal(anon.statusCode, 401);

    const { token, email } = await fullRegister(app);
    const me = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(me.statusCode, 200);
    assert.equal(me.json().user.email, email.toLowerCase());
  });

  test("google sign-in is 503 when not configured", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/google",
      payload: { credential: "x" },
    });
    assert.equal(res.statusCode, 503);
  });

  test("/config reports capabilities", async () => {
    const res = await app.inject({ method: "GET", url: "/api/auth/config" });
    assert.equal(res.statusCode, 200);
    const cfg = res.json();
    assert.equal(typeof cfg.twoFactor, "boolean");
    assert.equal(cfg.google, false);
  });
});
