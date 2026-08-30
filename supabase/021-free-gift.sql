-- Sugandha Candles — update 021.
-- Marks which candles may be given away as the free gift.
--
-- The gift is chosen by the buyer, so the list of what they may choose from has
-- to be decided by the shop, not by the cart. Left open, every buyer picks the
-- dearest candle in the shop — a ₹699 urli on a ₹2,000 order is a 35% discount
-- with free delivery on top, which is a sale, not a gift.
--
-- A flag beats a price cap: at Diwali you may want to give away something nicer,
-- and a candle that goes out of stock has to come off the list the same day. A
-- cap cannot express either.
--
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.

alter table public.products
  add column if not exists gift_eligible boolean not null default false;

create index if not exists products_gift_eligible_idx
  on public.products (gift_eligible) where gift_eligible;

-- A sensible opening list: everything at or under ₹149. Seven candles today.
-- Only runs while nothing is ticked yet, so it never undoes your own choices on
-- a re-run.
update public.products
  set gift_eligible = true
  where base_price <= 149
    and not exists (select 1 from public.products where gift_eligible);
