ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS frame_material text NOT NULL DEFAULT 'holz';

ALTER TABLE public.products
  ADD CONSTRAINT products_frame_material_check
  CHECK (frame_material IN ('papier','holz','hdf'));

ALTER TABLE public.frame_prices
  ADD COLUMN IF NOT EXISTS material text;

DROP INDEX IF EXISTS public.frame_prices_unique_combo;

CREATE UNIQUE INDEX frame_prices_unique_combo ON public.frame_prices USING btree (
  COALESCE(product_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(material, '__global__'),
  size,
  variant
);