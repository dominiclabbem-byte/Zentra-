DROP POLICY IF EXISTS "Product images owner insert" ON storage.objects;
CREATE POLICY "Product images owner insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id::text = (storage.foldername(name))[1]
        AND users.auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Product images owner update" ON storage.objects;
CREATE POLICY "Product images owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id::text = (storage.foldername(name))[1]
        AND users.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id::text = (storage.foldername(name))[1]
        AND users.auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Product images owner delete" ON storage.objects;
CREATE POLICY "Product images owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id::text = (storage.foldername(name))[1]
        AND users.auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Avatars owner insert" ON storage.objects;
CREATE POLICY "Avatars owner insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id::text = (storage.foldername(name))[1]
        AND users.auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Avatars owner update" ON storage.objects;
CREATE POLICY "Avatars owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id::text = (storage.foldername(name))[1]
        AND users.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id::text = (storage.foldername(name))[1]
        AND users.auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Avatars owner delete" ON storage.objects;
CREATE POLICY "Avatars owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id::text = (storage.foldername(name))[1]
        AND users.auth_id = auth.uid()
    )
  );
