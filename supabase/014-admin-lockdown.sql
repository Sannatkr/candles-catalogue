-- Sugandha Candles — update 014.
-- Separates "is logged in" from "is an admin".
--
-- Until now every rule on every table said `to authenticated using (true)` —
-- anyone with a login could read every booking and order, phone numbers and
-- addresses included, and edit any price. That was safe only because exactly
-- one person could log in: you.
--
-- The moment customers can create accounts, that stops being true. This file
-- has to be run BEFORE any customer login is switched on.
--
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.

-- ------------------------------------------------------------ who is one ---

create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

/**
 * SECURITY DEFINER on purpose. The policy on public.admins itself calls this
 * function, so if it ran as the caller it would have to read admins to decide
 * whether it may read admins, and recurse forever. Running as the owner reads
 * the table directly and settles the question in one step.
 *
 * search_path is pinned so nothing can be shadowed by a temp schema.
 */
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Everyone who can log in today IS an admin — no customer accounts exist yet.
-- Doing this before the policies change means the current login never loses
-- access mid-migration. Anyone who signs up after this runs is not an admin.
insert into public.admins (user_id, note)
select id, 'seeded by 014 — had a login before customer accounts existed'
from auth.users
on conflict (user_id) do nothing;

alter table public.admins enable row level security;

drop policy if exists "admins self read" on public.admins;
-- Readable only by admins, and never writable through the API. Adding an admin
-- is a deliberate act in the SQL editor, not something an app request can do.
create policy "admins self read" on public.admins
  for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------- the catalogue ---
-- Public read stays exactly as it was: the shop must work for strangers.

drop policy if exists "collections admin write" on public.collections;
create policy "collections admin write" on public.collections
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "settings admin write" on public.site_settings;
create policy "settings admin write" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- -------------------------------------------------------------- bookings ---
-- A buyer may still write an enquiry. Reading them back is the admin's alone.

drop policy if exists "bookings admin read"   on public.bookings;
drop policy if exists "bookings admin write"  on public.bookings;
drop policy if exists "bookings admin delete" on public.bookings;

create policy "bookings admin read" on public.bookings
  for select to authenticated using (public.is_admin());
create policy "bookings admin write" on public.bookings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "bookings admin delete" on public.bookings
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------- orders ---

drop policy if exists "orders admin read"   on public.orders;
drop policy if exists "orders admin write"  on public.orders;
drop policy if exists "orders admin delete" on public.orders;

create policy "orders admin read" on public.orders
  for select to authenticated using (public.is_admin());
create policy "orders admin write" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "orders admin delete" on public.orders
  for delete to authenticated using (public.is_admin());

-- --------------------------------------------------------------- storage ---
-- Product photos stay publicly readable; uploading and deleting does not.

drop policy if exists "product images admin write" on storage.objects;
create policy "product images admin write" on storage.objects
  for all to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

-- ------------------------------------------------------------------ note ---
-- To add another admin later:
--   insert into public.admins (user_id, note)
--   select id, 'second admin' from auth.users where email = 'them@example.com';
