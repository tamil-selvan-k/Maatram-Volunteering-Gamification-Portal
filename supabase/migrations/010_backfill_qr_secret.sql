-- Backfill qr_secret for existing opportunities that don't have one,
-- and auto-generate for all future inserts via a trigger.

-- 1. Backfill existing rows
update opportunities
set qr_secret = encode(gen_random_bytes(32), 'hex')
where qr_secret is null;

-- 2. Default for future inserts so it's never null even if the app layer skips it
alter table opportunities
  alter column qr_secret set default encode(gen_random_bytes(32), 'hex');
