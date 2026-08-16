-- Sugandha Candles — database setup.
-- Paste this whole file into Supabase → SQL Editor → Run. Safe to run twice.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- tables ---

create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  tagline     text default '',
  description text default '',
  cover_image text,
  sort_order  int  default 0,
  created_at  timestamptz default now()
);

create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  name             text not null,
  collection_slug  text not null references public.collections(slug) on update cascade,
  tagline          text default '',
  description      text default '',
  images           text[] default '{}',
  size_chart_image text,
  fragrance        text default '',
  wax_type         text default '',
  wick_type        text default '',
  burn_time_hours  numeric default 0,
  height_cm        numeric default 0,
  diameter_cm      numeric default 0,
  weight_grams     numeric default 0,
  base_price       numeric default 0,
  price_tiers      jsonb   default '[]'::jsonb,
  packaging        text    default '',
  in_stock         boolean default true,
  featured         boolean default false,
  sort_order       int     default 0,
  created_at       timestamptz default now()
);

create index if not exists products_collection_idx on public.products (collection_slug);

create table if not exists public.site_settings (
  id         int primary key default 1,
  data       jsonb not null,
  updated_at timestamptz default now(),
  constraint site_settings_single_row check (id = 1)
);

-- ------------------------------------------------------------------ rls ----
-- Anyone can read the catalogue. Only a signed-in admin can change it.

alter table public.collections   enable row level security;
alter table public.products      enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "collections public read"   on public.collections;
drop policy if exists "collections admin write"   on public.collections;
drop policy if exists "products public read"      on public.products;
drop policy if exists "products admin write"      on public.products;
drop policy if exists "settings public read"      on public.site_settings;
drop policy if exists "settings admin write"      on public.site_settings;

create policy "collections public read" on public.collections
  for select using (true);
create policy "collections admin write" on public.collections
  for all to authenticated using (true) with check (true);

create policy "products public read" on public.products
  for select using (true);
create policy "products admin write" on public.products
  for all to authenticated using (true) with check (true);

create policy "settings public read" on public.site_settings
  for select using (true);
create policy "settings admin write" on public.site_settings
  for all to authenticated using (true) with check (true);

-- -------------------------------------------------------------- storage ----

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "product images public read" on storage.objects;
drop policy if exists "product images admin write" on storage.objects;

create policy "product images public read" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "product images admin write" on storage.objects
  for all to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

-- ------------------------------------------------------ starting content ---

insert into public.site_settings (id, data)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

insert into public.collections (slug, name, tagline, description, sort_order) values
  ('signature-jars',        'Signature Jars',        'Our core range, in glass',   '', 1),
  ('pillars-and-blocks',    'Pillars & Blocks',      'Unscented, architectural',   '', 2),
  ('tealights-and-votives', 'Tealights & Votives',   'Small format, high volume',  '', 3),
  ('festive-and-gifting',   'Festive & Gifting',     'Diwali, weddings, corporate','', 4)
on conflict (slug) do nothing;
