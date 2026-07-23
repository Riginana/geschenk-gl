
-- Backups
DROP TABLE IF EXISTS public.products_backup_20260723;
DROP TABLE IF EXISTS public.reviews_product_link_backup_20260723;

CREATE TABLE public.products_backup_20260723 AS
  SELECT * FROM public.products;

CREATE TABLE public.reviews_product_link_backup_20260723 AS
  SELECT r.id AS review_id, r.product_id AS old_product_id, p.slug AS product_slug
  FROM public.reviews r
  JOIN public.products p ON p.id = r.product_id
  WHERE r.product_id IS NOT NULL;

ALTER TABLE public.products_backup_20260723 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews_product_link_backup_20260723 ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.products_backup_20260723 TO service_role;
GRANT ALL ON public.reviews_product_link_backup_20260723 TO service_role;

-- Extend products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS material_label text,
  ADD COLUMN IF NOT EXISTS discount_percent integer NOT NULL DEFAULT 30 CHECK (discount_percent >= 0 AND discount_percent <= 90),
  ADD COLUMN IF NOT EXISTS hero_image text,
  ADD COLUMN IF NOT EXISTS hover_image text,
  ADD COLUMN IF NOT EXISTS is_bestseller boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS in_stock boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.products DROP COLUMN IF EXISTS formats;
ALTER TABLE public.products DROP COLUMN IF EXISTS images;

-- product_images
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  role text NOT NULL CHECK (role IN ('hero','gallery','product','thumbnail')),
  sort_order integer NOT NULL DEFAULT 0,
  alt text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS product_images_product_role_idx
  ON public.product_images (product_id, role, sort_order);

GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read images of active products" ON public.product_images;
CREATE POLICY "Public can read images of active products"
  ON public.product_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_images.product_id AND p.is_active = true));

-- product_variants
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  format text CHECK (format IS NULL OR format IN ('A5','A4','A3')),
  material text NOT NULL CHECK (material IN ('holz','papier','kraftpapier')),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  is_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS product_variants_unique_with_format
  ON public.product_variants (product_id, format, material) WHERE format IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS product_variants_unique_no_format
  ON public.product_variants (product_id, material) WHERE format IS NULL;

GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read variants of active products" ON public.product_variants;
CREATE POLICY "Public can read variants of active products"
  ON public.product_variants FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variants.product_id AND p.is_active = true));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
