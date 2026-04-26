CREATE OR REPLACE FUNCTION ensure_quote_conversation_for_targeted_quote()
RETURNS TRIGGER AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  IF NEW.target_supplier_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO quote_conversations (
    quote_request_id,
    buyer_user_id,
    supplier_user_id,
    started_by_user_id
  )
  VALUES (
    NEW.id,
    NEW.buyer_id,
    NEW.target_supplier_id,
    COALESCE(NEW.requester_id, NEW.buyer_id)
  )
  ON CONFLICT (quote_request_id, supplier_user_id) DO NOTHING
  RETURNING id INTO v_conversation_id;

  IF v_conversation_id IS NULL THEN
    SELECT id
    INTO v_conversation_id
    FROM quote_conversations
    WHERE quote_request_id = NEW.id
      AND supplier_user_id = NEW.target_supplier_id
    LIMIT 1;
  END IF;

  IF v_conversation_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM quote_conversation_messages
    WHERE quote_conversation_messages.conversation_id = v_conversation_id
  ) THEN
    INSERT INTO quote_conversation_messages (
      conversation_id,
      sender_user_id,
      body
    )
    VALUES (
      v_conversation_id,
      COALESCE(NEW.requester_id, NEW.buyer_id),
      COALESCE(NULLIF(trim(NEW.notes), ''), 'Solicitud creada para ' || NEW.product_name || '. Cantidad: ' || NEW.quantity || ' ' || NEW.unit || '.')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quote_requests_ensure_targeted_conversation ON quote_requests;
CREATE TRIGGER trg_quote_requests_ensure_targeted_conversation
  AFTER INSERT ON quote_requests
  FOR EACH ROW EXECUTE FUNCTION ensure_quote_conversation_for_targeted_quote();
