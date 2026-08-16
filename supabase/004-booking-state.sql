-- Sugandha Candles — update 004.
-- Stores the state/district worked out from the delivery pincode.
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.

alter table public.bookings
  add column if not exists state text;

-- Names are optional on the booking form now.
alter table public.bookings
  alter column buyer_name drop not null;

-- Clears the rows left behind while diagnosing the save error.
delete from public.bookings where buyer_name like 'diag%';
