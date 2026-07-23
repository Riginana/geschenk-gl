GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.product_images TO service_role;
GRANT ALL ON public.product_variants TO service_role;