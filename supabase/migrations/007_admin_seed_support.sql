-- ============================================================
-- Stage 7: admin support for seed/backfill
-- - adds explicit admin flag to public.users
-- - index for admin lookup
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_is_admin
  ON users(is_admin)
  WHERE is_admin = true;
