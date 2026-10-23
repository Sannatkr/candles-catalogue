-- 034 — Diwali 2026 price rise, part 2: the hand-set bulk rates (2026-10-23).
--
-- 031 raised every candle's single-piece price and MRP, but 70 candles carry
-- hand-set bulk rates in `tier_prices` (10+ / 25+ / 50+ / 100+ / 200+), and
-- those are charged as-is, so they stayed at the old level. This raises each
-- rung by the same percentage that candle's single price went up, rounded to
-- the rupee (a rung that ended in 9 stays on a 9). Every rung is still below
-- the single price and the ladder still steps down.
--
-- Candles with no hand-set rates (percentage slabs from Settings) already
-- follow the new single price and are not touched here.
--
-- Run in the Supabase SQL Editor. Shop pages cache up to 1 h; a push clears it.

update public.products p
set tier_prices = v.tiers::jsonb
from (values
  ('peacock-urli-candle', '{"10": 609, "25": 549, "50": 489, "100": 449, "200": 409}'),
  ('small-peacock-urli-candle', '{"10": 459, "25": 429, "50": 399, "100": 369, "200": 329}'),
  ('peacock-pond-urli-candle', '{"10": 969, "25": 939, "50": 889, "100": 849, "200": 689}'),
  ('peacock-four-diya-urli-set', '{"10": 449, "25": 429, "50": 409, "100": 369, "200": 329}'),
  ('red-peacock-tealight-candle', '{"10": 162, "25": 159, "50": 139, "100": 129, "200": 119}'),
  ('three-tier-pearl-urli-candle', '{"10": 729, "25": 549, "50": 489, "100": 419, "200": 399}'),
  ('three-tier-sky-blue-urli-candle', '{"10": 729, "25": 549, "50": 489, "100": 419, "200": 399}'),
  ('three-tier-rose-ruby-urli-candle', '{"10": 729, "25": 549, "50": 489, "100": 419, "200": 399}'),
  ('three-tier-haldi-kumkum-urli-candle', '{"10": 729, "25": 549, "50": 489, "100": 419, "200": 399}'),
  ('laddoo-candle-box-12', '{"10": 339, "25": 319, "50": 299, "100": 269, "200": 249}'),
  ('three-tier-blush-pink-urli-candle', '{"10": 729, "25": 549, "50": 489, "100": 419, "200": 399}'),
  ('three-tier-mint-marigold-urli-candle', '{"10": 729, "25": 549, "50": 489, "100": 419, "200": 399}'),
  ('mithai-single-candle', '{"10": 219, "25": 189, "50": 169, "100": 159, "200": 129}'),
  ('three-tier-pink-ombre-urli-candle', '{"10": 729, "25": 549, "50": 489, "100": 419, "200": 399}'),
  ('lotus-pond-urli-candle', '{"10": 339, "25": 309, "50": 279, "100": 249, "200": 209}'),
  ('mithai-box-candle', '{"10": 239, "25": 213, "50": 179, "100": 169, "200": 149}'),
  ('laddoo-candle-box-9', '{"10": 279, "25": 270, "50": 239, "100": 222, "200": 204}'),
  ('peacock-rangoli-urli-set', '{"10": 669, "25": 609, "50": 549, "100": 489, "200": 429}'),
  ('laddoo-candle-box-4', '{"10": 220, "25": 201, "50": 181, "100": 162, "200": 139}'),
  ('lotus-rangoli-urli-set', '{"10": 729, "25": 669, "50": 609, "100": 549, "200": 489}'),
  ('yellow-pond-lotus-urli-candle', '{"10": 339, "25": 309, "50": 279, "100": 249, "200": 209}'),
  ('lotus-pond-boat-candle', '{"10": 549, "25": 489, "50": 429, "100": 399, "200": 369}'),
  ('designer-lotus-candle', '{"10": 129, "25": 119, "50": 109, "100": 99, "200": 89}'),
  ('lotus-boat-tealight-box', '{"10": 279, "25": 239, "50": 219, "100": 189, "200": 168}'),
  ('floral-tealight-box', '{"10": 162, "25": 159, "50": 139, "100": 129, "200": 119}'),
  ('lotus-diya-candle', '{"10": 79, "25": 69, "50": 59, "100": 49, "200": 42}'),
  ('festive-lotus-urli-bowl-candle', '{"10": 809, "25": 759, "50": 729, "100": 669, "200": 609}'),
  ('hibiscus-urli-candle', '{"10": 329, "25": 299, "50": 249, "100": 219, "200": 191}'),
  ('hibiscus-urli-sparkle-candle', '{"10": 219, "25": 189, "50": 169, "100": 159, "200": 129}'),
  ('sunflower-urli-sparkle-candle', '{"10": 219, "25": 189, "50": 169, "100": 159, "200": 129}'),
  ('emerald-lily-pond-urli-candle', '{"10": 219, "25": 189, "50": 169, "100": 159, "200": 129}'),
  ('sapphire-lotus-pond-urli-candle', '{"10": 219, "25": 189, "50": 169, "100": 159, "200": 129}'),
  ('red-lotus-small-urli-candle', '{"10": 162, "25": 159, "50": 139, "100": 129, "200": 119}'),
  ('green-pond-urli-candle', '{"10": 162, "25": 159, "50": 139, "100": 129, "200": 119}'),
  ('mogra-urli-candle', '{"10": 159, "25": 149, "50": 129, "100": 119, "200": 109}'),
  ('mogra-urli-bowl-candle', '{"10": 549, "25": 529, "50": 489, "100": 469, "200": 409}'),
  ('marigold-diya-festive-urli-candle', '{"10": 529, "25": 489, "50": 429, "100": 399, "200": 369}'),
  ('elephant-urli-candle', '{"10": 279, "25": 249, "50": 239, "100": 219, "200": 199}'),
  ('turtle-urli-candle', '{"10": 239, "25": 229, "50": 203, "100": 190, "200": 174}'),
  ('ruffle-shell-stand-candle', '{"10": 269, "25": 239, "50": 229, "100": 219, "200": 189}'),
  ('floral-ring-urli-tealight-holder', '{"10": 208, "25": 201, "50": 190, "100": 181, "200": 169}'),
  ('brass-tin-candle', '{"10": 689, "25": 669, "50": 609, "100": 579, "200": 519}'),
  ('baby-feet-square-urli-candle', '{"10": 209, "25": 199, "50": 179, "100": 169, "200": 159}'),
  ('poker-urli-candle', '{"10": 489, "25": 449, "50": 419, "100": 399, "200": 359}'),
  ('poker-tealight-box', '{"10": 159, "25": 149, "50": 119, "100": 109, "200": 99}'),
  ('mandala-duo-gift-box', '{"10": 339, "25": 309, "50": 279, "100": 249, "200": 219}'),
  ('rasmalai-cup-candle', '{"10": 109, "25": 99, "50": 79, "100": 69, "200": 59}'),
  ('rose-petal-wax-sachet', '{"10": 269, "25": 259, "50": 239, "100": 219, "200": 201}'),
  ('seashell-wax-sachet', '{"10": 269, "25": 259, "50": 239, "100": 219, "200": 201}'),
  ('blue-ocean-shell-wax-sachet', '{"10": 269, "25": 259, "50": 239, "100": 219, "200": 201}'),
  ('orange-wax-sachet', '{"10": 269, "25": 259, "50": 239, "100": 219, "200": 201}'),
  ('coffee-wax-sachet', '{"10": 269, "25": 259, "50": 239, "100": 219, "200": 201}'),
  ('hibiscus-wax-sachet', '{"10": 162, "25": 159, "50": 139, "100": 129, "200": 119}'),
  ('sunflower-wax-sachet', '{"10": 162, "25": 159, "50": 139, "100": 129, "200": 119}'),
  ('seashell-jar-candle', '{"10": 849, "25": 789, "50": 729, "100": 669, "200": 609}'),
  ('blue-lotus-pond-boat-mini-hamper', '{"10": 283, "25": 267, "50": 249, "100": 234, "200": 219}'),
  ('red-hibiscus-sparkle-mini-hamper', '{"10": 281, "25": 259, "50": 246, "100": 228, "200": 210}'),
  ('red-bloom-lily-pond-mini-hamper', '{"10": 281, "25": 259, "50": 246, "100": 228, "200": 210}'),
  ('blue-pond-pearl-lotus-mini-hamper', '{"10": 281, "25": 259, "50": 246, "100": 228, "200": 210}'),
  ('laddoo-jalebi-mithai-mini-hamper', '{"10": 301, "25": 279, "50": 265, "100": 246, "200": 228}'),
  ('hibiscus-rose-mini-hamper', '{"10": 281, "25": 259, "50": 246, "100": 228, "200": 210}'),
  ('yellow-dahlia-garden-mini-hamper', '{"10": 281, "25": 259, "50": 246, "100": 228, "200": 210}'),
  ('pale-blue-marigold-pearl-mini-hamper', '{"10": 281, "25": 259, "50": 246, "100": 228, "200": 210}'),
  ('mint-frangipani-pearl-mini-hamper', '{"10": 281, "25": 259, "50": 246, "100": 228, "200": 210}'),
  ('peacock-diya-laddoo-mini-hamper', '{"10": 317, "25": 295, "50": 273, "100": 252, "200": 229}'),
  ('red-marigold-ring-mini-hamper', '{"10": 281, "25": 259, "50": 246, "100": 228, "200": 210}'),
  ('teen-patti-cards-mini-hamper', '{"10": 283, "25": 267, "50": 249, "100": 234, "200": 219}'),
  ('marigold-rose-bloom-mini-hamper', '{"10": 281, "25": 259, "50": 246, "100": 228, "200": 210}')
) as v(slug, tiers)
where p.slug = v.slug;

-- Check: 0 rows means every 10+ rate sits below the single price.
-- select slug, base_price, tier_prices from public.products
-- where bulk_pricing and (tier_prices->>'10')::int >= base_price;

-- ---------------------------------------------------------------- undo ----
-- The bulk rates as they were on 2026-10-23, before this ran:
-- update public.products p
-- set tier_prices = v.tiers::jsonb
-- from (values
--   ('peacock-urli-candle', '{"10": 499, "25": 449, "50": 399, "100": 369, "200": 339}'),
--   ('small-peacock-urli-candle', '{"10": 379, "25": 349, "50": 329, "100": 299, "200": 269}'),
--   ('peacock-pond-urli-candle', '{"10": 799, "25": 769, "50": 729, "100": 699, "200": 569}'),
--   ('peacock-four-diya-urli-set', '{"10": 369, "25": 349, "50": 329, "100": 299, "200": 269}'),
--   ('red-peacock-tealight-candle', '{"10": 135, "25": 129, "50": 119, "100": 109, "200": 99}'),
--   ('three-tier-pearl-urli-candle', '{"10": 599, "25": 449, "50": 399, "100": 349, "200": 329}'),
--   ('three-tier-sky-blue-urli-candle', '{"10": 599, "25": 449, "50": 399, "100": 349, "200": 329}'),
--   ('three-tier-rose-ruby-urli-candle', '{"10": 599, "25": 449, "50": 399, "100": 349, "200": 329}'),
--   ('three-tier-haldi-kumkum-urli-candle', '{"10": 599, "25": 449, "50": 399, "100": 349, "200": 329}'),
--   ('laddoo-candle-box-12', '{"10": 279, "25": 259, "50": 239, "100": 219, "200": 199}'),
--   ('three-tier-blush-pink-urli-candle', '{"10": 599, "25": 449, "50": 399, "100": 349, "200": 329}'),
--   ('three-tier-mint-marigold-urli-candle', '{"10": 599, "25": 449, "50": 399, "100": 349, "200": 329}'),
--   ('mithai-single-candle', '{"10": 179, "25": 159, "50": 139, "100": 129, "200": 109}'),
--   ('three-tier-pink-ombre-urli-candle', '{"10": 599, "25": 449, "50": 399, "100": 349, "200": 329}'),
--   ('lotus-pond-urli-candle', '{"10": 279, "25": 249, "50": 229, "100": 199, "200": 169}'),
--   ('mithai-box-candle', '{"10": 199, "25": 175, "50": 149, "100": 139, "200": 119}'),
--   ('laddoo-candle-box-9', '{"10": 229, "25": 225, "50": 199, "100": 185, "200": 170}'),
--   ('peacock-rangoli-urli-set', '{"10": 549, "25": 499, "50": 449, "100": 399, "200": 349}'),
--   ('laddoo-candle-box-4', '{"10": 183, "25": 167, "50": 151, "100": 135, "200": 119}'),
--   ('lotus-rangoli-urli-set', '{"10": 599, "25": 549, "50": 499, "100": 449, "200": 399}'),
--   ('yellow-pond-lotus-urli-candle', '{"10": 279, "25": 249, "50": 229, "100": 199, "200": 169}'),
--   ('lotus-pond-boat-candle', '{"10": 449, "25": 399, "50": 349, "100": 329, "200": 299}'),
--   ('designer-lotus-candle', '{"10": 109, "25": 99, "50": 89, "100": 79, "200": 69}'),
--   ('lotus-boat-tealight-box', '{"10": 229, "25": 199, "50": 179, "100": 159, "200": 140}'),
--   ('floral-tealight-box', '{"10": 135, "25": 129, "50": 119, "100": 109, "200": 99}'),
--   ('lotus-diya-candle', '{"10": 69, "25": 59, "50": 49, "100": 39, "200": 35}'),
--   ('festive-lotus-urli-bowl-candle', '{"10": 669, "25": 629, "50": 599, "100": 549, "200": 499}'),
--   ('hibiscus-urli-candle', '{"10": 269, "25": 239, "50": 199, "100": 179, "200": 155}'),
--   ('hibiscus-urli-sparkle-candle', '{"10": 179, "25": 159, "50": 139, "100": 129, "200": 109}'),
--   ('sunflower-urli-sparkle-candle', '{"10": 179, "25": 159, "50": 139, "100": 129, "200": 109}'),
--   ('emerald-lily-pond-urli-candle', '{"10": 179, "25": 159, "50": 139, "100": 129, "200": 109}'),
--   ('sapphire-lotus-pond-urli-candle', '{"10": 179, "25": 159, "50": 139, "100": 129, "200": 109}'),
--   ('red-lotus-small-urli-candle', '{"10": 135, "25": 129, "50": 119, "100": 109, "200": 99}'),
--   ('green-pond-urli-candle', '{"10": 135, "25": 129, "50": 119, "100": 109, "200": 99}'),
--   ('mogra-urli-candle', '{"10": 129, "25": 119, "50": 109, "100": 99, "200": 89}'),
--   ('mogra-urli-bowl-candle', '{"10": 449, "25": 429, "50": 399, "100": 379, "200": 329}'),
--   ('marigold-diya-festive-urli-candle', '{"10": 429, "25": 399, "50": 349, "100": 329, "200": 299}'),
--   ('elephant-urli-candle', '{"10": 229, "25": 209, "50": 199, "100": 179, "200": 169}'),
--   ('turtle-urli-candle', '{"10": 199, "25": 189, "50": 165, "100": 155, "200": 142}'),
--   ('ruffle-shell-stand-candle', '{"10": 219, "25": 199, "50": 189, "100": 179, "200": 155}'),
--   ('floral-ring-urli-tealight-holder', '{"10": 170, "25": 164, "50": 155, "100": 148, "200": 139}'),
--   ('brass-tin-candle', '{"10": 569, "25": 549, "50": 499, "100": 479, "200": 429}'),
--   ('baby-feet-square-urli-candle', '{"10": 169, "25": 159, "50": 149, "100": 139, "200": 129}'),
--   ('poker-urli-candle', '{"10": 399, "25": 369, "50": 349, "100": 329, "200": 299}'),
--   ('poker-tealight-box', '{"10": 129, "25": 119, "50": 99, "100": 89, "200": 79}'),
--   ('mandala-duo-gift-box', '{"10": 275, "25": 249, "50": 229, "100": 199, "200": 179}'),
--   ('rasmalai-cup-candle', '{"10": 89, "25": 79, "50": 69, "100": 59, "200": 49}'),
--   ('rose-petal-wax-sachet', '{"10": 219, "25": 209, "50": 199, "100": 179, "200": 165}'),
--   ('seashell-wax-sachet', '{"10": 219, "25": 209, "50": 199, "100": 179, "200": 165}'),
--   ('blue-ocean-shell-wax-sachet', '{"10": 219, "25": 209, "50": 199, "100": 179, "200": 165}'),
--   ('orange-wax-sachet', '{"10": 219, "25": 209, "50": 199, "100": 179, "200": 165}'),
--   ('coffee-wax-sachet', '{"10": 219, "25": 209, "50": 199, "100": 179, "200": 165}'),
--   ('hibiscus-wax-sachet', '{"10": 135, "25": 129, "50": 119, "100": 109, "200": 99}'),
--   ('sunflower-wax-sachet', '{"10": 135, "25": 129, "50": 119, "100": 109, "200": 99}'),
--   ('seashell-jar-candle', '{"10": 699, "25": 649, "50": 599, "100": 549, "200": 499}'),
--   ('blue-lotus-pond-boat-mini-hamper', '{"10": 236, "25": 222, "50": 209, "100": 195, "200": 182}'),
--   ('red-hibiscus-sparkle-mini-hamper', '{"10": 234, "25": 219, "50": 205, "100": 190, "200": 175}'),
--   ('red-bloom-lily-pond-mini-hamper', '{"10": 234, "25": 219, "50": 205, "100": 190, "200": 175}'),
--   ('blue-pond-pearl-lotus-mini-hamper', '{"10": 234, "25": 219, "50": 205, "100": 190, "200": 175}'),
--   ('laddoo-jalebi-mithai-mini-hamper', '{"10": 244, "25": 229, "50": 215, "100": 200, "200": 185}'),
--   ('hibiscus-rose-mini-hamper', '{"10": 234, "25": 219, "50": 205, "100": 190, "200": 175}'),
--   ('yellow-dahlia-garden-mini-hamper', '{"10": 234, "25": 219, "50": 205, "100": 190, "200": 175}'),
--   ('pale-blue-marigold-pearl-mini-hamper', '{"10": 234, "25": 219, "50": 205, "100": 190, "200": 175}'),
--   ('mint-frangipani-pearl-mini-hamper', '{"10": 234, "25": 219, "50": 205, "100": 190, "200": 175}'),
--   ('peacock-diya-laddoo-mini-hamper', '{"10": 261, "25": 243, "50": 225, "100": 207, "200": 189}'),
--   ('red-marigold-ring-mini-hamper', '{"10": 234, "25": 219, "50": 205, "100": 190, "200": 175}'),
--   ('teen-patti-cards-mini-hamper', '{"10": 236, "25": 222, "50": 209, "100": 195, "200": 182}'),
--   ('marigold-rose-bloom-mini-hamper', '{"10": 234, "25": 219, "50": 205, "100": 190, "200": 175}')
-- ) as v(slug, tiers)
-- where p.slug = v.slug;
