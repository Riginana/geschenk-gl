
-- 1. Add is_featured to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- 2. site_settings (singleton)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  email text,
  phone text,
  whatsapp text,
  instagram text,
  facebook text,
  address_street text,
  address_zip text,
  address_city text,
  map_lat numeric,
  map_lng numeric,
  impressum_owner_name text,
  impressum_vat_id text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Site settings are readable by everyone" ON public.site_settings;
CREATE POLICY "Site settings are readable by everyone"
  ON public.site_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can modify site settings" ON public.site_settings;
CREATE POLICY "Only admins can modify site settings"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_settings (id, email, phone, whatsapp, instagram, impressum_owner_name)
VALUES (1, 'diginutz.e@gmail.com', '+49 176 24299597', '+4917624299597', 'https://www.instagram.com/digi.nutz/', 'Kubanych Susamyrbek uulu')
ON CONFLICT (id) DO NOTHING;

-- 3. order_status enum + convert orders.status
DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'shipped', 'done', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.orders
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE public.order_status USING (
    CASE WHEN status IN ('pending','paid','shipped','done','cancelled')
         THEN status::public.order_status
         ELSE 'pending'::public.order_status END
  ),
  ALTER COLUMN status SET DEFAULT 'pending'::public.order_status;
