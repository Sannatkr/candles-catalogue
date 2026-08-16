-- Sugandha Candles — update 002.
-- Adds product keywords (for search + filters) and the order booking table.
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.

-- --------------------------------------------------------------- keywords ---

alter table public.products
  add column if not exists keywords text[] default '{}';

create index if not exists products_keywords_idx on public.products using gin (keywords);

-- --------------------------------------------------------------- bookings ---

create table if not exists public.bookings (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  product_slug  text not null,
  product_name  text not null,
  product_image text,
  quantity      int  not null check (quantity > 0 and quantity <= 100000),
  unit_price    numeric not null default 0,
  total_price   numeric not null default 0,
  fragrance     text,
  pincode       text,
  buyer_name    text not null,
  buyer_contact text not null,
  note          text,
  status        text not null default 'new'
                check (status in ('new','contacted','confirmed','closed'))
);

create index if not exists bookings_created_idx on public.bookings (created_at desc);

alter table public.bookings enable row level security;

drop policy if exists "bookings public insert" on public.bookings;
drop policy if exists "bookings admin read"    on public.bookings;
drop policy if exists "bookings admin write"   on public.bookings;
drop policy if exists "bookings admin delete"  on public.bookings;

-- A buyer can place an order but can never read anyone's orders back.
create policy "bookings public insert" on public.bookings
  for insert to anon, authenticated with check (true);

create policy "bookings admin read" on public.bookings
  for select to authenticated using (true);

create policy "bookings admin write" on public.bookings
  for update to authenticated using (true) with check (true);

create policy "bookings admin delete" on public.bookings
  for delete to authenticated using (true);
