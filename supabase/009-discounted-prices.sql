-- Sugandha Candles — update 009.
-- The quoted price becomes the struck-through MRP; the selling rate and every
-- bulk slab drop Rs 20-30 below it.
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.

update public.products as p set
  base_price  = v.base_price,
  mrp         = v.mrp,
  price_tiers = v.price_tiers
from (values
  ('peacock-urli-candle', 669, 699, '[{"minQty":1,"price":669},{"minQty":10,"price":600},{"minQty":25,"price":550},{"minQty":50,"price":490},{"minQty":100,"price":435}]'::jsonb),
  ('lotus-pond-urli-candle', 369, 399, '[{"minQty":1,"price":369},{"minQty":10,"price":330},{"minQty":25,"price":305},{"minQty":50,"price":270},{"minQty":100,"price":240}]'::jsonb),
  ('mithai-box-candle', 199, 229, '[{"minQty":1,"price":199},{"minQty":10,"price":180},{"minQty":25,"price":165},{"minQty":50,"price":145},{"minQty":100,"price":130}]'::jsonb),
  ('lotus-pond-boat-candle', 419, 449, '[{"minQty":1,"price":419},{"minQty":10,"price":375},{"minQty":25,"price":345},{"minQty":50,"price":305},{"minQty":100,"price":270}]'::jsonb),
  ('designer-lotus-candle', 109, 129, '[{"minQty":1,"price":109},{"minQty":10,"price":100},{"minQty":25,"price":90},{"minQty":50,"price":80},{"minQty":100,"price":70}]'::jsonb),
  ('lotus-boat-tealight-box', 199, 229, '[{"minQty":1,"price":199},{"minQty":10,"price":180},{"minQty":25,"price":165},{"minQty":50,"price":145},{"minQty":100,"price":130}]'::jsonb),
  ('lotus-diya-candle', 79, 99, '[{"minQty":1,"price":79},{"minQty":10,"price":70},{"minQty":25,"price":65},{"minQty":50,"price":60},{"minQty":100,"price":50}]'::jsonb),
  ('festive-lotus-urli-bowl-candle', 669, 699, '[{"minQty":1,"price":669},{"minQty":10,"price":600},{"minQty":25,"price":550},{"minQty":50,"price":490},{"minQty":100,"price":435}]'::jsonb),
  ('hibiscus-urli-candle', 369, 399, '[{"minQty":1,"price":369},{"minQty":10,"price":330},{"minQty":25,"price":305},{"minQty":50,"price":270},{"minQty":100,"price":240}]'::jsonb),
  ('hibiscus-urli-sparkle-candle', 219, 249, '[{"minQty":1,"price":219},{"minQty":10,"price":195},{"minQty":25,"price":180},{"minQty":50,"price":160},{"minQty":100,"price":140}]'::jsonb),
  ('sunflower-urli-sparkle-candle', 219, 249, '[{"minQty":1,"price":219},{"minQty":10,"price":195},{"minQty":25,"price":180},{"minQty":50,"price":160},{"minQty":100,"price":140}]'::jsonb),
  ('red-lotus-small-urli-candle', 129, 149, '[{"minQty":1,"price":129},{"minQty":10,"price":115},{"minQty":25,"price":105},{"minQty":50,"price":95},{"minQty":100,"price":85}]'::jsonb),
  ('mogra-urli-candle', 129, 149, '[{"minQty":1,"price":129},{"minQty":10,"price":115},{"minQty":25,"price":105},{"minQty":50,"price":95},{"minQty":100,"price":85}]'::jsonb),
  ('mogra-urli-bowl-candle', 419, 449, '[{"minQty":1,"price":419},{"minQty":10,"price":375},{"minQty":25,"price":345},{"minQty":50,"price":305},{"minQty":100,"price":270}]'::jsonb),
  ('marigold-diya-festive-urli-candle', 569, 599, '[{"minQty":1,"price":569},{"minQty":10,"price":510},{"minQty":25,"price":465},{"minQty":50,"price":415},{"minQty":100,"price":370}]'::jsonb),
  ('elephant-urli-candle', 199, 229, '[{"minQty":1,"price":199},{"minQty":10,"price":180},{"minQty":25,"price":165},{"minQty":50,"price":145},{"minQty":100,"price":130}]'::jsonb),
  ('turtle-urli-candle', 199, 229, '[{"minQty":1,"price":199},{"minQty":10,"price":180},{"minQty":25,"price":165},{"minQty":50,"price":145},{"minQty":100,"price":130}]'::jsonb),
  ('ruffle-shell-stand-candle', 199, 229, '[{"minQty":1,"price":199},{"minQty":10,"price":180},{"minQty":25,"price":165},{"minQty":50,"price":145},{"minQty":100,"price":130}]'::jsonb),
  ('floral-ring-urli-tealight-holder', 179, 199, '[{"minQty":1,"price":179},{"minQty":10,"price":160},{"minQty":25,"price":145},{"minQty":50,"price":130},{"minQty":100,"price":115}]'::jsonb),
  ('brass-tin-candle', 669, 699, '[{"minQty":1,"price":669},{"minQty":10,"price":600},{"minQty":25,"price":550},{"minQty":50,"price":490},{"minQty":100,"price":435}]'::jsonb),
  ('laxmi-charan-candle', 129, 149, '[{"minQty":1,"price":129},{"minQty":10,"price":115},{"minQty":25,"price":105},{"minQty":50,"price":95},{"minQty":100,"price":85}]'::jsonb),
  ('baby-feet-square-urli-candle', 169, 189, '[{"minQty":1,"price":169},{"minQty":10,"price":150},{"minQty":25,"price":140},{"minQty":50,"price":125},{"minQty":100,"price":110}]'::jsonb),
  ('poker-glass-jar-candle', 199, 229, '[{"minQty":1,"price":199},{"minQty":10,"price":180},{"minQty":25,"price":165},{"minQty":50,"price":145},{"minQty":100,"price":130}]'::jsonb),
  ('poker-urli-candle', 419, 449, '[{"minQty":1,"price":419},{"minQty":10,"price":375},{"minQty":25,"price":345},{"minQty":50,"price":305},{"minQty":100,"price":270}]'::jsonb),
  ('poker-tealight-box', 109, 129, '[{"minQty":1,"price":109},{"minQty":10,"price":100},{"minQty":25,"price":90},{"minQty":50,"price":80},{"minQty":100,"price":70}]'::jsonb),
  ('mandala-duo-gift-box', 269, 299, '[{"minQty":1,"price":269},{"minQty":10,"price":240},{"minQty":25,"price":220},{"minQty":50,"price":195},{"minQty":100,"price":175}]'::jsonb),
  ('rasmalai-cup-candle', 109, 129, '[{"minQty":1,"price":109},{"minQty":10,"price":100},{"minQty":25,"price":90},{"minQty":50,"price":80},{"minQty":100,"price":70}]'::jsonb)
) as v(slug, base_price, mrp, price_tiers)
where p.slug = v.slug;
