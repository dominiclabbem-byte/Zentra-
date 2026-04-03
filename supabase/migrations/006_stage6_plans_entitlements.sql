-- ============================================================
-- Stage 6: planes, suscripciones y entitlements
-- - limites por plan
-- - RLS para gestionar suscripcion propia
-- - indice para una sola suscripcion activa por supplier
-- ============================================================

ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS max_active_products INTEGER,
  ADD COLUMN IF NOT EXISTS max_quote_responses_per_month INTEGER,
  ADD COLUMN IF NOT EXISTS max_ai_conversations_per_month INTEGER,
  ADD COLUMN IF NOT EXISTS max_voice_calls_per_month INTEGER;

UPDATE plans
SET
  max_active_products = CASE name
    WHEN 'starter' THEN 25
    WHEN 'pro' THEN 200
    WHEN 'enterprise' THEN NULL
  END,
  max_quote_responses_per_month = CASE name
    WHEN 'starter' THEN 20
    WHEN 'pro' THEN 250
    WHEN 'enterprise' THEN NULL
  END,
  max_ai_conversations_per_month = CASE name
    WHEN 'starter' THEN 0
    WHEN 'pro' THEN 200
    WHEN 'enterprise' THEN NULL
  END,
  max_voice_calls_per_month = CASE name
    WHEN 'starter' THEN 0
    WHEN 'pro' THEN 200
    WHEN 'enterprise' THEN NULL
  END;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_one_active_per_supplier
  ON subscriptions(supplier_id)
  WHERE status = 'active';

DROP POLICY IF EXISTS "Subscriptions: propias" ON subscriptions;

CREATE POLICY "Subscriptions: ver propias" ON subscriptions
  FOR SELECT USING (
    supplier_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Subscriptions: insertar propia" ON subscriptions
  FOR INSERT WITH CHECK (
    supplier_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Subscriptions: actualizar propia" ON subscriptions
  FOR UPDATE USING (
    supplier_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    supplier_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );
