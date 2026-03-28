-- ============================================================
-- Stage 8: Price alerts hardening
-- - Evita duplicados por buyer/producto o buyer/categoria
-- - Mejora acceso al feed reciente de cambios de precio
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_price_alerts_product_created_desc
  ON price_alerts(product_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_price_alert_subscriptions_unique_product
  ON price_alert_subscriptions(buyer_id, product_id)
  WHERE product_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_price_alert_subscriptions_unique_category
  ON price_alert_subscriptions(buyer_id, category_id)
  WHERE product_id IS NULL AND category_id IS NOT NULL;
