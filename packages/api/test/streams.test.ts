import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import type { FastifyInstance } from "fastify";
import { makeApp, teardown, registerUser } from "./helpers.js";
import { pool } from "../src/db/pool.js";
import { BUCKETS, uploadStream } from "../src/storage/s3.js";

const MASTER = "#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-STREAM-INF:BANDWIDTH=896000\n360p/index.m3u8\n";

/**
 * Seed a completed video directly (no worker needed) plus its master playlist
 * object in MinIO, so we can exercise the streaming authorization paths.
 */
async function seedCompletedVideo(app: FastifyInstance, token: string) {
  const me = await app.inject({
    method: "GET",
    url: "/api/auth/me",
    headers: { authorization: `Bearer ${token}` },
  });
  const userId = me.json().user.id;

  const { rows } = await pool.query(
    `INSERT INTO videos (user_id, title, original_filename, status, master_playlist_key)
     VALUES ($1, 'seeded', 'seeded.mp4', 'completed', NULL) RETURNING id`,
    [userId]
  );
  const id = rows[0].id;
  await pool.query("UPDATE videos SET master_playlist_key = $1 WHERE id = $2", [
    `${id}/master.m3u8`,
    id,
  ]);
  await uploadStream(
    BUCKETS.outputs,
    `${id}/master.m3u8`,
    Readable.from(Buffer.from(MASTER)),
    "application/vnd.apple.mpegurl"
  );
  return id as string;
}

describe("streams", () => {
  let app: FastifyInstance;
  let token: string;
  before(async () => {
    app = await makeApp();
    token = await registerUser(app);
  });
  after(() => teardown(app));

  test("private video: master requires a valid stream token", async () => {
    const id = await seedCompletedVideo(app, token);

    const stream = await app.inject({
      method: "GET",
      url: `/api/videos/${id}/stream`,
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(stream.statusCode, 200);
    const info = stream.json();
    assert.equal(info.visibility, "private");
    assert.ok(info.token, "private stream returns a token");

    const noToken = await app.inject({ method: "GET", url: `/api/videos/${id}/hls/master.m3u8` });
    assert.equal(noToken.statusCode, 401);

    const withToken = await app.inject({
      method: "GET",
      url: `/api/videos/${id}/hls/master.m3u8`,
      headers: { authorization: `Bearer ${info.token}` },
    });
    assert.equal(withToken.statusCode, 200);
    assert.match(withToken.body, /#EXTM3U/);
    assert.match(withToken.headers["cache-control"] as string, /no-store/);
  });

  test("public video: master is served anonymously and is cacheable", async () => {
    const id = await seedCompletedVideo(app, token);
    await app.inject({
      method: "PATCH",
      url: `/api/videos/${id}`,
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      payload: { visibility: "public" },
    });

    const stream = await app.inject({
      method: "GET",
      url: `/api/videos/${id}/stream`,
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(stream.json().visibility, "public");
    assert.equal(stream.json().token, undefined);

    const anon = await app.inject({ method: "GET", url: `/api/videos/${id}/hls/master.m3u8` });
    assert.equal(anon.statusCode, 200);
    assert.match(anon.headers["cache-control"] as string, /public/);
  });

  test("path traversal is rejected", async () => {
    const id = await seedCompletedVideo(app, token);
    await app.inject({
      method: "PATCH",
      url: `/api/videos/${id}`,
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      payload: { visibility: "public" },
    });
    const res = await app.inject({
      method: "GET",
      url: `/api/videos/${id}/hls/..%2f..%2fetc%2fpasswd`,
    });
    assert.ok(res.statusCode === 400 || res.statusCode === 404);
  });
});
