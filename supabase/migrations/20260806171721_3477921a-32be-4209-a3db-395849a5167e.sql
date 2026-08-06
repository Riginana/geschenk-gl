CREATE TABLE public.product_size_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label text NOT NULL,
  dimensions text NOT NULL DEFAULT '',
  price_cents integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, label)
);

GRANT SELECT ON public.product_size_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_size_variants TO authenticated;
GRANT ALL ON public.product_size_variants TO service_role;

ALTER TABLE public.product_size_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read size variants of active products"
ON public.product_size_variants FOR SELECT
USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.is_active = true));

CREATE POLICY "Admins can manage size variants"
ON public.product_size_variants FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_product_size_variants_updated_at
BEFORE UPDATE ON public.product_size_variants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_product_size_variants_product ON public.product_size_variants(product_id);

CREATE TABLE public.product_motifs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  number integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  predefined_text text NOT NULL DEFAULT '',
  preview_image_url text,
  allows_custom_text boolean NOT NULL DEFAULT false,
  requires_custom_text boolean NOT NULL DEFAULT false,
  custom_text_max_length integer NOT NULL DEFAULT 150,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, number)
);

GRANT SELECT ON public.product_motifs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_motifs TO authenticated;
GRANT ALL ON public.product_motifs TO service_role;

ALTER TABLE public.product_motifs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read motifs of active products"
ON public.product_motifs FOR SELECT
USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.is_active = true));

CREATE POLICY "Admins can manage motifs"
ON public.product_motifs FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_product_motifs_updated_at
BEFORE UPDATE ON public.product_motifs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_product_motifs_product ON public.product_motifs(product_id);

INSERT INTO public.product_size_variants (product_id, label, dimensions, price_cents, is_active, is_default, sort_order)
SELECT p.id, v.label, v.dimensions, v.price_cents, true, v.is_default, v.sort_order
FROM public.products p
CROSS JOIN (VALUES
  ('S', '16 × 11 × 5 cm', 2400, false, 1),
  ('M', '18 × 13 × 6 cm', 2800, true, 2),
  ('L', '20 × 15 × 7 cm', 3200, false, 3)
) AS v(label, dimensions, price_cents, is_default, sort_order)
WHERE p.category = 'schiebebox'
ON CONFLICT (product_id, label) DO NOTHING;

INSERT INTO public.product_motifs (product_id, number, title, description, predefined_text, allows_custom_text, requires_custom_text, custom_text_max_length, is_active, sort_order)
SELECT p.id, m.number, m.title, m.description, m.predefined_text, m.allows_custom_text, m.requires_custom_text, 150, true, m.number
FROM public.products p
CROSS JOIN (VALUES
  (1, 'Zwei Herzen', 'Zwei Herzen, ein Weg, ein Leben voller Liebe. Alles Gute zur Hochzeit.', 'Zwei Herzen, ein Weg, ein Leben voller Liebe. Alles Gute zur Hochzeit.', false, false),
  (2, 'Wunschtext', 'Ihr persönlicher Text im Innenmotiv.', '', true, true),
  (3, 'Hand in Hand', 'Hand in Hand ein Leben lang. Alles Gute zur Hochzeit.', 'Hand in Hand ein Leben lang. Alles Gute zur Hochzeit.', false, false),
  (4, 'Eure Liebe', 'Eure Liebe ist einzigartig. Bleibt für immer so glücklich. Alles Liebe zur Hochzeit.', 'Eure Liebe ist einzigartig. Bleibt für immer so glücklich. Alles Liebe zur Hochzeit.', false, false)
) AS m(number, title, description, predefined_text, allows_custom_text, requires_custom_text)
WHERE p.category = 'schiebebox'
ON CONFLICT (product_id, number) DO NOTHING;