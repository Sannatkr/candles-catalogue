-- Sugandha Candles — update 017.
-- Weight-based shipping. Adds a per-candle "pack weight" — the weight a courier
-- actually bills for once the piece is bubble-wrapped and boxed, which is far
-- more than the wax weighs.
--
-- Existing candles are back-filled with a rough estimate from their size and
-- weight so nothing ships free by mistake; edit the big or fragile ones by hand
-- in the admin afterwards. The rate table and zones live in Settings (the JSON
-- site_settings row), so there is nothing to add for those here.
--
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.

alter table public.products
  add column if not exists pack_weight_grams integer;

-- Back-fill only rows that have not been set. Estimate = the greater of the wax
-- weight and the box's volumetric weight ((h·d·d)/5 grams), times a packing
-- factor of 3, with a 250 g floor. Mirrors estimatePackGrams() in the app.
update public.products
set pack_weight_grams = greatest(
  250,
  round(
    greatest(
      coalesce(weight_grams, 0),
      coalesce(height_cm, 0) * coalesce(diameter_cm, 0) * coalesce(diameter_cm, 0) / 5.0
    ) * 3
  )::int
)
where pack_weight_grams is null;
