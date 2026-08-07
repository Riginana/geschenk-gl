CREATE TABLE public.holzplatte_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  size text NOT NULL,
  original_price numeric(10,2) NOT NULL,
  discount_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX holzplatte_prices_product_size_key
  ON public.holzplatte_prices (product_id, size)
  WHERE product_id IS NOT NULL;
CREATE UNIQUE INDEX holzplatte_prices_global_size_key
  ON public.holzplatte_prices (size)
  WHERE product_id IS NULL;

GRANT SELECT ON public.holzplatte_prices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.holzplatte_prices TO authenticated;
GRANT ALL ON public.holzplatte_prices TO service_role;

ALTER TABLE public.holzplatte_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read holzplatte prices"
  ON public.holzplatte_prices FOR SELECT USING (true);

CREATE POLICY "Admins can manage holzplatte prices"
  ON public.holzplatte_prices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_holzplatte_prices_updated_at
  BEFORE UPDATE ON public.holzplatte_prices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.holzplatte_prices (product_id, size, original_price, discount_percent)
VALUES (NULL, '13x18', 19.00, 30), (NULL, '11x15', 15.00, 30);