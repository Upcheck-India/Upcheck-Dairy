-- Add the Google identity columns to farmers: `google_id` (the OAuth `sub`
-- claim) and `avatar_url` (the provider profile picture).
--
-- Apply this BEFORE `pnpm --filter @workspace/db push`. Left to itself,
-- drizzle-kit sees a new UNIQUE constraint on a table that already holds rows
-- and offers to TRUNCATE farmers to guarantee it can be satisfied. That is
-- unnecessary and destructive: the column is new, so every existing row is
-- NULL, and Postgres does not treat NULLs as conflicting under a unique
-- index. Adding it by hand keeps the data. Once this has run, push sees the
-- columns already matching the schema and leaves them alone.

BEGIN;

ALTER TABLE farmers
  ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE farmers
  ADD COLUMN IF NOT EXISTS google_id varchar(255);

-- Backfilled lazily: AuthService.googleLogin stamps google_id on an existing
-- farmer the first time they sign in with Google, matching on email.
ALTER TABLE farmers
  DROP CONSTRAINT IF EXISTS farmers_google_id_unique;

ALTER TABLE farmers
  ADD CONSTRAINT farmers_google_id_unique UNIQUE (google_id);

COMMIT;
