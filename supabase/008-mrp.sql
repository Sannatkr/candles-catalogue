-- Sugandha Candles — update 008.
-- MRP shown struck through beside each price. Set to 0 to hide it.
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.

alter table public.products add column if not exists mrp numeric not null default 0;

update public.products as p set mrp = v.mrp
from (values
  ("peacock-urli-candle", 725),
  ("lotus-pond-urli-candle", 425),
  ("mithai-box-candle", 255),
  ("lotus-pond-boat-candle", 475),
  ("designer-lotus-candle", 155),
  ("lotus-boat-tealight-box", 255),
  ("lotus-diya-candle", 125),
  ("festive-lotus-urli-bowl-candle", 725),
  ("hibiscus-urli-candle", 425),
  ("hibiscus-urli-sparkle-candle", 275),
  ("sunflower-urli-sparkle-candle", 275),
  ("red-lotus-small-urli-candle", 175),
  ("mogra-urli-candle", 175),
  ("mogra-urli-bowl-candle", 475),
  ("marigold-diya-festive-urli-candle", 625),
  ("elephant-urli-candle", 255),
  ("turtle-urli-candle", 255),
  ("ruffle-shell-stand-candle", 255),
  ("floral-ring-urli-tealight-holder", 225),
  ("brass-tin-candle", 725),
  ("laxmi-charan-candle", 175),
  ("baby-feet-square-urli-candle", 215),
  ("poker-glass-jar-candle", 255),
  ("poker-urli-candle", 475),
  ("poker-tealight-box", 155),
  ("mandala-duo-gift-box", 325),
  ("rasmalai-cup-candle", 155)
) as v(slug, mrp)
where p.slug = v.slug;
