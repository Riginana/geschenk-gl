
CREATE POLICY "product-images: public read (anon)"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'product-images');

CREATE POLICY "product-images: public read (authenticated)"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'product-images');
