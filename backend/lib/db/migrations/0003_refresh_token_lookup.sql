-- Add an indexed lookup key to refresh_tokens.
--
-- token_hash is bcrypt, so it cannot be searched: verifying a refresh token
-- meant bcrypt-comparing it against every live row for that user. Measured at
-- cost 10 that is ~53 ms per row, so an account with 22 live tokens spent over
-- a second of CPU per refresh — and the count only grows, because every login
-- and every refresh mints one.
--
-- token_lookup holds SHA-256 of the raw token, which is indexable, so the row
-- is found directly and bcrypt runs once. The raw token is 160 bits of CSPRNG
-- output, so its SHA-256 is not reversible by brute force.
--
-- Safe to apply while running: the column is nullable and existing rows keep
-- working through the fallback scan in TokenService.
--
-- Non-unique by intent. A unique constraint on a table that already has rows
-- makes drizzle-kit offer to TRUNCATE it (see 0002), and uniqueness buys
-- nothing here — lookups are always scoped by user_id as well.

BEGIN;

ALTER TABLE refresh_tokens
  ADD COLUMN IF NOT EXISTS token_lookup varchar(64);

CREATE INDEX IF NOT EXISTS refresh_tokens_token_lookup_idx
  ON refresh_tokens (token_lookup);

-- The verify path also filters on user_id; it had no index either.
CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx
  ON refresh_tokens (user_id);

COMMIT;
