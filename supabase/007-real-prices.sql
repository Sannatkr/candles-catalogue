-- Sugandha Candles — real prices, sizes and fragrances.
-- Paste into Supabase → SQL Editor → Run.

update public.products as p set
  base_price  = v.base_price,
  price_tiers = v.price_tiers,
  height_cm   = v.height_cm,
  diameter_cm = v.diameter_cm,
  fragrance   = v.fragrance,
  packaging   = v.packaging
from (values
  ('peacock-urli-candle', 699, '[{"minQty": 1, "price": 699}, {"minQty": 10, "price": 630}, {"minQty": 25, "price": 575}, {"minQty": 50, "price": 510}, {"minQty": 100, "price": 455}]'::jsonb, 5.08, 19.05, 'Jasmine, White Oud, French Vanilla', 'Foam-nested in a printed carton'),
  ('lotus-pond-urli-candle', 399, '[{"minQty": 1, "price": 399}, {"minQty": 10, "price": 360}, {"minQty": 25, "price": 325}, {"minQty": 50, "price": 290}, {"minQty": 100, "price": 260}]'::jsonb, 3.81, 11.43, 'White Oud, Black Oud', 'Foam-nested in a printed carton'),
  ('mithai-box-candle', 229, '[{"minQty": 1, "price": 229}, {"minQty": 10, "price": 205}, {"minQty": 25, "price": 190}, {"minQty": 50, "price": 165}, {"minQty": 100, "price": 150}]'::jsonb, 0, 0, 'Kesar Chandan, Pineapple', '6-piece cavity gift box'),
  ('lotus-pond-boat-candle', 449, '[{"minQty": 1, "price": 449}, {"minQty": 10, "price": 405}, {"minQty": 25, "price": 370}, {"minQty": 50, "price": 330}, {"minQty": 100, "price": 290}]'::jsonb, 6.35, 15.24, 'Lavender, Jasmine', 'Foam-nested in a printed carton'),
  ('designer-lotus-candle', 129, '[{"minQty": 1, "price": 129}, {"minQty": 10, "price": 115}, {"minQty": 25, "price": 105}, {"minQty": 50, "price": 95}, {"minQty": 100, "price": 85}]'::jsonb, 6.35, 8.89, 'Mogra', 'Pair per box, 12 pairs per carton'),
  ('lotus-boat-tealight-box', 229, '[{"minQty": 1, "price": 229}, {"minQty": 10, "price": 205}, {"minQty": 25, "price": 190}, {"minQty": 50, "price": 165}, {"minQty": 100, "price": 150}]'::jsonb, 0, 0, 'Kesar Chandan, Pineapple', '6-piece cavity gift box'),
  ('lotus-diya-candle', 99, '[{"minQty": 1, "price": 99}, {"minQty": 10, "price": 90}, {"minQty": 25, "price": 80}, {"minQty": 50, "price": 70}, {"minQty": 100, "price": 65}]'::jsonb, 2.54, 6.35, 'Kesar Chandan', 'Sleeved, 20 per carton'),
  ('festive-lotus-urli-bowl-candle', 699, '[{"minQty": 1, "price": 699}, {"minQty": 10, "price": 630}, {"minQty": 25, "price": 575}, {"minQty": 50, "price": 510}, {"minQty": 100, "price": 455}]'::jsonb, 8.89, 15.24, 'Rose, Kesar Chandan', 'Foam-nested in a printed carton'),
  ('hibiscus-urli-candle', 399, '[{"minQty": 1, "price": 399}, {"minQty": 10, "price": 360}, {"minQty": 25, "price": 325}, {"minQty": 50, "price": 290}, {"minQty": 100, "price": 260}]'::jsonb, 3.81, 11.43, 'White Oud, Black Oud', 'Foam-nested in a printed carton'),
  ('hibiscus-urli-sparkle-candle', 249, '[{"minQty": 1, "price": 249}, {"minQty": 10, "price": 225}, {"minQty": 25, "price": 205}, {"minQty": 50, "price": 180}, {"minQty": 100, "price": 160}]'::jsonb, 3.81, 8.89, 'Sandalwood', 'Sleeved, 16 per carton'),
  ('sunflower-urli-sparkle-candle', 249, '[{"minQty": 1, "price": 249}, {"minQty": 10, "price": 225}, {"minQty": 25, "price": 205}, {"minQty": 50, "price": 180}, {"minQty": 100, "price": 160}]'::jsonb, 3.81, 8.89, 'Sandalwood', 'Sleeved, 16 per carton'),
  ('red-lotus-small-urli-candle', 149, '[{"minQty": 1, "price": 149}, {"minQty": 10, "price": 135}, {"minQty": 25, "price": 120}, {"minQty": 50, "price": 110}, {"minQty": 100, "price": 95}]'::jsonb, 3.81, 6.35, 'Rose', 'Sleeved, 12 per carton'),
  ('mogra-urli-candle', 149, '[{"minQty": 1, "price": 149}, {"minQty": 10, "price": 135}, {"minQty": 25, "price": 120}, {"minQty": 50, "price": 110}, {"minQty": 100, "price": 95}]'::jsonb, 2.54, 8.89, 'Mogra', 'Foam-nested in a printed carton'),
  ('mogra-urli-bowl-candle', 449, '[{"minQty": 1, "price": 449}, {"minQty": 10, "price": 405}, {"minQty": 25, "price": 370}, {"minQty": 50, "price": 330}, {"minQty": 100, "price": 290}]'::jsonb, 6.35, 11.43, 'Mogra', 'Foam-nested in a printed carton'),
  ('marigold-diya-festive-urli-candle', 599, '[{"minQty": 1, "price": 599}, {"minQty": 10, "price": 540}, {"minQty": 25, "price": 490}, {"minQty": 50, "price": 435}, {"minQty": 100, "price": 390}]'::jsonb, 5.08, 15.24, 'Orange, Kesar Chandan', 'Foam-nested in a printed carton'),
  ('elephant-urli-candle', 229, '[{"minQty": 1, "price": 229}, {"minQty": 10, "price": 205}, {"minQty": 25, "price": 190}, {"minQty": 50, "price": 165}, {"minQty": 100, "price": 150}]'::jsonb, 7.62, 8.89, 'Ginger, Mulberry, Sandalwood', 'Foam-nested in a printed carton'),
  ('turtle-urli-candle', 229, '[{"minQty": 1, "price": 229}, {"minQty": 10, "price": 205}, {"minQty": 25, "price": 190}, {"minQty": 50, "price": 165}, {"minQty": 100, "price": 150}]'::jsonb, 7.62, 8.89, 'Ginger, Mulberry, Sandalwood', 'Foam-nested in a printed carton'),
  ('ruffle-shell-stand-candle', 229, '[{"minQty": 1, "price": 229}, {"minQty": 10, "price": 205}, {"minQty": 25, "price": 190}, {"minQty": 50, "price": 165}, {"minQty": 100, "price": 150}]'::jsonb, 7.62, 8.89, 'Ginger, Mulberry, Sandalwood', 'Foam-nested in a printed carton'),
  ('floral-ring-urli-tealight-holder', 199, '[{"minQty": 1, "price": 199}, {"minQty": 10, "price": 180}, {"minQty": 25, "price": 165}, {"minQty": 50, "price": 145}, {"minQty": 100, "price": 130}]'::jsonb, 3.81, 8.89, 'Rajnigandha', 'Sleeved, 12 per carton'),
  ('brass-tin-candle', 699, '[{"minQty": 1, "price": 699}, {"minQty": 10, "price": 630}, {"minQty": 25, "price": 575}, {"minQty": 50, "price": 510}, {"minQty": 100, "price": 455}]'::jsonb, 11.43, 8.89, 'White Oud', 'Boxed, 24 per carton'),
  ('laxmi-charan-candle', 149, '[{"minQty": 1, "price": 149}, {"minQty": 10, "price": 135}, {"minQty": 25, "price": 120}, {"minQty": 50, "price": 110}, {"minQty": 100, "price": 95}]'::jsonb, 5.84, 7.62, 'Kesar Chandan', 'Sleeved, 16 per carton'),
  ('baby-feet-square-urli-candle', 189, '[{"minQty": 1, "price": 189}, {"minQty": 10, "price": 170}, {"minQty": 25, "price": 155}, {"minQty": 50, "price": 140}, {"minQty": 100, "price": 125}]'::jsonb, 6.35, 6.35, 'Kesar Chandan', 'Sleeved, 16 per carton'),
  ('poker-glass-jar-candle', 229, '[{"minQty": 1, "price": 229}, {"minQty": 10, "price": 205}, {"minQty": 25, "price": 190}, {"minQty": 50, "price": 165}, {"minQty": 100, "price": 150}]'::jsonb, 6.35, 7.62, 'Black Oud', 'Boxed, 20 per carton'),
  ('poker-urli-candle', 449, '[{"minQty": 1, "price": 449}, {"minQty": 10, "price": 405}, {"minQty": 25, "price": 370}, {"minQty": 50, "price": 330}, {"minQty": 100, "price": 290}]'::jsonb, 6.35, 11.43, 'Black Oud', 'Foam-nested in a printed carton'),
  ('poker-tealight-box', 129, '[{"minQty": 1, "price": 129}, {"minQty": 10, "price": 115}, {"minQty": 25, "price": 105}, {"minQty": 50, "price": 95}, {"minQty": 100, "price": 85}]'::jsonb, 0, 0, 'Black Oud', 'Clear-lid gift box of 4'),
  ('mandala-duo-gift-box', 299, '[{"minQty": 1, "price": 299}, {"minQty": 10, "price": 270}, {"minQty": 25, "price": 245}, {"minQty": 50, "price": 220}, {"minQty": 100, "price": 195}]'::jsonb, 6.35, 6.35, 'Lavender', 'Printed gift box, sleeved'),
  ('rasmalai-cup-candle', 129, '[{"minQty": 1, "price": 129}, {"minQty": 10, "price": 115}, {"minQty": 25, "price": 105}, {"minQty": 50, "price": 95}, {"minQty": 100, "price": 85}]'::jsonb, 6.35, 6.35, 'Kesar Chandan', 'Tray of 9, 36 per carton')
) as v(slug, base_price, price_tiers, height_cm, diameter_cm, fragrance, packaging)
where p.slug = v.slug;

-- Ginger and Mulberry added to the fragrance list buyers pick from.
update public.site_settings
set data = jsonb_set(
      data,
      '{fragrances}',
      (select jsonb_agg(f) from (
         select jsonb_array_elements_text(data->'fragrances') as f
         union select 'Ginger' union select 'Mulberry'
       ) t)
    ),
    updated_at = now()
where id = 1;
