CREATE TABLE IF NOT EXISTS public.occasions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_de text NOT NULL,
  name_en text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.occasions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.occasions TO authenticated;
GRANT ALL ON public.occasions TO service_role;
ALTER TABLE public.occasions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read occasions" ON public.occasions;
CREATE POLICY "Public can read occasions" ON public.occasions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage occasions" ON public.occasions;
CREATE POLICY "Admins manage occasions" ON public.occasions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.occasions (slug, name_de, name_en)
SELECT DISTINCT occasion, initcap(occasion), initcap(occasion) FROM public.products WHERE coalesce(occasion,'') <> ''
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.personalization_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL DEFAULT 'global' CHECK (scope IN ('global','occasion','category','product')),
  scope_value text NOT NULL DEFAULT '',
  internal_name text NOT NULL,
  field_key text NOT NULL CHECK (field_key ~ '^[a-zA-Z][a-zA-Z0-9_]{0,39}$'),
  field_type text NOT NULL DEFAULT 'text' CHECK (field_type IN ('text','textarea','date','select','checkbox','font','image')),
  title_de text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  description_de text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  placeholder_de text NOT NULL DEFAULT '',
  placeholder_en text NOT NULL DEFAULT '',
  hint_de text NOT NULL DEFAULT '',
  hint_en text NOT NULL DEFAULT '',
  error_de text NOT NULL DEFAULT '',
  error_en text NOT NULL DEFAULT '',
  required boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  hidden boolean NOT NULL DEFAULT false,
  overrides_block_id uuid REFERENCES public.personalization_blocks(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  min_length integer NOT NULL DEFAULT 0 CHECK (min_length >= 0),
  max_length integer NOT NULL DEFAULT 150 CHECK (max_length BETWEEN 1 AND 500),
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, scope_value, field_key)
);
CREATE INDEX IF NOT EXISTS personalization_blocks_scope_idx ON public.personalization_blocks (scope, scope_value);
GRANT SELECT ON public.personalization_blocks TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.personalization_blocks TO authenticated;
GRANT ALL ON public.personalization_blocks TO service_role;
ALTER TABLE public.personalization_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read active blocks" ON public.personalization_blocks;
CREATE POLICY "Public can read active blocks" ON public.personalization_blocks FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins manage blocks" ON public.personalization_blocks;
CREATE POLICY "Admins manage blocks" ON public.personalization_blocks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS personalization_blocks_updated ON public.personalization_blocks;
CREATE TRIGGER personalization_blocks_updated BEFORE UPDATE ON public.personalization_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.personalization_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('global','occasion','category','product')),
  scope_value text NOT NULL DEFAULT '',
  heading_de text NOT NULL DEFAULT '',
  heading_en text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, scope_value)
);
GRANT SELECT ON public.personalization_sections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.personalization_sections TO authenticated;
GRANT ALL ON public.personalization_sections TO service_role;
ALTER TABLE public.personalization_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read sections" ON public.personalization_sections;
CREATE POLICY "Public can read sections" ON public.personalization_sections FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage sections" ON public.personalization_sections;
CREATE POLICY "Admins manage sections" ON public.personalization_sections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS personalization_sections_updated ON public.personalization_sections;
CREATE TRIGGER personalization_sections_updated BEFORE UPDATE ON public.personalization_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.personalization_sections (scope, scope_value, heading_de, heading_en)
VALUES ('global', '', 'Personalisierung', 'Personalisation')
ON CONFLICT (scope, scope_value) DO NOTHING;

INSERT INTO public.personalization_blocks (scope, scope_value, internal_name, field_key, field_type, title_de, title_en, placeholder_de, placeholder_en, required, sort_order, min_length, max_length)
VALUES
 ('global', '', 'Name(n) Standard', 'names', 'text', 'Name(n)', 'Name(s)', 'z. B. Julia & Max', 'e.g. Julia & Max', true, 10, 2, 50),
 ('global', '', 'Datum Standard', 'date', 'date', 'Datum (optional)', 'Date (optional)', 'TT.MM.JJJJ', 'DD.MM.YYYY', false, 20, 0, 10),
 ('global', '', 'Wunschtext Standard', 'message', 'textarea', 'Wunschtext (optional)', 'Custom message (optional)', 'Persönliche Widmung, Grußworte…', 'Personal dedication, greetings…', false, 30, 0, 150)
ON CONFLICT (scope, scope_value, field_key) DO NOTHING;