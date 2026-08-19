-- Sugandha Candles — update 010.
-- Razorpay payment links against a booking, and what came back.
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.

alter table public.bookings add column if not exists payment_link_id  text;
alter table public.bookings add column if not exists payment_link_url text;
-- What the link was raised for; may be an advance rather than the full total.
alter table public.bookings add column if not exists payment_amount   numeric;
alter table public.bookings add column if not exists amount_paid      numeric not null default 0;
alter table public.bookings add column if not exists paid_via         text;

create index if not exists bookings_payment_link_idx on public.bookings (payment_link_id);

-- The webhook writes with the service role, which bypasses RLS, so no new
-- policy is needed. Buyers still cannot read this table.
