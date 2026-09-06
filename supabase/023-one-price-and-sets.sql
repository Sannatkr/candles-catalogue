-- 023 — one price per piece, and candles sold in sets.
--
-- Bulk slabs are gone from the shop. Every design sells at base_price whatever
-- the quantity, and bulk is a conversation (the Chat for bulk button on every
-- candle). Nothing reads price_tiers any more. The column is left in place with
-- its data rather than dropped, so nothing here is irreversible — drop it in a
-- later migration once the new model has bedded in.
--
-- min_qty is how many a buyer has to take at a time. 1 for nearly everything;
-- 10 for the mithai candles, which are sold in sets. The stepper moves by it and
-- nothing below it can be bought, but any number above it is allowed — 35 is
-- fine. Until this runs, the site treats every candle as sold singly, and
-- saving a candle in the admin fails on the missing column.
--
-- Safe to run twice.

alter table public.products
  add column if not exists min_qty int not null default 1;

-- The five mithai candles, sold in sets of ten. Their photos are in the repo
-- under public/products/<slug>/. Re-running only re-asserts the set size, so
-- anything edited in the admin afterwards is kept.
insert into public.products
  (slug, name, collection_slug, tagline, description, images, keywords,
   fragrance, wax_type, wick_type, burn_time_hours, height_cm, diameter_cm,
   weight_grams, pack_weight_grams, base_price, mrp, min_qty, packaging,
   in_stock, featured, gift_eligible, sort_order)
values
  ('laddoo-candle', 'Laddoo Candle', 'festive-candles',
   'Motichoor, minus the calories',
   'A motichoor-style laddoo in wax — the round, grainy surface, the warm orange, a flake of silver leaf on top. Set a few out on a thali and watch someone reach for one. Sold in sets of ten.',
   '{/products/laddoo-candle/laddoo-candle-1.jpg}',
   '{laddoo,motichoor,mithai,sweet,dessert,diwali,return gift,novelty,food,set of 10}',
   '', '100% natural soy wax', 'Cotton, lead-free', 5, 0, 0, 50, 75, 20, 0, 10, 'Set of 10',
   true, false, false, 28),

  ('modak-candle', 'Modak Candle', 'festive-candles',
   'Pleated, pastel, and not for eating',
   'A hand-shaped modak with its pleated top, finished with a touch of silver leaf. Comes in pastel pink, blue, mint, cream and marigold. The Ganesh Chaturthi piece, and a return gift that gets photographed. Sold in sets of ten.',
   '{/products/modak-candle/modak-candle-1.jpg}',
   '{modak,ganesh chaturthi,ganpati,mithai,sweet,pastel,return gift,novelty,food,set of 10}',
   '', '100% natural soy wax', 'Cotton, lead-free', 5, 0, 0, 50, 75, 20, 0, 10, 'Set of 10',
   true, false, false, 29),

  ('jalebi-candle', 'Jalebi Candle', 'festive-candles',
   'Straight out of the syrup',
   'A coiled jalebi in a deep saffron orange, glossy as if it had just been lifted from the kadhai, with a flake of silver leaf. Sold in sets of ten.',
   '{/products/jalebi-candle/jalebi-candle-1.jpg}',
   '{jalebi,mithai,sweet,dessert,orange,diwali,return gift,novelty,food,set of 10}',
   '', '100% natural soy wax', 'Cotton, lead-free', 5, 0, 0, 45, 70, 18, 0, 10, 'Set of 10',
   true, false, false, 30),

  ('imriti-candle', 'Imriti Candle', 'festive-candles',
   'Every loop of the ring',
   'An imriti in its ring of tight red-orange loops, the colour of the real thing, with a flake of silver leaf on top. Sold in sets of ten.',
   '{/products/imriti-candle/imriti-candle-1.jpg}',
   '{imriti,imarti,mithai,sweet,dessert,red,diwali,return gift,novelty,food,set of 10}',
   '', '100% natural soy wax', 'Cotton, lead-free', 5, 0, 0, 45, 70, 18, 0, 10, 'Set of 10',
   true, false, false, 31),

  ('gujiya-candle', 'Gujiya Candle', 'festive-candles',
   'Crimped edge and all',
   'A crescent gujiya in wax, down to the rope-crimped edge, in a warm orange with silver leaf on top. Holi and Diwali both. Sold in sets of ten.',
   '{/products/gujiya-candle/gujiya-candle-1.jpg}',
   '{gujiya,holi,mithai,sweet,dessert,diwali,return gift,novelty,food,set of 10}',
   '', '100% natural soy wax', 'Cotton, lead-free', 5, 0, 0, 55, 80, 25, 0, 10, 'Set of 10',
   true, false, false, 32)
on conflict (slug) do update set min_qty = excluded.min_qty;
