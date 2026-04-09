-- Fix products RLS so suppliers can create and update their own catalog rows
DROP POLICY IF EXISTS "Products: CRUD propio" ON products;

CREATE POLICY "Products: crear propio" ON products
  FOR INSERT
  WITH CHECK (
    supplier_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Products: actualizar propio" ON products
  FOR UPDATE
  USING (
    supplier_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    supplier_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Products: eliminar propio" ON products
  FOR DELETE
  USING (
    supplier_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Queue for future external delivery workers (email / SMS)
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL,
  source_id UUID,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  destination TEXT NOT NULL,
  template_key TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  provider TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  attempts_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_recipient_created
  ON notification_deliveries(recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status
  ON notification_deliveries(status, channel, created_at ASC);

ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Notification deliveries: recipient sees own" ON notification_deliveries;
CREATE POLICY "Notification deliveries: recipient sees own" ON notification_deliveries
  FOR SELECT USING (
    recipient_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR actor_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "Notification deliveries: actor inserts" ON notification_deliveries;
CREATE POLICY "Notification deliveries: actor inserts" ON notification_deliveries
  FOR INSERT WITH CHECK (
    actor_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "Notification deliveries: recipient updates own" ON notification_deliveries;
CREATE POLICY "Notification deliveries: recipient updates own" ON notification_deliveries
  FOR UPDATE USING (
    recipient_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    recipient_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

DROP TRIGGER IF EXISTS trg_notification_deliveries_updated_at ON notification_deliveries;
CREATE TRIGGER trg_notification_deliveries_updated_at
  BEFORE UPDATE ON notification_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
