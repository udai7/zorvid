-- Onboarding profile fields for users (Phase 2).
-- Nullable so pre-existing rows remain valid; new registrations always set them.

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name  text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone      text;
