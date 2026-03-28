-- ============================================================
-- Robust signup: mirror auth.users into public.users
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    auth_id,
    email,
    company_name,
    rut,
    city,
    address,
    description,
    phone,
    whatsapp,
    website,
    is_supplier,
    is_buyer
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'company_name', ''), split_part(NEW.email, '@', 1)),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'rut', ''), 'pendiente-' || left(NEW.id::text, 8)),
    NULLIF(NEW.raw_user_meta_data->>'city', ''),
    NULLIF(NEW.raw_user_meta_data->>'address', ''),
    NULLIF(NEW.raw_user_meta_data->>'description', ''),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'whatsapp', ''),
    NULLIF(NEW.raw_user_meta_data->>'website', ''),
    COALESCE((NEW.raw_user_meta_data->>'is_supplier')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'is_buyer')::boolean, false)
  )
  ON CONFLICT (auth_id) DO UPDATE SET
    email = EXCLUDED.email,
    company_name = EXCLUDED.company_name,
    rut = EXCLUDED.rut,
    city = EXCLUDED.city,
    address = EXCLUDED.address,
    description = EXCLUDED.description,
    phone = EXCLUDED.phone,
    whatsapp = EXCLUDED.whatsapp,
    website = EXCLUDED.website,
    is_supplier = EXCLUDED.is_supplier,
    is_buyer = EXCLUDED.is_buyer;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_sync_public_user ON auth.users;
CREATE TRIGGER on_auth_user_created_sync_public_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
