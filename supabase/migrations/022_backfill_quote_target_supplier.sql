-- Backfill direct quote target suppliers from buyer activity events.
-- Some quotes created before target_supplier_id existed still have the source supplier
-- recorded on buyer_activity_events.
WITH latest_direct_quote_events AS (
  SELECT DISTINCT ON (quote_request_id)
    quote_request_id,
    supplier_id
  FROM buyer_activity_events
  WHERE event_type = 'quote_created'
    AND quote_request_id IS NOT NULL
    AND supplier_id IS NOT NULL
  ORDER BY quote_request_id, created_at DESC
)
UPDATE quote_requests quotes
SET target_supplier_id = events.supplier_id
FROM latest_direct_quote_events events
JOIN users suppliers ON suppliers.id = events.supplier_id
WHERE quotes.id = events.quote_request_id
  AND quotes.target_supplier_id IS NULL
  AND suppliers.is_supplier = true;
