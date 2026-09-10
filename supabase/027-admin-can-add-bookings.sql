-- 027 — give the admin back the right to write a booking row.
--
-- What broke. Update 025 tightened "bookings public insert" so a stranger
-- holding the publishable key can only write an honest, unpaid row:
-- status 'new', no amount_paid, no paid_at. That was the right fix for the
-- hole it closed, but it was the ONLY insert policy on the table.
--
-- 014 gave the admin read, update and delete — `for select`, `for update`,
-- `for delete` — and no insert. Until 025 that did not matter, because the
-- public insert policy said `with check (true)` and quietly covered the admin
-- too. The moment 025 narrowed it, Admin → Bookings → Add booking stopped
-- being able to save anything except a brand-new unpaid enquiry: saving one as
-- PAID or FULFILLED (which also stamps paid_at) came back as
--
--   new row violates row-level security policy for table "bookings"
--
-- The admin sits on the other side of a login and an admins-table check, and
-- already may update any booking to paid. Being allowed to create one that
-- starts out paid takes nothing away from 025 — a stranger still cannot,
-- because is_admin() is false for them.
--
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.

drop policy if exists "bookings admin insert" on public.bookings;

create policy "bookings admin insert" on public.bookings
  for insert to authenticated
  with check (public.is_admin());

-- Orders are not created by hand anywhere in the admin, so the orders side of
-- 025 is left exactly as it is: only checkout writes an order.
