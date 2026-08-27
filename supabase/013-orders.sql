-- Sugandha Candles — update 013.
-- Paid orders, kept separate from bookings.
--
-- bookings  = someone asked. An enquiry, a bulk quote, a waitlist slot. No money.
-- orders    = someone paid. A real parcel that has to be packed and shipped.
--
-- They are deliberately two tables: an enquiry can sit open for a week and come
-- to nothing, while an order is a promise with money behind it. Sharing one
-- table would mean every screen and every count has to remember which kind of
-- row it is looking at.
--
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.

create extension if not exists "pgcrypto";

create table if not exists public.orders (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Short, sayable, unique. What a buyer quotes on Instagram: SC-7Q4M2X.
  reference  text unique not null,

  -- One row per candle: { slug, name, image, qty, unitPrice, total }.
  items      jsonb not null default '[]'::jsonb,
  subtotal   numeric not null default 0,
  shipping   numeric not null default 0,
  total      numeric not null default 0,

  buyer_name text not null,
  phone      text not null,
  email      text,
  instagram  text,

  -- Retail orders ship, so the address is not optional here. The bulk enquiry
  -- form is where an address may be left blank.
  pincode       text not null,
  state         text,
  city          text,
  address_line1 text not null,
  address_line2 text,
  note          text,

  status text not null default 'pending'
    check (status in ('pending','paid','packed','shipped','delivered','cancelled','failed')),

  razorpay_order_id   text,
  razorpay_payment_id text,
  amount_paid         numeric not null default 0,
  paid_at             timestamptz,

  -- Filled in once the parcel is handed over. Shipping integration comes later;
  -- until then these are typed in by hand from the courier's receipt.
  carrier         text,
  tracking_number text,
  tracking_url    text
);

create index if not exists orders_created_idx  on public.orders (created_at desc);
create index if not exists orders_status_idx   on public.orders (status);
create index if not exists orders_rzp_idx      on public.orders (razorpay_order_id);

-- ------------------------------------------------------------------ rls ----
-- Same shape as bookings: a buyer may write their own order and never read the
-- table back. Marking one paid is a server job and goes through the service
-- role, which bypasses RLS — a buyer must not be able to promote their own
-- order to paid without money changing hands.

alter table public.orders enable row level security;

drop policy if exists "orders public insert" on public.orders;
drop policy if exists "orders admin read"    on public.orders;
drop policy if exists "orders admin write"   on public.orders;
drop policy if exists "orders admin delete"  on public.orders;

create policy "orders public insert" on public.orders
  for insert to anon, authenticated with check (true);

create policy "orders admin read" on public.orders
  for select to authenticated using (true);

create policy "orders admin write" on public.orders
  for update to authenticated using (true) with check (true);

create policy "orders admin delete" on public.orders
  for delete to authenticated using (true);

-- -------------------------------------------------------------- receipt ----
-- The thank-you page has to survive a refresh, so it re-reads the order. It
-- runs as the buyer, who cannot select from the table. This function is the one
-- narrow gap: it needs BOTH the row's uuid and its reference to match, and it
-- returns only what is already printed on the buyer's own receipt — no phone,
-- no address, nothing about any other order.

create or replace function public.order_receipt(p_id uuid, p_reference text)
returns table (
  reference  text,
  items      jsonb,
  subtotal   numeric,
  shipping   numeric,
  total      numeric,
  status     text,
  created_at timestamptz,
  buyer_name text,
  city       text,
  state      text,
  pincode    text
)
language sql
security definer
set search_path = public
as $$
  select o.reference, o.items, o.subtotal, o.shipping, o.total, o.status,
         o.created_at, o.buyer_name, o.city, o.state, o.pincode
  from public.orders o
  where o.id = p_id
    and o.reference = p_reference;
$$;

revoke all on function public.order_receipt(uuid, text) from public;
grant execute on function public.order_receipt(uuid, text) to anon, authenticated;
