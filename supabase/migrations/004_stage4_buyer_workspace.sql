-- ============================================================
-- Stage 4: Buyer workspace operativo
-- - RLS para alertas de precio
-- - Trigger para generar alertas cuando cambia el precio
-- - Indices para subscriptions buyer-side
-- ============================================================

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alert_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_price_alert_subscriptions_buyer
  ON price_alert_subscriptions(buyer_id);

CREATE INDEX IF NOT EXISTS idx_price_alert_subscriptions_product
  ON price_alert_subscriptions(product_id)
  WHERE product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_price_alert_subscriptions_category
  ON price_alert_subscriptions(category_id)
  WHERE category_id IS NOT NULL;

DROP POLICY IF EXISTS "Price alerts: buyer ve relevantes" ON price_alerts;
CREATE POLICY "Price alerts: buyer ve relevantes" ON price_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM price_alert_subscriptions pas
      JOIN products p ON p.id = price_alerts.product_id
      WHERE pas.buyer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
        AND (
          pas.product_id = price_alerts.product_id
          OR (pas.product_id IS NULL AND pas.category_id = p.category_id)
        )
    )
  );

DROP POLICY IF EXISTS "Price alerts: supplier registra cambios propios" ON price_alerts;
CREATE POLICY "Price alerts: supplier registra cambios propios" ON price_alerts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM products p
      WHERE p.id = price_alerts.product_id
        AND p.supplier_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Price alert subscriptions: propias" ON price_alert_subscriptions;
CREATE POLICY "Price alert subscriptions: propias" ON price_alert_subscriptions
  FOR ALL USING (
    buyer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    buyer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE OR REPLACE FUNCTION create_price_alert_on_product_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.price IS DISTINCT FROM OLD.price THEN
    INSERT INTO price_alerts (product_id, old_price, new_price, direction)
    VALUES (
      NEW.id,
      OLD.price,
      NEW.price,
      CASE
        WHEN NEW.price > OLD.price THEN 'up'
        ELSE 'down'
      END
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_price_alert ON products;
CREATE TRIGGER trg_products_price_alert
  AFTER UPDATE OF price ON products
  FOR EACH ROW
  WHEN (OLD.price IS DISTINCT FROM NEW.price)
  EXECUTE FUNCTION create_price_alert_on_product_price_change();
