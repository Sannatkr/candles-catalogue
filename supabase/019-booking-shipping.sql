-- Sugandha Candles — update 019.
-- Lets an enquiry be shipped by hand: it needs a full street address (enquiries
-- only captured pincode + state before) and a place to record the RapidShyp
-- shipment once created.
--
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.

alter table public.bookings add column if not exists address text;
alter table public.bookings add column if not exists rapidshyp_order_id text;
