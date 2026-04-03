-- ============================================================
-- Stage 8.5: Billing foundation for Flow
-- - Prepara suscripciones para checkout/webhook futuro
-- - Mantiene el flujo interno actual para desarrollo
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'subscription_status'
      AND e.enumlabel = 'pending_payment'
  ) THEN
    ALTER TYPE subscription_status ADD VALUE 'pending_payment';
  END IF;
END $$;

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS billing_provider TEXT NOT NULL DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS billing_status TEXT NOT NULL DEFAULT 'paid',
  ADD COLUMN IF NOT EXISTS billing_reference TEXT,
  ADD COLUMN IF NOT EXISTS billing_customer_email TEXT,
  ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

UPDATE subscriptions
SET
  billing_provider = COALESCE(billing_provider, 'internal'),
  billing_status = CASE
    WHEN status::text = 'active' THEN 'paid'
    WHEN status::text = 'pending_payment' THEN 'pending_checkout'
    WHEN status::text = 'past_due' THEN 'payment_failed'
    WHEN status::text = 'cancelled' THEN 'cancelled'
    ELSE 'paid'
  END,
  paid_at = CASE WHEN status::text = 'active' AND paid_at IS NULL THEN started_at ELSE paid_at END,
  cancelled_at = CASE WHEN status::text = 'cancelled' AND cancelled_at IS NULL THEN now() ELSE cancelled_at END
WHERE TRUE;

CREATE INDEX IF NOT EXISTS idx_subscriptions_supplier_status_started
  ON subscriptions(supplier_id, status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_reference
  ON subscriptions(billing_reference)
  WHERE billing_reference IS NOT NULL;
