-- ============================================================
-- Stage 5: Supplier workspace operativo
-- - pipeline interno por oferta
-- - sincronizacion automatica con estado buyer-facing
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'offer_pipeline_status'
  ) THEN
    CREATE TYPE offer_pipeline_status AS ENUM (
      'submitted',
      'follow_up',
      'negotiation',
      'won',
      'lost'
    );
  END IF;
END $$;

ALTER TABLE quote_offers
  ADD COLUMN IF NOT EXISTS pipeline_status offer_pipeline_status;

UPDATE quote_offers
SET pipeline_status = CASE
  WHEN status = 'accepted' THEN 'won'::offer_pipeline_status
  WHEN status IN ('rejected', 'withdrawn') THEN 'lost'::offer_pipeline_status
  ELSE 'submitted'::offer_pipeline_status
END
WHERE pipeline_status IS NULL;

ALTER TABLE quote_offers
  ALTER COLUMN pipeline_status SET DEFAULT 'submitted';

CREATE INDEX IF NOT EXISTS idx_quote_offers_pipeline_status
  ON quote_offers(pipeline_status);

CREATE OR REPLACE FUNCTION sync_quote_offer_pipeline_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' THEN
    NEW.pipeline_status := 'won';
  ELSIF NEW.status IN ('rejected', 'withdrawn') THEN
    NEW.pipeline_status := 'lost';
  ELSIF NEW.pipeline_status IS NULL THEN
    NEW.pipeline_status := 'submitted';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quote_offers_sync_pipeline ON quote_offers;
CREATE TRIGGER trg_quote_offers_sync_pipeline
  BEFORE INSERT OR UPDATE OF status, pipeline_status ON quote_offers
  FOR EACH ROW
  EXECUTE FUNCTION sync_quote_offer_pipeline_status();
