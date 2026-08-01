CREATE TABLE public.frame_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  size text NOT NULL CHECK (size IN ('A5','A4','A3')),
  variant text NOT NULL CHECK (variant IN ('ohne_bilderrahmen','standard_weiss','echtholz_weiss','standard_schwarz','echtholz_schwarz','standard_dunkelbraun','echtholz_dunkelbraun')),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX frame_prices_unique_combo
  ON public.frame_prices (COALESCE(product_id, '00000000-0000-0000-0000-000000000000'::uuid), size, variant);

GRANT SELECT ON public.frame_prices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.frame_prices TO authenticated;
GRANT ALL ON public.frame_prices TO service_role;

ALTER TABLE public.frame_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read frame prices"
  ON public.frame_prices FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage frame prices"
  ON public.frame_prices FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_frame_prices_updated_at
  BEFORE UPDATE ON public.frame_prices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.frame_prices (product_id, size, variant, price_cents) VALUES
  (NULL,'A5','ohne_bilderrahmen',935),
  (NULL,'A5','standard_weiss',1395),
  (NULL,'A5','echtholz_weiss',1595),
  (NULL,'A5','standard_schwarz',1395),
  (NULL,'A5','echtholz_schwarz',1595),
  (NULL,'A5','standard_dunkelbraun',1395),
  (NULL,'A5','echtholz_dunkelbraun',1595),
  (NULL,'A4','ohne_bilderrahmen',1235),
  (NULL,'A4','standard_weiss',1820),
  (NULL,'A4','echtholz_weiss',2080),
  (NULL,'A4','standard_schwarz',1820),
  (NULL,'A4','echtholz_schwarz',2080),
  (NULL,'A4','standard_dunkelbraun',1820),
  (NULL,'A4','echtholz_dunkelbraun',2080),
  (NULL,'A3','ohne_bilderrahmen',1995),
  (NULL,'A3','standard_weiss',2895),
  (NULL,'A3','echtholz_weiss',3295),
  (NULL,'A3','standard_schwarz',2895),
  (NULL,'A3','echtholz_schwarz',3295),
  (NULL,'A3','standard_dunkelbraun',2895),
  (NULL,'A3','echtholz_dunkelbraun',3295);