-- Widen animals.status from the animal_status enum to text.
--
-- Farmers can create their own herd categories, and a category is stored on the
-- animal as its status. An enum can only hold the five seeded categories, so the
-- column becomes free text.
--
-- Apply this BEFORE `pnpm --filter @workspace/db push`: drizzle-kit would
-- otherwise have to guess the enum -> text conversion. Once this has run, push
-- sees the column already matching the schema and leaves it alone.

BEGIN;

ALTER TABLE animals
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE animals
  ALTER COLUMN status TYPE text USING status::text;

ALTER TABLE animals
  ALTER COLUMN status SET DEFAULT 'lactating';

ALTER TABLE animals
  ALTER COLUMN status SET NOT NULL;

COMMIT;

-- Optional cleanup. The animal_status type has no remaining dependants once the
-- statement above has run; drop it separately so a failure here cannot roll back
-- the conversion.
-- DROP TYPE IF EXISTS animal_status;
