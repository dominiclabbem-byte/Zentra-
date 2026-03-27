DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum enum
    JOIN pg_type type ON type.oid = enum.enumtypid
    WHERE type.typname = 'quote_status' AND enum.enumlabel = 'in_progress'
  ) THEN
    ALTER TYPE quote_status RENAME VALUE 'in_progress' TO 'in_review';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum enum
    JOIN pg_type type ON type.oid = enum.enumtypid
    WHERE type.typname = 'offer_status' AND enum.enumlabel = 'withdrawn'
  ) THEN
    ALTER TYPE offer_status ADD VALUE 'withdrawn';
  END IF;
END $$;

ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS requester_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes TEXT;

UPDATE quote_requests
SET requester_id = buyer_id
WHERE requester_id IS NULL;

ALTER TABLE quote_requests
  ALTER COLUMN requester_id SET NOT NULL;

ALTER TABLE quote_offers
  ADD COLUMN IF NOT EXISTS responder_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS estimated_lead_time VARCHAR(100);

UPDATE quote_offers
SET responder_id = supplier_id
WHERE responder_id IS NULL;

ALTER TABLE quote_offers
  ALTER COLUMN responder_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quote_requests_requester ON quote_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_category ON quote_requests(category_id);
CREATE INDEX IF NOT EXISTS idx_quote_offers_responder ON quote_offers(responder_id);
CREATE INDEX IF NOT EXISTS idx_quote_offers_status ON quote_offers(status);

DROP POLICY IF EXISTS "Quotes: buyer ve las suyas" ON quote_requests;
CREATE POLICY "Quotes: buyer ve las suyas" ON quote_requests
  FOR SELECT USING (
    buyer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR status IN ('open', 'in_review')
    OR id IN (
      SELECT quote_id
      FROM quote_offers
      WHERE supplier_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "Quotes: buyer actualiza propias" ON quote_requests
  FOR UPDATE USING (
    buyer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    buyer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "Offers: supplier crea" ON quote_offers;
CREATE POLICY "Offers: supplier crea" ON quote_offers
  FOR INSERT WITH CHECK (
    supplier_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    AND responder_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    AND quote_id IN (
      SELECT id
      FROM quote_requests
      WHERE status IN ('open', 'in_review')
    )
  );

CREATE POLICY "Offers: actualizar relevantes" ON quote_offers
  FOR UPDATE USING (
    supplier_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR quote_id IN (
      SELECT id
      FROM quote_requests
      WHERE buyer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  )
  WITH CHECK (
    supplier_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR quote_id IN (
      SELECT id
      FROM quote_requests
      WHERE buyer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );
