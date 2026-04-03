-- ============================================================
-- Fix: allow authenticated users to create their own public profile
-- ============================================================

DROP POLICY IF EXISTS "Users: crear propio" ON users;
CREATE POLICY "Users: crear propio" ON users
  FOR INSERT
  WITH CHECK (auth_id = auth.uid());
