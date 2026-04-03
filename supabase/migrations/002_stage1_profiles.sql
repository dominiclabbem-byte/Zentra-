-- ============================================================
-- ZENTRA Stage 1 - perfiles duales buyer/supplier
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'category_scope'
  ) THEN
    CREATE TYPE category_scope AS ENUM ('buyer_interest', 'supplier_catalog');
  END IF;
END $$;

ALTER TABLE user_categories
  ADD COLUMN IF NOT EXISTS scope category_scope NOT NULL DEFAULT 'supplier_catalog';

ALTER TABLE user_categories
  DROP CONSTRAINT IF EXISTS user_categories_pkey;

ALTER TABLE user_categories
  ADD CONSTRAINT user_categories_pkey PRIMARY KEY (user_id, category_id, scope);
