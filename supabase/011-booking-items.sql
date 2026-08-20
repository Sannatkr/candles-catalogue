-- Sugandha Candles — update 011.
-- One order can hold several candles. The lines live in a jsonb list, and the
-- older single-candle columns stay filled — product_slug with the first line,
-- quantity with the total pieces, total_price with the order total — so nothing
-- written before this update has to change.
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.

alter table public.bookings add column if not exists items jsonb not null default '[]'::jsonb;

-- unit_price stops meaning anything on an order with several rates in it.
alter table public.bookings alter column unit_price drop not null;

-- Everything booked until now is a single line. Writing it into items means no
-- screen ever has to handle a booking without them. Rows that already have
-- items are left alone, so running this again changes nothing.
update public.bookings
set items = jsonb_build_array(
  jsonb_build_object(
    'slug',      product_slug,
    'name',      product_name,
    'image',     product_image,
    'qty',       quantity,
    'unitPrice', coalesce(unit_price, 0),
    'total',     total_price
  )
)
where items = '[]'::jsonb;
