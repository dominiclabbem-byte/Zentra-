-- ============================================================
-- Fix recursive RLS between quote_requests and quote_offers
-- ============================================================

DROP POLICY IF EXISTS "Quotes: buyer ve las suyas" ON quote_requests;
CREATE POLICY "Quotes: buyer ve las suyas" ON quote_requests
  FOR SELECT USING (
    buyer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR status IN ('open', 'in_review')
  );

DROP POLICY IF EXISTS "Offers: ver relevantes" ON quote_offers;
CREATE POLICY "Offers: ver relevantes" ON quote_offers
  FOR SELECT USING (
    supplier_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR quote_id IN (
      SELECT id FROM quote_requests
      WHERE buyer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );
