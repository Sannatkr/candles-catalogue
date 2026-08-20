-- Sugandha Candles — update 012.
-- One-off tidy-up. The Amazer Chocolates order of 11 candles was entered while
-- a booking could still only hold one candle, so it landed as 11 rows. This
-- folds them back into the single order it always was, in the order they were
-- quoted.
--
-- Run 011 first. Paste into Supabase → SQL Editor → Run. Safe to run twice:
-- the eleven rows are gone after the first run, so a second does nothing.

with removed as (
  delete from public.bookings
  where buyer_name = 'Amazer Chocolates'
    and phone = '8087043339'
    and source = 'manual'
    and coalesce(jsonb_array_length(items), 0) <= 1
  returning *
),
folded as (
  select
    min(created_at) as created_at,
    jsonb_agg(
      jsonb_build_object(
        'slug',      product_slug,
        'name',      product_name,
        'image',     product_image,
        'qty',       quantity,
        'unitPrice', unit_price,
        'total',     total_price
      )
      -- Quotation order, which no timestamp can recover: all eleven rows were
      -- written in the same instant.
      order by array_position(
        array[
          'peacock-urli-candle',
          'lotus-pond-urli-candle',
          'lotus-pond-boat-candle',
          'designer-lotus-candle',
          'festive-lotus-urli-bowl-candle',
          'lotus-diya-candle',
          'hibiscus-urli-sparkle-candle',
          'marigold-diya-festive-urli-candle',
          'turtle-urli-candle',
          'ruffle-shell-stand-candle',
          'floral-ring-urli-tealight-holder'
        ]::text[],
        product_slug
      )
    ) as items,
    sum(quantity)::int as quantity,
    sum(total_price) as total_price,
    min(paid_at) as paid_at,
    min(pincode) as pincode,
    min(state) as state,
    min(phone) as phone,
    min(note) as note,
    min(status) as status,
    count(*) as lines
  from removed
)
insert into public.bookings (
  created_at, items, product_slug, product_name, product_image,
  quantity, unit_price, total_price,
  pincode, state, buyer_name, phone, note, status, source, paid_at
)
select
  created_at,
  items,
  items -> 0 ->> 'slug',
  (items -> 0 ->> 'name') || ' + ' || (lines - 1) || ' more',
  items -> 0 ->> 'image',
  quantity,
  0, -- eleven different rates; the lines carry them
  total_price,
  pincode,
  state,
  'Amazer Chocolates',
  phone,
  'Amazer Chocolates, Shop no 64, Vastushree Complex, Off Hyde Park, Gultekdi, Pune 411037.',
  status,
  'manual',
  paid_at
from folded
where lines > 0;
