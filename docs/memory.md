# Memory — Video Processing Pipeline (VOD)

Last updated: 2026-06-26

Self-hosted video-on-demand platform: upload → transcode → adaptive HLS streaming.
Full design in `docs/architecture.md`; build broken into steps in `docs/steps.md`; user-facing
overview in root `README.md`; personal interview prep in `docs/STUDY_GUIDE.md` (GITIGNORED).
Stack: Node 20 + TypeScript, Fastify, BullMQ + Redis, FFmpeg, MinIO (S3), Postgres, nginx,
React + Vite + hls.js.
npm workspaces monorepo: `packages/shared`, `packages/api`, `packages/worker`.
`packages/web` (React SPA) is a STANDALONE package (NOT in root workspaces) so its frontend
deps don't entangle the backend image installs. Web now uses **Tailwind v4 + Framer Motion +
GSAP** (added 2026-06-26) — has its OWN `package-lock.json`; web Dockerfile does `npm install`
(not `ci`), so updating `packages/web/package.json` is enough for the image build.

## Progress: feature-complete (all 8 steps) + hardened + verified under docker compose

- **Steps 0–8** done (auth, upload+enqueue, FFmpeg worker, streaming, dashboard, CDN/caching).
- Added: React UI, tests + CI, migrations-in-image fix, full Docker/compose hosting, README,
  mermaid diagrams, doc updates.
- **`docker compose up` now works end-to-end on this host** (was previously blocked — no Compose
  CLI). Verified the full pipeline live, then torn down.

### Git state
- Branch **`feat/react-ui-tests-ci-hosting`** pushed to origin
  (`udai7/video_processing_pipeline`), commit `93db232`. `main` is behind it.
- **Uncommitted (2026-06-26 session): full UI redesign** — see below. Plus the earlier
  README CI-badge fix and a small backend change (`videos.ts` list query). Not committed yet.
- PR not opened yet.

## 2026-06-26 session — Medusa-style UI redesign (Tailwind + Framer + GSAP)

User asked to (1) add a landing page w/ a sign-in button → auth → dashboard, (2) fix that the
dashboard felt "stuck" during transcoding, then (3) restyle the WHOLE app to look like
**medusajs.com** (clean, professional, light) — screenshots in `screenshot/` (gitignore these;
don't commit). User explicitly chose "whole app → light Medusa style" and "use GSAP + Framer
Motion + Tailwind".

**Root cause of "stuck" (the real fix, backend):** `GET /api/videos` (list) never joined the
`jobs` table, so `progress`/`stage` were always undefined → bar stuck at 0%, substatus always
"queued · 0%". Only the detail route (`GET /:id`) joined jobs. Fixed `packages/api/src/routes/
videos.ts` list query to `LEFT JOIN jobs j ON j.video_id = v.id` and select `j.progress,
j.stage, j.error_message` (mirrors the detail query; assumes ≤1 job/video). The dashboard polls
the LIST, so this is what makes the bars actually move.

**Frontend (`packages/web`):**
- **Stack added**: `tailwindcss` + `@tailwindcss/vite` (v4, CSS-first `@theme` in `index.css`,
  NO tailwind.config.js), `framer-motion`, `gsap`. Vite plugin wired in `vite.config.ts`.
- **Design system** = light "Medusa" look: white paper, hairline borders (`--color-line`),
  near-black ink, `brand` blue accent, mono bracket eyebrows (`[ OPEN SOURCE ]`), solid-black
  primary buttons / white-outline secondary. Theme tokens in `src/index.css` `@theme`. Shared
  button class strings + `cn()` in `src/lib/ui.ts`.
- **New `components/Landing.tsx`**: sticky nav (logo + GitHub link + black CTA), hero w/ staggered
  Framer entrance, hairline-divided 4-col feature row, 5-stage pipeline diagram + dark code block,
  CTA band, multi-column footer. Repo URL hardcoded `github.com/udai7/video_processing_pipeline`.
- **GSAP** `src/hooks/useReveal.ts` — ScrollTrigger fade+rise on `[data-reveal]` els, `once:true`,
  honors reduced-motion.
- **Framer**: `App.tsx` uses `AnimatePresence mode="wait"` for Landing↔Auth↔Dashboard page
  transitions; video cards use `layout` + scale in/out; Player modal scales in; buttons
  `whileHover`/`whileTap`.
- Restyled `Login` (light card + `←back` + onBack prop), `Dropzone`, `VideoCard`, `Player` to
  Tailwind. **Kept the transcoding animations** (sheen bar / indeterminate bar / spinner badge /
  humanized STAGE_LABELS) — now CSS classes `.bar-sheen` / `.bar-indeterminate` in index.css.
- **GOTCHA**: Framer Motion v12 rejects `ease: [..]` typed as `number[]` — cubic-bezier tuples
  MUST be `as const` (e.g. `ease: [0.22,1,0.36,1] as const`). Build failed until added everywhere.

**Verified**: `npm run build` (tsc --noEmit + vite) passes; nginx rebuilt + serving new bundle
(`docker compose up -d --build nginx` with `POSTGRES_HOST_PORT=55433 HTTP_HOST_PORT=8090`);
list endpoint confirmed returning `progress`/`stage`. NOT visually verified in-browser — the
Chrome extension was not connected this session. Bundle grew to ~933 KB (303 KB gzip) from
gsap+framer; not code-split.

## What was built / changed (this session)

**React SPA — `packages/web/`** (Vite + React + TS, replaced the deleted `static/` dashboard):
- `src/api.ts` typed client (JWT in localStorage; upload via XHR for progress; 401 auto-logout).
- `src/types.ts` (local API response shapes). `src/hooks/useVideos.ts` (~1s polling while
  anything non-terminal). `src/components/`: `Login`, `Dropzone` (drag-drop + upload %),
  `VideoCard`, `Player` (hls.js modal, adaptive ABR + manual quality chips; private token via
  `xhrSetup`). `src/index.css` dark theme. `vite.config.ts` proxies `/api`→:3000 in dev.
- `packages/web/Dockerfile` multi-stage: builds SPA → serves via nginx + `nginx/nginx.conf`.

**Migrations-in-image fix (`packages/api`)**: build = `tsc && rm -rf dist/db/migrations &&
cp -r src/db/migrations dist/db/migrations` (idempotent). Added `migrate:prod` + `test` scripts.
Removed dead dep `@aws-sdk/s3-request-presigner`.

**Tests + CI**: `server.ts` exports `buildApp({logger})` (no listen; auto-starts only when run
directly). `packages/api/test/` — `helpers.ts`, `auth/videos/streams.test.ts` (streams test seeds
a completed video + master.m3u8 in MinIO to test authz without the worker). Uses `node:test` +
`tsx` (NOT vitest — avoids .js→.ts Vite resolver pain with NodeNext). 10 tests, all pass.
`.github/workflows/ci.yml`: Postgres+Redis as services, MinIO via a `docker run` step (service
containers can't pass `server /data`), then build → migrate → test → SPA build.

**Compose / hosting (`docker-compose.yml`)**:
- One-shot `migrate` service; `api` depends on it `service_completed_successfully`.
- `nginx` BUILDS from `packages/web/Dockerfile` (bundles the React build).
- `createbuckets` no longer sets `outputs` anonymous (outputs is private; thumbs still anon).
- **Published host ports are env-overridable** (`HTTP_HOST_PORT`, `POSTGRES_HOST_PORT`,
  `REDIS_HOST_PORT`, `MINIO_API_HOST_PORT`, `MINIO_CONSOLE_HOST_PORT`) with defaults; documented
  in `.env.example`. Added `.dockerignore`.

**Docs**: new root `README.md`; `docs/architecture.md` §3 now has **mermaid** component +
sequence diagrams (replaced the stale ASCII one); §5/§8/§9 updated; `docs/steps.md` Steps
2/6/7/8 updated to the React UI + API-proxy streaming model. `docs/STUDY_GUIDE.md` added
(gitignored personal interview prep). The `remember` skill (`.agents/skills/remember/SKILL.md`,
symlinked from `.claude/`) now saves/restores to **`docs/memory.md`** (was project root).

## Key decisions (load-bearing)

- **Serve ALL HLS through the API proxy `/api/videos/:id/hls/*`, not presigned MinIO URLs** —
  hls.js fetches nested playlists/segments via RELATIVE URLs → drops query-string signatures, so
  presigning only loads the master. A header token re-applied per request via hls.js `xhrSetup`
  works for nested HLS AND keeps private content genuinely private.
- **outputs bucket is PRIVATE**; public delivery + CDN caching = nginx/Cloudflare caching the
  API's PUBLIC proxy responses (`Cache-Control: public, immutable`); private = `no-store`.
- Private stream token TTL = `SIGNED_URL_TTL`. `PATCH /:id` sets visibility.
- nginx cache: `location ~ ^/api/videos/[^/]+/hls/` with `proxy_cache` + `X-Cache-Status`.

## Problems solved (don't re-solve)

- **`docker compose` was unavailable** — installed the plugin to `~/.docker/cli-plugins/docker-compose`
  (v5.2.0) via curl from GitHub releases, NO sudo. Persists for the user.
- **Host port conflicts on THIS machine**: 5432 (a host Postgres) and 8080 (a Python app) are
  taken; 6379/9000 free. Other Supabase stacks run on 543xx/553xx. Solution = env-overridable
  ports (above). Demonstrated `up` with `POSTGRES_HOST_PORT=55433 HTTP_HOST_PORT=8090
  MINIO_API_HOST_PORT=59000 MINIO_CONSOLE_HOST_PORT=59001 REDIS_HOST_PORT=56380`.
- **Docker build caught a missing `@types/node` in `packages/web`** that local builds masked
  (root node_modules hoisted it) — now in web devDeps; required for the isolated image build.
- nginx `proxy_cache_path` is valid in `nginx/nginx.conf` because the file is `include`d inside
  the main `http{}` block. Standalone `docker run` of the web image returns 000 unless the `api`
  upstream host resolves (nginx resolves upstreams at startup) — fine under compose.
- Dev gotchas: foreground servers in `run_in_background:true` with absolute `tsx` paths; ffmpeg
  6.1.1 on host PATH; verify with direct `docker run` on alt ports if needed.

## Current state — verified

- Backend builds (shared/api/worker); web typechecks + Vite builds; `npm ci` lock consistent.
- 10/10 API tests pass against real containers.
- Compiled prod migration creates all tables on a fresh DB and is idempotent.
- **Full `docker compose up -d --build` ran on this host**: all 7 services healthy, `migrate`
  applied + exited, SPA served via nginx, and a real upload→transcode→3-rendition HLS→authorized
  private stream all succeeded. Torn down with `docker compose down -v`.

## Next session could start with

0. **Visually verify the 2026-06-26 UI redesign in-browser** (extension was offline) — refresh
   http://localhost:8090, check Landing → Sign in → Dashboard, hover/scroll animations, and a
   real transcode showing the moving progress bar. Then commit the redesign (it's all uncommitted).
1. Open the PR for `feat/react-ui-tests-ci-hosting` (CI will run on it); commit the pending
   README badge fix first. NOTE: CI builds the web SPA — confirm Tailwind/Framer/GSAP build is
   green there too. `screenshot/` should be gitignored, not committed.
2. **Tier 2** (deferred to hosting phase, per user): SSE/WebSocket progress (replace polling),
   Prometheus `/metrics` (queue depth, jobs, transcode duration), graceful worker shutdown +
   readiness/liveness probes, **cache purge-on-revoke** (Cloudflare API on public→private flip),
   rate limiting + request-schema validation.

## Open questions / known caveats

- **public→private revocation**: flipping a cached public video to private does NOT evict
  already-cached copies for the TTL (inherent CDN property; confirmed). Fix = purge-on-revoke.
  Current contract: set visibility before sharing.
- `docs/memory.md` is TRACKED (not ignored) — it was pushed to the branch. Contains internal
  session notes; user may want to gitignore/remove it from a public portfolio repo (flagged, not
  yet actioned).
- Thumbnails bucket still anonymous-read; corrupt-file `error_message` still includes the temp
  source path (cosmetic).
