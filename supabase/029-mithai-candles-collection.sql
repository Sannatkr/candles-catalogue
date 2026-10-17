-- 029 — a Mithai Candles collection of its own.
--
-- The sweets were scattered through Festive Candles: five set-of-ten pieces
-- (laddoo, modak, jalebi, imriti, gujiya), the mithai box and the single urli.
-- They now sit together in one collection, joined by three new laddoo gift
-- boxes in 4, 9 and 12 cavities. The box photos are already in Supabase
-- Storage under product-images/products/.
--
-- Prices are the top of each box's ladder; tier_prices walks it down to the
-- floor the owner quoted (12-cavity ₹299→₹199, 9-cavity ₹229→₹149, 4-cavity
-- ₹199→₹119). MRP is left at 0 (hidden) — no list price was given.
--
-- Safe to run twice: the collection and the boxes upsert on slug, and the move
-- only touches the seven sweets.

insert into public.collections (slug, name, tagline, description, cover_image, sort_order)
values (
  'mithai-candles',
  'Mithai Candles',
  'Laddoo, jalebi, modak — all wax',
  'Sweets you cannot eat. Motichoor laddoo, jalebi, imarti, modak and gujiya poured in 100% soy wax with a flake of silver on top, sold singly in sets of ten or boxed in 4, 9 and 12-cavity gift boxes. Boxes from ₹119 to ₹299, with lower prices as the order grows. Box colour may vary in a light shade.',
  'https://migglvwewagtttqfhwvs.supabase.co/storage/v1/object/public/product-images/products/laddoo-candle-box-12-1.jpg',
  2
)
on conflict (slug) do update set
  name        = excluded.name,
  tagline     = excluded.tagline,
  description = excluded.description,
  cover_image = excluded.cover_image,
  sort_order  = excluded.sort_order;

-- Mini Hampers stays first; the sweets go second; everything else shifts down.
update public.collections set sort_order = 1 where slug = 'mini-hampers';
update public.collections set sort_order = 3 where slug = 'festive-candles';
update public.collections set sort_order = 4 where slug = 'wax-sachets';
update public.collections set sort_order = 5 where slug = 'ocean-theme';

-- The three laddoo gift boxes.
insert into public.products
  (slug, name, collection_slug, tagline, description, images, keywords,
   fragrance, wax_type, wick_type, burn_time_hours, height_cm, diameter_cm, length_cm,
   weight_grams, pack_weight_grams, base_price, mrp, min_qty, max_qty, free_ship_qty,
   bulk_pricing, tier_prices, packaging, in_stock, featured, sort_order)
values
  ('laddoo-candle-box-12', 'Laddoo Candle Box of 12', 'mithai-candles',
   'Twelve motichoor laddoos, every one a candle',
   'Twelve motichoor-style laddoo candles with silver vark, each in its own paper cup inside a 12-cavity gift box. The sweet box that never goes stale — for Diwali hampers, return gifts and office desks. Box colour may vary in a light shade.',
   '{https://migglvwewagtttqfhwvs.supabase.co/storage/v1/object/public/product-images/products/laddoo-candle-box-12-1.jpg}',
   '{laddoo,motichoor,mithai,sweet box,gift box,12,diwali,return gift,corporate gift,hamper,novelty,food}',
   '', '100% natural soy wax', 'Cotton, lead-free', 5, 0, 0, 0,
   0, 0, 299, 0, 1, 50, 0,
   true, '{"10": 279, "25": 259, "50": 239, "100": 219, "200": 199}',
   '12-cavity gift box', true, true, 10),

  ('laddoo-candle-box-9', 'Laddoo Candle Box of 9', 'mithai-candles',
   'Nine laddoos in a clear-lid box',
   'Nine motichoor-style laddoo candles with silver vark, cupped and set in a 9-cavity gift box with a clear lid, so the sweets show before the box is opened. Box colour may vary in a light shade.',
   '{https://migglvwewagtttqfhwvs.supabase.co/storage/v1/object/public/product-images/products/laddoo-candle-box-9-1.jpg,https://migglvwewagtttqfhwvs.supabase.co/storage/v1/object/public/product-images/products/laddoo-candle-box-9-2.jpg}',
   '{laddoo,motichoor,mithai,sweet box,gift box,9,diwali,return gift,corporate gift,hamper,novelty,food}',
   '', '100% natural soy wax', 'Cotton, lead-free', 5, 0, 0, 0,
   0, 0, 229, 0, 1, 50, 0,
   true, '{"10": 213, "25": 197, "50": 181, "100": 165, "200": 149}',
   '9-cavity gift box with clear lid', true, false, 11),

  ('laddoo-candle-box-4', 'Laddoo Candle Box of 4', 'mithai-candles',
   'Four laddoos, one small box',
   'Four motichoor-style laddoo candles with silver vark in a 4-cavity gift box. The small return gift — light to carry, quick to hand over. Box colour may vary in a light shade.',
   '{https://migglvwewagtttqfhwvs.supabase.co/storage/v1/object/public/product-images/products/laddoo-candle-box-4-1.jpg}',
   '{laddoo,motichoor,mithai,sweet box,gift box,4,diwali,return gift,novelty,food}',
   '', '100% natural soy wax', 'Cotton, lead-free', 5, 0, 0, 0,
   0, 0, 199, 0, 1, 50, 0,
   true, '{"10": 183, "25": 167, "50": 151, "100": 135, "200": 119}',
   '4-cavity gift box', true, false, 12)
on conflict (slug) do update set
  name            = excluded.name,
  collection_slug = excluded.collection_slug,
  tagline         = excluded.tagline,
  description     = excluded.description,
  images          = excluded.images,
  keywords        = excluded.keywords,
  base_price      = excluded.base_price,
  tier_prices     = excluded.tier_prices,
  packaging       = excluded.packaging,
  sort_order      = excluded.sort_order;

-- Move the sweets that already exist into the new collection, after the boxes.
update public.products set collection_slug = 'mithai-candles', sort_order = 13 where slug = 'mithai-box-candle';
update public.products set collection_slug = 'mithai-candles', sort_order = 14 where slug = 'mithai-single-candle';
update public.products set collection_slug = 'mithai-candles', sort_order = 15 where slug = 'laddoo-candle';
update public.products set collection_slug = 'mithai-candles', sort_order = 16 where slug = 'jalebi-candle';
update public.products set collection_slug = 'mithai-candles', sort_order = 17 where slug = 'imriti-candle';
update public.products set collection_slug = 'mithai-candles', sort_order = 18 where slug = 'modak-candle';
update public.products set collection_slug = 'mithai-candles', sort_order = 19 where slug = 'gujiya-candle';

-- Check: ten rows, boxes first.
select slug, name, base_price, tier_prices->>'200' as floor, sort_order
from public.products
where collection_slug = 'mithai-candles'
order by sort_order;
