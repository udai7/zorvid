-- Two-factor (email OTP) + Google sign-in support (Phase 3).

-- Track whether a user's email has been verified via OTP.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;

-- Link to a Google account; Google-only users have no local password.
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id text;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_idx ON users(google_id) WHERE google_id IS NOT NULL;

-- Short-lived one-time codes emailed to users for registration / login 2FA.
CREATE TABLE IF NOT EXISTS email_otps (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash   text NOT NULL,
  purpose     text NOT NULL,            -- 'register' | 'login'
  expires_at  timestamptz NOT NULL,
  consumed_at timestamptz,
  attempts    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_otps_user_idx ON email_otps(user_id);
