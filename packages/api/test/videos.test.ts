import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import FormData from "form-data";
import type { FastifyInstance } from "fastify";
import { makeApp, teardown, registerUser } from "./helpers.js";

describe("videos", () => {
  let app: FastifyInstance;
  let token: string;
  before(async () => {
    app = await makeApp();
    token = await registerUser(app);
  });
  after(() => teardown(app));

  const auth = () => ({ authorization: `Bearer ${token}` });

  test("listing requires auth", async () => {
    const res = await app.inject({ method: "GET", url: "/api/videos" });
    assert.equal(res.statusCode, 401);
  });

  test("upload creates a pending video that appears in the list", async () => {
    const form = new FormData();
    form.append("title", "test-clip");
    form.append("file", Buffer.from("fake-bytes"), {
      filename: "clip.mp4",
      contentType: "video/mp4",
    });

    const up = await app.inject({
      method: "POST",
      url: "/api/videos",
      headers: { ...auth(), ...form.getHeaders() },
      payload: form,
    });
    assert.equal(up.statusCode, 202);
    const id = up.json().id;
    assert.ok(id);

    const list = await app.inject({ method: "GET", url: "/api/videos", headers: auth() });
    assert.equal(list.statusCode, 200);
    const found = list.json().videos.find((v: { id: string }) => v.id === id);
    assert.ok(found, "uploaded video should be listed");
    assert.equal(found.status, "pending");

    // detail view joins job progress
    const detail = await app.inject({
      method: "GET",
      url: `/api/videos/${id}`,
      headers: auth(),
    });
    assert.equal(detail.statusCode, 200);
    assert.equal(detail.json().visibility, "private"); // default

    // patch visibility, then delete
    const patch = await app.inject({
      method: "PATCH",
      url: `/api/videos/${id}`,
      headers: { ...auth(), "content-type": "application/json" },
      payload: { visibility: "public" },
    });
    assert.equal(patch.statusCode, 200);
    assert.equal(patch.json().visibility, "public");

    const del = await app.inject({
      method: "DELETE",
      url: `/api/videos/${id}`,
      headers: auth(),
    });
    assert.equal(del.statusCode, 204);

    const gone = await app.inject({
      method: "GET",
      url: `/api/videos/${id}`,
      headers: auth(),
    });
    assert.equal(gone.statusCode, 404);
  });

  test("a user cannot see another user's video", async () => {
    const form = new FormData();
    form.append("file", Buffer.from("x"), { filename: "a.mp4", contentType: "video/mp4" });
    const up = await app.inject({
      method: "POST",
      url: "/api/videos",
      headers: { ...auth(), ...form.getHeaders() },
      payload: form,
    });
    const id = up.json().id;

    const otherToken = await registerUser(app);
    const res = await app.inject({
      method: "GET",
      url: `/api/videos/${id}`,
      headers: { authorization: `Bearer ${otherToken}` },
    });
    assert.equal(res.statusCode, 404);
  });
});
