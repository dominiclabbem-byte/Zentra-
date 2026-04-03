-- ============================================================
-- Stage 10 (in-app first): Notifications
-- - Feed in-app para buyer/supplier
-- - Base para email futuro
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created
  ON notifications(recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON notifications(recipient_id, read_at, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Notifications: recipient sees own" ON notifications;
CREATE POLICY "Notifications: recipient sees own" ON notifications
  FOR SELECT USING (
    recipient_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "Notifications: recipient updates own" ON notifications;
CREATE POLICY "Notifications: recipient updates own" ON notifications
  FOR UPDATE USING (
    recipient_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    recipient_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "Notifications: actor inserts" ON notifications;
CREATE POLICY "Notifications: actor inserts" ON notifications
  FOR INSERT WITH CHECK (
    actor_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );
