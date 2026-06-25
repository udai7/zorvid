# Video Processing Pipeline — Step-by-Step Implementation Guide

This guide breaks the architecture (see `architecture.md`) into concrete build steps. Each step
states **what** is built, **how** it works, and **how to verify** it before moving on.

Stack: **Node.js + TypeScript** · Fastify (API) · BullMQ + Redis (queue/workers) · FFmpeg ·
MinIO (S3-compatible storage) · PostgreSQL · nginx · Cloudflare CDN · hls.js (player).

---

## Step 0: Prerequisites

- Docker + Docker Compose installed on the VPS.
- `ffmpeg` and `ffprobe` available **inside the worker image** (installed via the Dockerfile).
- Node.js 20+ and `npm` for local dev.

**Verify:** `docker --version`, `docker compose version`, `node --version`.

---

## Step 1: Infrastructure scaffold (`docker-compose.yml`)

Stand up the backing services first so the app has something to talk to.

Services:
- **postgres** — DB, volume-backed.
- **redis** — BullMQ broker.
- **minio** — object storage (API `:9000`, console `:9001`), volume-backed.
- **api** — Fastify service (built from `packages/api`).
- **worker** — BullMQ consumer (built from `packages/worker`, includes FFmpeg).
- **nginx** — gateway/reverse proxy.

Config via `.env` (never committed): `POSTGRES_*`, `REDIS_URL`, `MINIO_*`, `JWT_SECRET`,
bucket names (`BUCKET_INPUTS`, `BUCKET_OUTPUTS`, `BUCKET_THUMBS`).

**Verify:** `docker compose up -d postgres redis minio` → MinIO console reachable at
`http://VPS:9001`; `psql` / `redis-cli ping` succeed.

---

## Step 2: Shared types + DB schema

### `packages/shared/`
Shared TypeScript types/enums used by both API and worker: `VideoStatus`, `Visibility`,
`JobStage`, and the `Video` / `Job` / `User` interfaces.

### `packages/api/src/db/` — migrations
Create tables (see `architecture.md` §6):
- `users` (id, email unique, password_hash, created_at)
- `videos` (id, user_id fk, title, original_filename, status, visibility, metadata jsonb,
  master_playlist_key, created_at)
- `jobs` (id, video_id fk, progress, stage, logs, error_message, attempts, updated_at)

**Verify:** run migrations; `\dt` shows all three tables with correct columns.

---

## Step 3: API — authentication

Endpoints in `packages/api/src/routes/auth.ts`:
- `POST /api/auth/register` — hash password (argon2/bcrypt), insert user.
- `POST /api/auth/login` — verify password, issue JWT access token.

Helpers in `packages/api/src/auth/`: JWT sign/verify, a Fastify `preHandler` that protects routes.

**Verify:** `curl` register → login → receive token; a protected route returns `401` without a
valid token and `200` with one.

---

## Step 4: API — upload + enqueue

In `packages/api/src/routes/videos.ts`:
- `POST /api/videos` (JWT, multipart) — **stream** the upload directly into MinIO `inputs/`
  (no buffering whole file in memory), insert a `videos` row (`status=pending`) and a `jobs`
  row, then enqueue a BullMQ job `{ videoId }`. Return `202` with the video id.
- `GET /api/videos` — list current user's videos.
- `GET /api/videos/:id` — detail incl. live `progress`, `stage`, and logs.
- `DELETE /api/videos/:id` — remove MinIO objects + DB rows.

Wrappers: `packages/api/src/storage/` (MinIO S3 client), `packages/api/src/queue/` (BullMQ producer).

**Verify:** upload a sample mp4 → object appears in MinIO `inputs/`; a job appears in Redis;
`videos` row is `pending`.

---

## Step 5: Worker — FFmpeg processing stages

`packages/worker/` consumes the BullMQ queue. For each job, in `src/stages/`:

1. **Analyze** (`ffprobe`) — read codec/resolution/duration/bitrate → store in `videos.metadata`; `→5%`.
2. **Transcode** (`ffmpeg`) — produce H.264 renditions (360p/480p/720p, capped at source);
   parse stderr `time=` ÷ duration for live progress; `10%→70%`.
3. **Thumbnails** (`ffmpeg`) — 6 evenly-spaced frames → MinIO `thumbnails/`; `70%→85%`.
4. **HLS packaging** (`ffmpeg`) — 6s `.ts` segments + per-rendition `.m3u8` + a **master
   playlist**; `85%→98%`.
5. **Finalize** — upload outputs to MinIO `outputs/`, set `master_playlist_key`, mark
   `status=completed`; `100%`.

`src/ffmpeg/` holds the subprocess wrapper + progress parser. Wrap all stages in try/catch:
on failure set `status=failed`, persist `error_message` + `logs`. BullMQ handles retries/backoff;
stages must be idempotent (overwrite outputs by deterministic key).

**Verify:** after upload, `status` walks pending→…→completed; HLS files, master playlist, and
thumbnails exist in MinIO. A corrupt file ends `failed` with a readable error.

---

## Step 6: API — streaming

In `packages/api/src/routes/streams.ts`:
- `GET /api/videos/:id/stream` — return the master playlist URL.
  - **Public** videos → public path through nginx/CDN.
  - **Private** videos → **signed, time-limited URL** (presigned MinIO or short-lived token).
- nginx routes `/streams/*` to MinIO `outputs/` so segments are served (and CDN-cacheable).

**Verify:** hls.js plays a completed video with adaptive quality switching; a private URL
expires after its TTL; a public video plays without a token.

---

## Step 7: Dashboard (`static/`)

- **`index.html`** — drag-and-drop dropzone, progress cards, an inspect/detail view with player.
- **`styles.css`** — responsive styling (CSS variables, progress bars).
- **`app.js`** — handles drag-drop, calls the upload API, polls `GET /api/videos/:id` every ~1s
  to update cards/logs, and embeds an **hls.js** player for completed videos.

**Verify:** full browser flow — drop a file, watch progress to 100%, play the result inline.

---

## Step 8: CDN (Cloudflare)

- Point the domain at the VPS through Cloudflare (free tier), proxied.
- Cache-control on `/streams/*` so `.ts`/`.m3u8` segments are edge-cached.

**Verify:** repeated segment requests return `cf-cache-status: HIT`.

> Note: Cloudflare's free plan restricts heavy video caching (ToS 2.8) — fine at hobby scale.
> Growth path: **Cloudflare R2 + CDN** (config-only swap, since MinIO is S3-compatible).

---

## End-to-end verification

- **Happy path:** register → login → upload mp4 → poll to `completed` → adaptive HLS playback.
- **Scale demo:** upload several videos at once; `docker compose up --scale worker=3` and watch
  the queue drain in parallel.
- **Failure path:** upload a corrupt file → job retries → `status=failed` with error + logs.
- **CDN:** repeat segment requests show `cf-cache-status: HIT`.
