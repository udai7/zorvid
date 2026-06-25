-- Initial schema. See architecture.md §6.
-- Idempotent: safe to re-run.

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TYPE video_status AS ENUM (
    'pending', 'analyzing', 'transcoding', 'thumbnails',
    'packaging', 'completed', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE visibility AS ENUM ('private', 'public');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS videos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title               text NOT NULL,
  original_filename   text NOT NULL,
  status              video_status NOT NULL DEFAULT 'pending',
  visibility          visibility NOT NULL DEFAULT 'private',
  metadata            jsonb,
  master_playlist_key text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS videos_user_id_idx ON videos(user_id);

CREATE TABLE IF NOT EXISTS jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id      uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  progress      integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  stage         text,
  logs          text NOT NULL DEFAULT '',
  error_message text,
  attempts      integer NOT NULL DEFAULT 0,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS jobs_video_id_idx ON jobs(video_id);
