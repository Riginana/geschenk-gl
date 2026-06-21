-- Add explicit restrictive SELECT denials for sensitive submission tables.
-- service_role bypasses RLS, so admin/server reads still work via supabaseAdmin.

CREATE POLICY "Deny public read of contact messages"
  ON public.contact_messages FOR SELECT
  TO anon, authenticated
  USING (false);

CREATE POLICY "Deny public read of newsletter subscribers"
  ON public.newsletter_subscribers FOR SELECT
  TO anon, authenticated
  USING (false);

CREATE POLICY "Deny public read of orders"
  ON public.orders FOR SELECT
  TO anon, authenticated
  USING (false);

CREATE POLICY "Deny public update of orders"
  ON public.orders FOR UPDATE
  TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "Deny public delete of orders"
  ON public.orders FOR DELETE
  TO anon, authenticated
  USING (false);