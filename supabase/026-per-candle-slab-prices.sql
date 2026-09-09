-- 026 — a hand-set price for any rung of the ladder, on any candle.
--
-- Until now a rung was a percentage and nothing else: Settings said 25+ is 5%
-- off, and every candle took 5% off its own price. That is the right default —
-- one number to change, thirty-six candles follow — but it cannot say "on the
-- peacock urli, a hundred pieces is ₹425, because that is the number I quoted
-- that buyer last Diwali and I am not moving off it."
--
-- `tier_prices` holds those hand-set numbers, keyed by the rung's quantity:
--
--     {"25": 474, "100": 425}
--
-- A rung listed here is charged at exactly that price. A rung not listed falls
-- back to the percentage in Settings, so leaving this empty changes nothing and
-- is the normal state for most candles. Deleting a number in the admin removes
-- the key and hands the rung back to the percentage.
--
-- Keyed by quantity rather than by position on purpose: inserting a new rung in
-- Settings later must not silently re-point every hand-set price on every
-- candle at a different quantity.
--
-- Safe to run twice.

alter table public.products
  add column if not exists tier_prices jsonb not null default '{}'::jsonb;
