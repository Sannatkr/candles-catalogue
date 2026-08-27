-- Sugandha Candles — update 016.
-- Adds a 'refunded' status to orders.
--
-- Marking an order refunded is a record, not an action: you return the money in
-- the Razorpay dashboard, then mark it here so the order stops looking like an
-- open sale. It is deliberately kept out of the "collected" total, the same way
-- a cancelled order is.
--
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.

alter table public.orders drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('pending','paid','packed','shipped','delivered','cancelled','refunded','failed'));
