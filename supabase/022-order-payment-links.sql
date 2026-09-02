-- Sugandha Candles — update 022.
-- Razorpay payment links against a retail order, so an order whose checkout
-- failed can be paid later from a link the admin sends by hand.
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.

alter table public.orders add column if not exists payment_link_id  text;
alter table public.orders add column if not exists payment_link_url text;

-- The webhook looks the order up by this when the link is paid.
create index if not exists orders_payment_link_idx on public.orders (payment_link_id);

-- The webhook writes with the service role, which bypasses RLS, so no new
-- policy is needed.
