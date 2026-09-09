-- 025 — a stranger may start an order, but never one that claims to be paid.
--
-- The hole this closes. The publishable Supabase key ships inside the site's
-- own JavaScript — that is what it is for, and it is not a secret. Both public
-- insert policies were written as `with check (true)`, so anyone holding that
-- key could POST straight at /rest/v1/orders and write a row of their own
-- choosing. Including `status = 'paid'`, with `amount_paid` and `paid_at`
-- filled in and any items they liked.
--
-- Nobody could read the table back, and no money moved. But the row lands in
-- Admin → Orders looking exactly like a real paid order, and the next step
-- after a paid order is packing it and handing it to the courier. Same for
-- bookings, where a fake `amount_paid` would flow into the revenue screen.
--
-- The old comment on 013 said "marking one paid is a server job and goes
-- through the service role". That was true of UPDATE and was never true of
-- INSERT, which is where the gap was.
--
-- The fix keeps the shop working exactly as it does — the checkout writes a
-- pending row and Razorpay's signed callback promotes it with the service key,
-- which bypasses RLS — while making the only row a stranger can write an
-- honest, unpaid one.
--
-- Safe to run twice.

-- ---------------------------------------------------------------- orders ---

drop policy if exists "orders public insert" on public.orders;

create policy "orders public insert" on public.orders
  for insert to anon, authenticated
  with check (
    status = 'pending'
    and coalesce(amount_paid, 0) = 0
    and paid_at is null
    and razorpay_payment_id is null
  );

-- -------------------------------------------------------------- bookings ---

drop policy if exists "bookings public insert" on public.bookings;

create policy "bookings public insert" on public.bookings
  for insert to anon, authenticated
  with check (
    status = 'new'
    and coalesce(amount_paid, 0) = 0
    and paid_at is null
    and payment_link_id is null
    and paid_via is null
  );
