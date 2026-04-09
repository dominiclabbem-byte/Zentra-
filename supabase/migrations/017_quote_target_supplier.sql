-- Add target_supplier_id to quote_requests so we can show the product owner on the buyer card
ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS target_supplier_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_quote_requests_target_supplier ON quote_requests(target_supplier_id);
