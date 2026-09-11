ALTER TABLE public.product_size_variants
  ADD COLUMN IF NOT EXISTS discount_percent integer NOT NULL DEFAULT 0;

ALTER TABLE public.product_size_variants
  ADD CONSTRAINT product_size_variants_discount_percent_check
  CHECK (discount_percent >= 0 AND discount_percent <= 100);