CREATE TABLE IF NOT EXISTS buyer_activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'search',
      'product_view',
      'supplier_view',
      'favorite_added',
      'favorite_removed',
      'quote_created'
    )
  ),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES users(id) ON DELETE SET NULL,
  quote_request_id UUID REFERENCES quote_requests(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  search_term TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_buyer_activity_events_buyer_created
  ON buyer_activity_events(buyer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_buyer_activity_events_buyer_type
  ON buyer_activity_events(buyer_id, event_type, created_at DESC);

ALTER TABLE buyer_activity_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyer activity events: owner select" ON buyer_activity_events;
CREATE POLICY "Buyer activity events: owner select" ON buyer_activity_events
  FOR SELECT USING (
    buyer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "Buyer activity events: owner insert" ON buyer_activity_events;
CREATE POLICY "Buyer activity events: owner insert" ON buyer_activity_events
  FOR INSERT WITH CHECK (
    buyer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );
