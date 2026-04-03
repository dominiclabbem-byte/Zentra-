CREATE TYPE quote_conversation_status AS ENUM ('active', 'closed');

CREATE TABLE IF NOT EXISTS quote_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  buyer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supplier_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status quote_conversation_status NOT NULL DEFAULT 'active',
  buyer_last_read_at TIMESTAMPTZ,
  supplier_last_read_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (quote_request_id, supplier_user_id)
);

CREATE TABLE IF NOT EXISTS quote_conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES quote_conversations(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(trim(body)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_conversations_quote_supplier
  ON quote_conversations(quote_request_id, supplier_user_id);

CREATE INDEX IF NOT EXISTS idx_quote_conversations_buyer
  ON quote_conversations(buyer_user_id, last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_quote_conversations_supplier
  ON quote_conversations(supplier_user_id, last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_quote_conversation_messages_conversation
  ON quote_conversation_messages(conversation_id, created_at ASC);

DROP TRIGGER IF EXISTS trg_quote_conversations_updated_at ON quote_conversations;
CREATE TRIGGER trg_quote_conversations_updated_at
  BEFORE UPDATE ON quote_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION ensure_quote_conversation_for_offer()
RETURNS TRIGGER AS $$
DECLARE
  quote_row quote_requests%ROWTYPE;
BEGIN
  SELECT *
  INTO quote_row
  FROM quote_requests
  WHERE id = NEW.quote_id;

  IF quote_row.id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO quote_conversations (
    quote_request_id,
    buyer_user_id,
    supplier_user_id,
    started_by_user_id
  )
  VALUES (
    NEW.quote_id,
    quote_row.buyer_id,
    NEW.supplier_id,
    COALESCE(NEW.responder_id, NEW.supplier_id)
  )
  ON CONFLICT (quote_request_id, supplier_user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quote_offers_ensure_conversation ON quote_offers;
CREATE TRIGGER trg_quote_offers_ensure_conversation
  AFTER INSERT ON quote_offers
  FOR EACH ROW EXECUTE FUNCTION ensure_quote_conversation_for_offer();

CREATE OR REPLACE FUNCTION sync_quote_conversation_status_from_quote()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('closed', 'cancelled') THEN
    UPDATE quote_conversations
    SET status = 'closed'
    WHERE quote_request_id = NEW.id
      AND status <> 'closed';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quote_requests_sync_conversations ON quote_requests;
CREATE TRIGGER trg_quote_requests_sync_conversations
  AFTER UPDATE OF status ON quote_requests
  FOR EACH ROW EXECUTE FUNCTION sync_quote_conversation_status_from_quote();

CREATE OR REPLACE FUNCTION sync_quote_conversation_message_side_effects()
RETURNS TRIGGER AS $$
DECLARE
  conversation_row quote_conversations%ROWTYPE;
BEGIN
  SELECT *
  INTO conversation_row
  FROM quote_conversations
  WHERE id = NEW.conversation_id;

  IF conversation_row.id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE quote_conversations
  SET
    last_message_at = NEW.created_at,
    buyer_last_read_at = CASE
      WHEN NEW.sender_user_id = conversation_row.buyer_user_id THEN NEW.created_at
      ELSE buyer_last_read_at
    END,
    supplier_last_read_at = CASE
      WHEN NEW.sender_user_id = conversation_row.supplier_user_id THEN NEW.created_at
      ELSE supplier_last_read_at
    END
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quote_conversation_messages_sync_conversation ON quote_conversation_messages;
CREATE TRIGGER trg_quote_conversation_messages_sync_conversation
  AFTER INSERT ON quote_conversation_messages
  FOR EACH ROW EXECUTE FUNCTION sync_quote_conversation_message_side_effects();

INSERT INTO quote_conversations (
  quote_request_id,
  buyer_user_id,
  supplier_user_id,
  started_by_user_id
)
SELECT
  offers.quote_id,
  requests.buyer_id,
  offers.supplier_id,
  COALESCE(offers.responder_id, offers.supplier_id)
FROM quote_offers offers
JOIN quote_requests requests ON requests.id = offers.quote_id
ON CONFLICT (quote_request_id, supplier_user_id) DO NOTHING;

ALTER TABLE quote_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_conversation_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Quote conversations: participants select" ON quote_conversations;
CREATE POLICY "Quote conversations: participants select" ON quote_conversations
  FOR SELECT USING (
    buyer_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR supplier_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "Quote conversations: participants insert" ON quote_conversations;
CREATE POLICY "Quote conversations: participants insert" ON quote_conversations
  FOR INSERT WITH CHECK (
    buyer_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR supplier_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "Quote conversations: participants update" ON quote_conversations;
CREATE POLICY "Quote conversations: participants update" ON quote_conversations
  FOR UPDATE USING (
    buyer_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR supplier_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    buyer_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR supplier_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "Quote conversation messages: participants select" ON quote_conversation_messages;
CREATE POLICY "Quote conversation messages: participants select" ON quote_conversation_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id
      FROM quote_conversations
      WHERE buyer_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
        OR supplier_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Quote conversation messages: participants insert" ON quote_conversation_messages;
CREATE POLICY "Quote conversation messages: participants insert" ON quote_conversation_messages
  FOR INSERT WITH CHECK (
    sender_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    AND conversation_id IN (
      SELECT id
      FROM quote_conversations
      WHERE status = 'active'
        AND (
          buyer_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
          OR supplier_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
        )
    )
  );
