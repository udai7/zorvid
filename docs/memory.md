# Memory — Video Processing Pipeline (VOD)

Last updated: 2026-06-25

Self-hosted video-on-demand platform: upload → transcode → adaptive HLS streaming.
Full design in `architecture.md`; build broken into steps in `steps.md`.
Stack: Node 20 + TypeScript, Fastify, BullMQ + Redis, FFmpeg, MinIO (S3), Postgres, nginx, hls.js.
npm workspaces monorepo: `packages/shared`, `packages/api`, `packages/worker`.

## Progress: Steps 0–5 of 8 complete and verified

- **Step 1 (infra scaffold)** — pre-existing before this session (docker-compose, Dockerfiles, package scaffolding, `.env.example`).
- **Step 2 (shared types + DB schema)** — DONE this session.
- **Step 3 (API auth)** — DONE this session.
- **Step 4 (upload + enqueue)** — DONE this session.
- **Step 5 (FFmpeg worker)** — DONE this session.
- **Step 6 (streaming endpoints)** — NOT STARTED (next).
- **Step 7 (dashboard)**, **Step 8 (CDN)** — not started.

## What was built (this session)

**Step 2 — `packages/shared/src/index.ts`**: `VideoStatus`, `Visibility`, `JobStage` unions; `User`/`Video`/`Job`/`VideoMetadata` interfaces; `TranscodeJobData` + `TRANSCODE_QUEUE = "transcode"` const.
**Step 2 — DB**: `packages/api/src/db/pool.ts` (pg Pool from `DATABASE_URL`), `db/migrate.ts` (idempotent runner tracking applied files in `_migrations`, one txn per file), `db/migrations/001_init.sql` (users, videos, jobs per architecture §6 — uuid PKs via pgcrypto, enums `video_status`/`visibility`, jsonb metadata, FKs ON DELETE CASCADE, progress 0–100 check).

**Step 3 — Auth**: `packages/api/src/auth/jwt.ts` (registers `@fastify/jwt`, decorates `authenticate` preHandler, types payload/user as `{id,email}`), `routes/auth.ts` (`POST /api/auth/register` argon2 hash + 409 on dup email; `POST /api/auth/login`; `GET /api/auth/me` protected), `src/server.ts` (Fastify entrypoint — was created here).

**Step 4 — Upload**: `packages/api/src/storage/s3.ts` (MinIO S3 client, `ensureBuckets`, `uploadStream` via `@aws-sdk/lib-storage` Upload for no-buffer streaming, `deletePrefix`, `inputKey`), `queue/producer.ts` (BullMQ `transcode` queue, `enqueueTranscode` with 3 attempts + exponential backoff), `routes/videos.ts` (`POST /` 202 stream-to-MinIO + rows + enqueue; `GET /` list; `GET /:id` detail w/ joined job progress; `DELETE /:id` rows + objects). Registered `@fastify/multipart` + best-effort `ensureBuckets` in server.ts. Added `@aws-sdk/lib-storage` dep to api package.json.

**Step 5 — Worker** (`packages/worker/src/`): `storage.ts` (download/upload), `db.ts` (status/metadata/job/log helpers), `ffmpeg/run.ts` (spawn wrapper + `time=` progress parser), `ffmpeg/probe.ts` (ffprobe → metadata), `renditions.ts` (360/480/720 ladder, `selectRenditions` caps at source, `bitrateToBps`), `stages/{analyze→via pipeline,transcode,thumbnails,package,finalize}.ts`, `pipeline.ts` (orchestrates 5 stages, throttles progress to 1/percent, failure → status=failed + readable error then rethrow), `index.ts` (BullMQ Worker, concurrency from `WORKER_CONCURRENCY`).

## Decisions made

- **Upload key convention**: `inputs/<videoId>/<original_filename>`. API writes it (`api/src/storage/s3.ts inputKey`), worker reconstructs the same (`worker/src/storage.ts inputKey`). Keep these in sync.
- **Output layout**: `outputs/<videoId>/master.m3u8`, `outputs/<videoId>/<height>p/index.m3u8` + `seg_NNN.ts`; thumbnails `thumbnails/<videoId>/thumb_N.jpg`. `master_playlist_key = <videoId>/master.m3u8`.
- **Transcode then stream-copy to HLS** (two passes: intermediate mp4 per rendition, then `-c copy` segmentation). Honors the doc's separate transcode/package stages; possible future one-pass optimization noted.
- **Progress bands**: analyze→5, transcode 10–70, thumbnails 70–85, package 85–98, finalize 98–100.
- **BullMQ**: jobs get 3 attempts + exponential backoff; worker connection needs `maxRetriesPerRequest: null`. Stages idempotent (deterministic keys overwrite).
- `ensureBuckets` at API boot is best-effort (logs warning, doesn't block startup if MinIO down).

## Problems solved

- **Background server processes get reaped**: `nohup ... &` inside a tool call dies when the wrapper exits. Fix: run the server/worker in the FOREGROUND of a `run_in_background: true` Bash call (use `exec npx tsx <ABSOLUTE_PATH>`); a relative path makes tsx resolve against the wrong cwd (ERR_MODULE_NOT_FOUND on `/src/server.ts`).
- **MinIO container shell is minimal** (busybox: no `find`/`grep`/`strings`/`sed`). To inspect stored objects, use the S3 API (a small node `.mjs` script using `@aws-sdk/client-s3` ListObjectsV2/GetObject) — and run it from the REPO ROOT so hoisted `node_modules` resolves (scripts in the scratchpad dir can't resolve deps).
- `metadata` jsonb writes need `JSON.stringify` + `$2::jsonb` (pg doesn't auto-serialize objects).

## Current state — all of Steps 2–5 verified end-to-end

Verified with real ffmpeg + throwaway Postgres/Redis/MinIO containers:
- Auth: register/login/me return correct 201/200/401/409/404.
- Upload: 202, object in MinIO inputs/, BullMQ job enqueued, videos(pending)+jobs rows; list/detail/delete work; delete cleans MinIO + DB.
- Worker happy path: real 1280x720 8s clip → status walks pending→transcoding→thumbnails→completed, progress 0→100; produced 3 renditions + valid master playlist (correct BANDWIDTH/RESOLUTION) + 6 thumbnails; metadata + master_playlist_key persisted.
- Worker failure path: corrupt file → status=failed, readable ffprobe error, 3 BullMQ retries then gives up.
- All verification containers/processes were torn down at end of session.

## Environment notes

- This machine has Docker (28.2.2) but **NO `docker compose` CLI** (no compose plugin, no `docker-compose` binary). All verification used direct `docker run` on alt ports: pg 55432, redis 56379, minio 59000. Install the Compose plugin before `docker compose up` works.
- `ffmpeg`/`ffprobe` 6.1.1 ARE on the host PATH (used for local worker dev). Worker Docker image bundles ffmpeg via `apk add`.
- `git` repo exists but state reported "not a git repository" by harness; only 1 commit (architecture + steps). No commits made for code yet — user has NOT asked to commit.

## Next session starts with

**Step 6 — Streaming endpoints** (`packages/api/src/routes/streams.ts`):
- `GET /api/videos/:id/stream` returns the master playlist URL. Public videos → public path through nginx/CDN; private videos → signed, time-limited URL (use `@aws-sdk/s3-request-presigner` — already a dep — or short-lived token; `SIGNED_URL_TTL` env exists).
- nginx routes `/streams/*` → MinIO `outputs/` for segment serving (CDN-cacheable).
- Verify: hls.js plays a completed video w/ adaptive switching; private URL expires after TTL; public plays without a token.

## Open questions

- Migrations in the API runtime Docker image: `npm run migrate` uses `tsx` + `src/`, but the runtime image only ships `dist/` (no tsx, no `.sql`). Need a decision before deploy (compile the runner + copy `.sql` into image, or a dedicated migrate step). Not blocking local dev.
- Corrupt-file `error_message` includes the temp source path — readable but could be mapped to a friendlier message if desired.
- `visibility` defaults to `private`; there's no endpoint yet to set a video public — likely needed for Step 6 public-path testing (consider a PATCH or include in Step 6).
