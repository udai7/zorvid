# Third-party notices

Zorvid is MIT-licensed (see `LICENSE`). It builds on open-source components that
retain their own licenses:

- **FFmpeg** — used by the worker for transcoding, invoked as a **separate
  executable** (installed from the Alpine package in the worker image, not
  linked into or redistributed with our code). FFmpeg is licensed under the
  LGPL/GPL depending on build options. See https://ffmpeg.org/legal.html
- **npm dependencies** (Fastify, BullMQ, hls.js, React, Tailwind, the AWS SDK,
  `pg`, `argon2`, `nodemailer`, `google-auth-library`, etc.) — each retains its
  own license (predominantly MIT / ISC / Apache-2.0). Full texts are distributed
  inside each package under `node_modules/<pkg>/LICENSE`.
- **Docker base images** (`node:20-alpine`, `postgres:16-alpine`, `redis:7-alpine`,
  `minio/minio`, `nginx`) — governed by their respective upstream licenses.

No third-party source is vendored into this repository; dependencies are fetched
at build time.
