-- Sugandha Candles — update 018.
-- Records the RapidShyp shipment created for a paid order, so it is not created
-- twice and so the id can be shown in the admin.
--
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.

alter table public.orders
  add column if not exists rapidshyp_order_id text;
