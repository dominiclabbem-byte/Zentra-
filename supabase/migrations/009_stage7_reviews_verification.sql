ALTER TABLE users
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

UPDATE users
SET
  verification_status = CASE
    WHEN verified THEN 'verified'
    ELSE 'pending'
  END,
  verified_at = CASE
    WHEN verified AND verified_at IS NULL THEN COALESCE(created_at, now())
    ELSE verified_at
  END;

CREATE TABLE IF NOT EXISTS verification_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('rut', 'company', 'buyer_profile', 'supplier_profile', 'bank_account')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  document_label TEXT,
  reviewer_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_records_user ON verification_records(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_one_per_offer_per_reviewer
  ON reviews(reviewer_id, quote_offer_id)
  WHERE quote_offer_id IS NOT NULL;

INSERT INTO verification_records (user_id, verification_type, status, document_label, reviewed_at)
SELECT
  users.id,
  CASE
    WHEN users.is_supplier THEN 'supplier_profile'
    ELSE 'buyer_profile'
  END,
  'approved',
  CASE
    WHEN users.is_supplier THEN 'Ficha comercial validada'
    ELSE 'Perfil comprador validado'
  END,
  COALESCE(users.verified_at, users.created_at, now())
FROM users
WHERE users.verified = true
  AND NOT EXISTS (
    SELECT 1
    FROM verification_records records
    WHERE records.user_id = users.id
      AND records.status = 'approved'
  );

CREATE OR REPLACE FUNCTION can_review_quote_offer(
  p_reviewer_id UUID,
  p_reviewed_id UUID,
  p_quote_offer_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM quote_offers offers
    JOIN quote_requests requests ON requests.id = offers.quote_id
    WHERE offers.id = p_quote_offer_id
      AND offers.status = 'accepted'
      AND (
        (requests.buyer_id = p_reviewer_id AND offers.supplier_id = p_reviewed_id)
        OR
        (offers.supplier_id = p_reviewer_id AND requests.buyer_id = p_reviewed_id)
      )
      AND NOT EXISTS (
        SELECT 1
        FROM reviews reviews_row
        WHERE reviews_row.quote_offer_id = offers.id
          AND reviews_row.reviewer_id = p_reviewer_id
      )
  );
$$;

ALTER TABLE verification_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews: crear propia" ON reviews;

CREATE POLICY "Reviews: crear elegible" ON reviews
  FOR INSERT WITH CHECK (
    reviewer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    AND can_review_quote_offer(reviewer_id, reviewed_id, quote_offer_id)
  );

CREATE POLICY "Verification records: ver propios o aprobados" ON verification_records
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR status = 'approved'
  );

CREATE POLICY "Verification records: crear propios" ON verification_records
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );
