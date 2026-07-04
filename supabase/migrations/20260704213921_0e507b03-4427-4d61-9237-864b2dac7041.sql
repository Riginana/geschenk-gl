DROP POLICY IF EXISTS "product-images: public read (anon)" ON storage.objects;
DROP POLICY IF EXISTS "product-images: public read (authenticated)" ON storage.objects;