# Memory — Video Processing Pipeline (VOD)

Last updated: 2026-06-25

Self-hosted video-on-demand platform: upload → transcode → adaptive HLS streaming.
Full design in `docs/architecture.md`; build broken into steps in `docs/steps.md`; user-facing
overview in root `README.md`.
Stack: Node 20 + TypeScript, Fastify, BullMQ + Redis, FFmpeg, MinIO (S3), Postgres, nginx,
React + Vite + hls.js.
npm workspaces monorepo: `packages/shared`, `packages/api`, `packages/worker`.
`packages/web` (React SPA) is a STANDALONE package (NOT in root workspaces) so its frontend
deps don't entangle the backend image installs.

## Progress: feature-complete (all 8 steps) + portfolio hardening done

- **Steps 0–5** — shared types+DB, JWT auth, upload+enqueue, FFmpeg worker. (earlier sessions)
- **Step 6 (streaming)**, **Step 7 (dashboard)**, **Step 8 (CDN/caching)** — done.
- **This session also added:** React UI, tests + CI, migrations-in-image fix, Docker/compose
  hosting wiring, README, doc updates.

NOT committed yet (user hasn't asked to commit; offered a branch). CI badge in README has
`OWNER/REPO` placeholders to fill in.

## What was built / changed (latest session)

**React SPA — `packages/web/`** (Vite + React + TS, replaces the deleted `static/` dashboard):
- `src/api.ts` typed client (JWT in localStorage; upload via XHR for progress; 401 auto-logout).
- `src/types.ts` (local copy of API response shapes — no node-oriented workspace dep in bundle).
- `src/hooks/useVideos.ts` (polls `GET /api/videos` ~1s while anything is non-terminal).
- `src/components/`: `Login.tsx`, `Dropzone.tsx` (drag-drop + live upload %), `VideoCard.tsx`
  (status/progress/stage/error, visibility toggle, delete), `Player.tsx` (hls.js modal,
  adaptive ABR + manual quality chips; private token via `xhrSetup`).
- `src/index.css` dark theme. `vite.config.ts` proxies `/api`→:3000 in dev.
- `packages/web/Dockerfile` multi-stage: builds SPA, serves via nginx + `nginx/nginx.conf`.

**Migrations-in-image fix (`packages/api`)**:
- `build` script: `tsc && rm -rf dist/db/migrations && cp -r src/db/migrations dist/db/migrations`
  (idempotent — plain `cp -r` nested on re-runs; the `rm -rf` prevents it).
- Added `migrate:prod` (`node dist/db/migrate.js`) and `test` scripts.
- Removed now-dead dep `@aws-sdk/s3-request-presigner` (presigner approach abandoned for proxy).

**Tests + CI**:
- `src/server.ts` refactored to export `buildApp({logger})` (no listen); only auto-starts when
  run directly. Tests drive it via `app.inject`.
- `packages/api/test/`: `helpers.ts` (env defaults + makeApp/teardown/registerUser), `auth.test.ts`,
  `videos.test.ts`, `streams.test.ts` (seeds a completed video + master.m3u8 in MinIO to test
  authz without the worker). Uses `node:test` + `tsx` (NOT vitest — avoids the .js→.ts Vite
  resolver issue with NodeNext). Run: `npm run test --workspace @vp/api`. 10 tests, all pass.
- `.github/workflows/ci.yml`: Postgres+Redis as service containers; MinIO via a `docker run` step
  (service containers can't pass the `server /data` command); build → migrate → test → SPA build.

**Compose / hosting (`docker-compose.yml`)**:
- New one-shot `migrate` service (api image, `node packages/api/dist/db/migrate.js`); `api`
  depends_on it `service_completed_successfully`.
- `nginx` service now BUILDS from `packages/web/Dockerfile` (bundles the React build); removed
  the `./static` + conf mounts.
- `createbuckets` no longer sets `outputs` anonymous (kept thumbs anonymous) — outputs is private.
- Added `.dockerignore` (node_modules, dist, .git, .env, scratchpad).

**Docs**: new root `README.md`; updated `docs/architecture.md` (§5 stream, §8 security, §9 layout)
and `docs/steps.md` (Steps 2/6/7/8) to the React UI + unified-proxy streaming model.

## Key decisions (carried, still load-bearing)

- **Serve ALL HLS through the API proxy `/api/videos/:id/hls/*`, not presigned MinIO URLs.**
  hls.js fetches nested child playlists/segments via RELATIVE URLs → drops any query-string
  signature, so presigning only loads the master. A header token re-applied per request by
  hls.js `xhrSetup` works for nested HLS AND keeps private content genuinely private.
- **outputs bucket is PRIVATE.** Public delivery + CDN caching = nginx/Cloudflare caching the
  API's PUBLIC proxy responses (`Cache-Control: public, immutable`); private = `no-store`.
- Private stream token TTL = `SIGNED_URL_TTL`. `GET /:id/stream` mints it; `PATCH /:id` sets
  visibility (added to enable the public path).
- nginx cache layer: `location ~ ^/api/videos/[^/]+/hls/` with `proxy_cache` + `X-Cache-Status`.

## Problems solved (don't re-solve)

- **Docker build caught a missing `@types/node` in `packages/web`** that local builds masked
  (root node_modules hoisted it). It's now in web devDeps — required for the isolated image build.
- nginx `proxy_cache_path` is valid in `nginx/nginx.conf` because that file is `include`d inside
  the main `http{}` block (mounted at conf.d/default.conf).
- Standalone `docker run` of the web image returns 000 unless the `api` upstream host resolves
  (nginx resolves upstreams at startup) — NOT a bug; it resolves under compose. Tested with
  `--add-host api:127.0.0.1` → SPA serves 200 + client-route fallback.
- Dev-process gotchas (unchanged): run servers in FOREGROUND of `run_in_background:true` with
  absolute `tsx` paths; this host has Docker but NO `docker compose` CLI; verify with direct
  `docker run` on alt ports (pg 55432 / redis 56379 / minio 59000); ffmpeg 6.1.1 on host PATH.

## Current state — verified

- Backend builds (shared/api/worker); web typechecks + Vite builds; `npm ci` lockfile consistent.
- 10/10 API tests pass against real containers.
- Compiled prod migration creates all tables on a fresh DB and is idempotent.
- Web Docker image builds and serves the SPA (200, SPA fallback, bundled assets); nginx -t OK.
- All throwaway containers/processes torn down at session end.

## Next session could start with

1. Fill the README CI badge `OWNER/REPO`, then commit (offered a branch; user hasn't said yes).
2. One real `docker compose up --build` end-to-end smoke test — NOT yet run (host lacks the
   Compose plugin; each piece verified independently).
3. **Tier 2** (deferred to hosting phase, per user): SSE/WebSocket progress (replace polling),
   Prometheus `/metrics` (queue depth, jobs, transcode duration), graceful worker shutdown +
   readiness/liveness probes, **cache purge-on-revoke** (Cloudflare API on public→private flip),
   rate limiting + request-schema validation.

## Open questions / known caveats

- **public→private revocation**: flipping a cached public video to private does NOT evict
  already-cached copies for the TTL (inherent CDN property; confirmed). Fix = purge-on-revoke
  (Tier 2). Current contract: set visibility before sharing.
- Thumbnails bucket still anonymous-read — private videos' thumbnail frames are technically
  public; SPA doesn't surface thumbs yet, revisit if posters are added.
- Corrupt-file `error_message` still includes the temp source path (cosmetic).
