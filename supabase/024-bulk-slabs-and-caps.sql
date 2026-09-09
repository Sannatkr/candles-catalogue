-- 024 — bulk slabs, and a ceiling on every candle.
--
-- Two things, and they are NOT the same thing.
--
-- 1. `max_qty` — the most pieces of one design that go through the checkout.
--    Past it the buy button becomes a bulk enquiry: that many is a quote, not a
--    checkout. Three groups:
--      * Big or expensive — a dish 5 inches or wider, or anything over ₹399.
--        These stop at 9, so the button changes at 10. A peacock urli, a
--        festive lotus bowl, a brass tin: from ten pieces up, we quote.
--      * Everything else stops at 50. (The rasmalai cup keeps its own 100.)
--      * The mithai candles, sold in sets of ten, have no ceiling at all —
--        any number can be bought straight off the website.
--
-- 2. `free_ship_qty` — how many of one design earn free delivery on the order.
--    **Switched off everywhere for now** (0). The machinery stays in the code
--    and in the admin, so it can be turned on per candle later without a
--    migration — put 50, or 200, in the candle's "Free delivery from" box.
--
-- `bulk_pricing` decides whether the quantity slabs apply. True everywhere
-- except the mithai sets, which sit at one fixed price whatever the quantity.
--
-- The slab percentages are NOT here. They live in the admin under
-- Settings → Bulk pricing (10+ / 25+ / 50+ / 100+ / 200+, 3/5/8/12/15% by
-- default) so they can be tuned without a migration.
--
-- RUN ONCE. Re-running resets these three columns to the values below, so tune
-- them in the admin afterwards, not by running this again.

alter table public.products
  add column if not exists max_qty int not null default 0,
  add column if not exists free_ship_qty int not null default 0,
  add column if not exists bulk_pricing boolean not null default true;

update public.products set
  max_qty = case
    -- Sold in sets of ten: small, light, and the piece people order by the box.
    -- No ceiling — 13 cm is about 5 inches.
    when min_qty >= 10                              then 100000
    when diameter_cm >= 13 or base_price > 399      then 9
    when slug = 'rasmalai-cup-candle'               then 100
    else 50
  end,
  -- Off for now, everywhere. Turn it on per candle in the admin.
  free_ship_qty = 0,
  -- The mithai sets are already at a bulk price; the slabs must not cut again.
  bulk_pricing = (min_qty < 10);

create index if not exists products_bulk_pricing_idx
  on public.products (bulk_pricing) where bulk_pricing;
