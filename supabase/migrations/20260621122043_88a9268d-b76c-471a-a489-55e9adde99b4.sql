
-- PRODUCTS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_de TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_de TEXT NOT NULL,
  description_en TEXT NOT NULL,
  base_price_cents INTEGER NOT NULL,
  occasion TEXT NOT NULL,
  material TEXT NOT NULL DEFAULT 'karton',
  formats JSONB NOT NULL DEFAULT '["A5","A4","A3"]'::jsonb,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  badge TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active products" ON public.products FOR SELECT USING (is_active = true);

-- REVIEWS
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text_de TEXT NOT NULL,
  text_en TEXT NOT NULL,
  photo_url TEXT,
  occasion TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published reviews" ON public.reviews FOR SELECT USING (is_published = true);

-- ORDERS
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  address JSONB NOT NULL,
  items JSONB NOT NULL,
  shipping_method TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  subtotal_cents INTEGER NOT NULL,
  shipping_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_mock',
  locale TEXT NOT NULL DEFAULT 'de',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can place an order" ON public.orders FOR INSERT WITH CHECK (true);

-- NEWSLETTER
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  locale TEXT NOT NULL DEFAULT 'de',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);

-- CONTACT MESSAGES
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a contact form" ON public.contact_messages FOR INSERT WITH CHECK (true);

-- SEED PRODUCTS
INSERT INTO public.products (slug, name_de, name_en, description_de, description_en, base_price_cents, occasion, material, formats, images, badge) VALUES
('hochzeit-eichen-rahmen', 'Hochzeit Geldgeschenk – Eichenrahmen', 'Wedding Money Gift – Oak Frame', 'Handgefertigter Holzrahmen aus echter Eiche mit personalisierten Namen und Hochzeitsdatum. Die Geldscheine werden elegant in Form eines Herzens arrangiert.', 'Handmade oak frame with personalized names and wedding date. Banknotes are elegantly arranged in a heart shape.', 3490, 'hochzeit', 'holz', '["A5","A4","A3"]', '["/products/hochzeit-1.jpg","/products/hochzeit-1b.jpg"]', 'bestseller'),
('hochzeit-herz-karton', 'Hochzeit – Herz aus Kraftpapier', 'Wedding – Heart of Kraft Paper', 'Romantisches Geldgeschenk mit Herz-Ausschnitt aus hochwertigem Kraftpapier. Mit Namen und Datum personalisiert.', 'Romantic money gift with heart cut-out from premium kraft paper. Personalized with names and date.', 2490, 'hochzeit', 'karton', '["A5","A4"]', '["/products/hochzeit-2.jpg","/products/hochzeit-2b.jpg"]', null),
('geburtstag-ballons', 'Geburtstag – Luftballons', 'Birthday – Balloons', 'Fröhliches Geldgeschenk mit Luftballon-Motiv. Geldscheine werden zu bunten Ballons gefaltet.', 'Cheerful money gift with balloon motif. Banknotes are folded into colorful balloons.', 2290, 'geburtstag', 'karton', '["A5","A4","A3"]', '["/products/geburtstag-1.jpg","/products/geburtstag-1b.jpg"]', 'bestseller'),
('geburtstag-zahl', 'Geburtstag – Personalisierte Zahl', 'Birthday – Personalized Number', 'Großes Geldgeschenk mit der Alterszahl als Hauptmotiv. Perfekt für runde Geburtstage.', 'Large money gift featuring the age number as the main motif. Perfect for milestone birthdays.', 2990, 'geburtstag', 'holz', '["A4","A3"]', '["/products/geburtstag-2.jpg","/products/geburtstag-2b.jpg"]', 'neu'),
('geburt-storch', 'Zur Geburt – Storch & Wolke', 'For Birth – Stork & Cloud', 'Zartes Geldgeschenk zur Geburt mit Storch-Motiv. Personalisiert mit Name und Geburtsdatum.', 'Delicate money gift for birth with stork motif. Personalized with name and date of birth.', 2690, 'geburt', 'karton', '["A5","A4"]', '["/products/geburt-1.jpg","/products/geburt-1b.jpg"]', null),
('geburt-baerchen', 'Zur Geburt – Bärchen-Rahmen', 'For Birth – Bear Frame', 'Liebevoll gestalteter Holzrahmen mit Bärchen-Motiv. Ideal als Babygeschenk.', 'Lovingly designed wooden frame with bear motif. Ideal as a baby gift.', 3290, 'geburt', 'holz', '["A5","A4"]', '["/products/geburt-2.jpg","/products/geburt-2b.jpg"]', 'bestseller'),
('taufe-engel', 'Taufe – Engel-Motiv', 'Baptism – Angel Motif', 'Festliches Geldgeschenk zur Taufe mit Engel-Motiv aus zartem Papier.', 'Festive money gift for baptism with angel motif made of delicate paper.', 2590, 'taufe', 'karton', '["A5","A4"]', '["/products/taufe-1.jpg","/products/taufe-1b.jpg"]', null),
('konfirmation-kreuz', 'Konfirmation – Kreuz-Design', 'Confirmation – Cross Design', 'Würdiges Geldgeschenk zur Konfirmation mit personalisiertem Kreuz-Motiv.', 'Dignified money gift for confirmation with personalized cross motif.', 2890, 'konfirmation', 'holz', '["A5","A4","A3"]', '["/products/konfirmation-1.jpg","/products/konfirmation-1b.jpg"]', null),
('jubilaeum-rahmen', 'Jubiläum – Goldener Rahmen', 'Anniversary – Golden Frame', 'Eleganter Eichenrahmen mit goldenen Akzenten für Hochzeitstage und Jubiläen.', 'Elegant oak frame with golden accents for wedding anniversaries and jubilees.', 3690, 'jubilaeum', 'holz', '["A4","A3"]', '["/products/jubilaeum-1.jpg","/products/jubilaeum-1b.jpg"]', 'bestseller'),
('ruhestand-koffer', 'Ruhestand – Reisekoffer', 'Retirement – Travel Suitcase', 'Humorvolles Geldgeschenk zum Ruhestand mit Reisekoffer-Motiv – „Endlich Zeit zum Reisen!"', 'Humorous retirement money gift with travel suitcase motif – "Finally time to travel!"', 2790, 'ruhestand', 'karton', '["A4","A3"]', '["/products/ruhestand-1.jpg","/products/ruhestand-1b.jpg"]', 'neu'),
('weihnachten-tanne', 'Weihnachten – Tannenbaum', 'Christmas – Christmas Tree', 'Festliches Geldgeschenk zu Weihnachten mit Tannenbaum aus gefalteten Scheinen.', 'Festive Christmas money gift with a Christmas tree made of folded banknotes.', 2390, 'weihnachten', 'karton', '["A5","A4"]', '["/products/weihnachten-1.jpg","/products/weihnachten-1b.jpg"]', null),
('abschied-koffer', 'Abschied & Umzug – Neues Zuhause', 'Farewell & Moving – New Home', 'Geldgeschenk für den Umzug oder Abschied mit Haus-Motiv.', 'Money gift for moving or farewell with a house motif.', 2590, 'abschied', 'karton', '["A5","A4"]', '["/products/abschied-1.jpg","/products/abschied-1b.jpg"]', null),
('hochzeit-vintage', 'Hochzeit – Vintage Holzbox', 'Wedding – Vintage Wooden Box', 'Exklusive Holzbox im Vintage-Stil mit Gravur. Premium-Geschenk für die Hochzeit.', 'Exclusive vintage-style wooden box with engraving. Premium wedding gift.', 4490, 'hochzeit', 'holz', '["A4","A3"]', '["/products/hochzeit-3.jpg","/products/hochzeit-3b.jpg"]', 'bestseller'),
('geburtstag-tortenstueck', 'Geburtstag – Tortenstück', 'Birthday – Cake Slice', 'Süßes Geldgeschenk mit Tortenstück-Motiv – ein echter Hingucker.', 'Sweet money gift with cake slice motif – a real eye-catcher.', 2190, 'geburtstag', 'karton', '["A5","A4"]', '["/products/geburtstag-3.jpg","/products/geburtstag-3b.jpg"]', null),
('kommunion-fisch', 'Kommunion – Fisch-Symbol', 'Communion – Fish Symbol', 'Klassisches Geldgeschenk zur Kommunion mit Fisch-Motiv.', 'Classic communion money gift with fish motif.', 2690, 'konfirmation', 'holz', '["A5","A4"]', '["/products/kommunion-1.jpg","/products/kommunion-1b.jpg"]', null),
('ruhestand-uhr', 'Ruhestand – Sanduhr', 'Retirement – Hourglass', 'Elegantes Geldgeschenk zum Ruhestand mit Sanduhr-Motiv.', 'Elegant retirement money gift with hourglass motif.', 2990, 'ruhestand', 'holz', '["A4","A3"]', '["/products/ruhestand-2.jpg","/products/ruhestand-2b.jpg"]', null);

-- SEED REVIEWS
INSERT INTO public.reviews (product_id, customer_name, rating, text_de, text_en, occasion) VALUES
(NULL, 'Sabine M.', 5, 'Wunderschönes Geschenk, super schnell geliefert und liebevoll verpackt. Das Brautpaar war begeistert!', 'Beautiful gift, super fast delivery and lovingly packaged. The bride and groom were thrilled!', 'hochzeit'),
(NULL, 'Thomas K.', 5, 'Die Qualität ist herausragend – echtes Eichenholz, sauber verarbeitet. Sehr empfehlenswert.', 'The quality is outstanding – real oak wood, cleanly crafted. Highly recommended.', 'jubilaeum'),
(NULL, 'Anja L.', 5, 'Perfekt zur Geburt meines Neffen. Die Eltern haben Tränen in den Augen gehabt.', 'Perfect for the birth of my nephew. The parents had tears in their eyes.', 'geburt'),
(NULL, 'Markus F.', 4, 'Sehr schönes Design, schnelle Lieferung. Hätte mir eine größere Auswahl an Schriftarten gewünscht.', 'Very nice design, fast delivery. I would have liked more font options.', 'geburtstag'),
(NULL, 'Petra H.', 5, 'Absolut traumhaft! Genau wie auf den Bildern, sogar noch schöner in echt.', 'Absolutely dreamy! Just like the pictures, even prettier in real life.', 'hochzeit'),
(NULL, 'Daniela R.', 5, 'Tolle Idee für die Konfirmation meiner Tochter. Sehr persönlich und hochwertig.', 'Great idea for my daughter''s confirmation. Very personal and high quality.', 'konfirmation'),
(NULL, 'Jürgen B.', 5, 'Originelles Geschenk zum Ruhestand. Mein Kollege war begeistert!', 'Original retirement gift. My colleague was thrilled!', 'ruhestand'),
(NULL, 'Christina W.', 5, 'Die Verarbeitung ist erstklassig. Jedes Detail durchdacht. Wir bestellen wieder!', 'The craftsmanship is first-class. Every detail thought through. We will order again!', 'hochzeit'),
(NULL, 'Stefan O.', 5, 'Schnelle Kommunikation, persönliche Note – fühlt sich wirklich nach Handarbeit an.', 'Fast communication, personal touch – really feels handmade.', 'geburtstag'),
(NULL, 'Marlene G.', 5, 'Wunderschön und sehr edel. Werde definitiv wieder hier bestellen!', 'Beautiful and very elegant. Will definitely order here again!', 'jubilaeum'),
(NULL, 'Andreas P.', 5, 'Tolle Geschenkidee für meine Eltern zur Goldenen Hochzeit. Sehr emotional!', 'Great gift idea for my parents'' golden anniversary. Very emotional!', 'jubilaeum'),
(NULL, 'Julia S.', 4, 'Sehr schön gemacht. Lieferung dauerte etwas länger als erwartet, aber das Ergebnis lohnt sich.', 'Very nicely made. Delivery took a bit longer than expected, but the result is worth it.', 'taufe'),
(NULL, 'Robert E.', 5, 'Bestes Geldgeschenk, das ich je gekauft habe. Die Beschenkten waren sprachlos.', 'Best money gift I have ever bought. The recipients were speechless.', 'hochzeit'),
(NULL, 'Sandra T.', 5, 'Liebevoll gemacht, kreativ und einzigartig. Genau das, was ich gesucht habe!', 'Lovingly made, creative and unique. Exactly what I was looking for!', 'geburt'),
(NULL, 'Michael N.', 5, 'Premium Qualität zum fairen Preis. Empfehlung an alle, die etwas Besonderes suchen.', 'Premium quality at a fair price. Recommended to anyone looking for something special.', 'geburtstag'),
(NULL, 'Nicole D.', 5, 'Die Holzrahmen sind ein Traum! So viel Liebe zum Detail.', 'The wooden frames are a dream! So much attention to detail.', 'hochzeit'),
(NULL, 'Wolfgang Z.', 5, 'Bin sehr zufrieden. Persönlicher Service und top Qualität.', 'Very satisfied. Personal service and top quality.', 'ruhestand'),
(NULL, 'Karin U.', 5, 'Wunderschönes Weihnachtsgeschenk. Hat allen sehr gefallen.', 'Beautiful Christmas gift. Everyone loved it.', 'weihnachten'),
(NULL, 'Heinz V.', 5, 'Sehr persönlich gestaltet. Genau wie gewünscht – vielen Dank!', 'Very personally designed. Exactly as requested – thank you!', 'abschied'),
(NULL, 'Eva J.', 5, 'Schnell, freundlich, hochwertig. Hier wird Handwerk groß geschrieben.', 'Fast, friendly, high quality. Craftsmanship is taken seriously here.', 'geburtstag'),
(NULL, 'Lukas A.', 5, 'Bestellung lief reibungslos, Produkt übertrifft die Erwartungen.', 'Order ran smoothly, product exceeds expectations.', 'hochzeit'),
(NULL, 'Britta C.', 5, 'Wunderschön verpackt, persönliche Karte beigelegt. Top!', 'Beautifully packaged, personal card included. Top!', 'geburtstag'),
(NULL, 'Tobias I.', 4, 'Sehr schönes Geschenk, kleiner Tipp: Bitte mehr Bilder im Shop zeigen.', 'Very nice gift, small tip: please show more pictures in the shop.', 'konfirmation'),
(NULL, 'Hannah Y.', 5, 'Mein neuer Lieblings-Shop für Geldgeschenke. 5 Sterne verdient!', 'My new favorite shop for money gifts. Deserves 5 stars!', 'geburtstag'),
(NULL, 'Patrick X.', 5, 'Tolle Erfahrung von Anfang bis Ende. Wir kommen wieder!', 'Great experience from start to finish. We will be back!', 'hochzeit');
