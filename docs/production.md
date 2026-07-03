# Production deployment — zorvid.archilect.in

The app (nginx gateway + api + worker + postgres + minio + redis) runs via
`docker compose`. TLS is handled by **Cloudflare in front**; the origin nginx
stays on port 80 behind it.

## 1. Secrets (already set in `.env`)

- `JWT_SECRET` — strong random value (rotate with `openssl rand -hex 48`).
- `POSTGRES_PASSWORD` / `DATABASE_URL` — strong, matching. Changing the password
  requires recreating the postgres volume: `docker compose down -v` (DESTROYS
  data), then `docker compose up -d --build`.
- `MINIO_ROOT_PASSWORD` — strong; same volume caveat for MinIO.
- `SMTP_*` — Gmail app password for OTP email delivery.
- `GOOGLE_CLIENT_ID` + `VITE_GOOGLE_CLIENT_ID` — same OAuth web client ID.
  `VITE_GOOGLE_CLIENT_ID` is baked at build time → rebuild nginx after changes:
  `docker compose up -d --build nginx`.
- `MINIO_PUBLIC_URL` — set to `https://zorvid.archilect.in` in prod so HLS
  segment URLs point at the public domain.

## 2. DNS + Cloudflare (dashboard steps — do these yourself)

1. **DNS:** add an `A` record `zorvid.archilect.in` → the server's public IP,
   **proxied** (orange cloud ON).
2. **SSL/TLS mode:** Full (or Full (strict) if the origin later gets a cert).
3. **Edge certificates:** enable **Always Use HTTPS** and **HSTS**.
4. Origin firewall: only allow inbound 80/443 from Cloudflare IP ranges if you
   want to lock it down.

nginx already recovers the real visitor IP from Cloudflare's `CF-Connecting-IP`
(see `nginx/nginx.conf`), so API rate-limiting keys on the true client IP.

## 3. Google sign-in (Google Cloud Console — do yourself)

In Credentials → your OAuth 2.0 Web client → **Authorized JavaScript origins**
add `https://zorvid.archilect.in`. This flow uses ID tokens, so **no redirect
URI** is needed. The client secret is not used and need not be stored.

## 4. Launch / update

```bash
docker compose up -d --build          # build + start everything
docker compose logs -f api worker     # watch
curl -s https://zorvid.archilect.in/health   # -> {"status":"ok"}
```

Migrations run automatically (one-shot `migrate` service) before the API starts.

## 5. Operational limits (env-tunable)

- `MAX_VIDEO_SECONDS_PER_USER=600` — per-user total upload budget (10 min).
- `VIDEO_RETENTION_DAYS=2` — uploads auto-deleted after 2 days (worker reaper).
- `MAX_UPLOAD_BYTES` — per-file size cap.
- Auth endpoints are rate-limited (per IP); expired OTP rows are swept hourly.

## 6. Still recommended before heavy traffic

- Postgres + MinIO backups (volumes `pgdata`, `miniodata`).
- Error monitoring / log aggregation.
- Origin TLS + Cloudflare Full (strict) if you want end-to-end encryption.
- Email deliverability (SPF/DKIM) — fine while relaying through Gmail.
