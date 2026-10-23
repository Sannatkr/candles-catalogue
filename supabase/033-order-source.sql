-- 033 — where each order came from (2026-10-23).
--
-- The Meta Pixel reports to Meta, not to us. To answer "did the Instagram ad
-- sell anything?" the storefront now remembers how a visitor arrived (UTM
-- tags, Meta's fbclid, the referring site) and the checkout stores it on the
-- order. `source` is the one-word verdict the admin shows; the rest is the
-- evidence behind it.
--
-- Run in the Supabase SQL Editor. Existing orders keep nulls and show as
-- "Direct"; only orders placed after the deploy carry a source.

alter table public.orders
  add column if not exists source       text,   -- meta_ads | social | google | direct | other
  add column if not exists utm_source   text,
  add column if not exists utm_medium   text,
  add column if not exists utm_campaign text,
  add column if not exists fbclid       text,
  add column if not exists referrer     text,
  add column if not exists landing_path text;

-- Check: all seven columns should be listed.
-- select column_name from information_schema.columns
--  where table_name = 'orders' and column_name in
--  ('source','utm_source','utm_medium','utm_campaign','fbclid','referrer','landing_path');
