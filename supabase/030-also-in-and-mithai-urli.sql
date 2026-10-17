-- 030 — candles that appear in more than one collection, and the mithai
-- collage.
--
-- `also_in` lists the other collections a candle is shown in, by slug. Its
-- home stays `collection_slug`. The ten mithai pieces are also shown in
-- Festive Candles, where most buyers look first. Edited in the admin under
-- "Also show in".
--
-- The single mithai urli is renamed Mithai Urli Candle, and the collection's
-- order is changed so its collage reads: 12-box, Mithai Urli, Mithai Box (6).
--
-- Safe to run twice.

alter table public.products
  add column if not exists also_in text[] not null default '{}';

update public.products set name = 'Mithai Urli Candle' where slug = 'mithai-single-candle';

update public.products set sort_order = 10 where slug = 'laddoo-candle-box-12';
update public.products set sort_order = 11 where slug = 'mithai-single-candle';
update public.products set sort_order = 12 where slug = 'mithai-box-candle';
update public.products set sort_order = 13 where slug = 'laddoo-candle-box-9';
update public.products set sort_order = 14 where slug = 'laddoo-candle-box-4';

update public.products
set also_in = array['festive-candles']
where collection_slug = 'mithai-candles';

select slug, name, sort_order, also_in
from public.products
where collection_slug = 'mithai-candles'
order by sort_order;
