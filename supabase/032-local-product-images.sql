-- 032 — serve product photos from the site itself, not Supabase Storage (2026-10-23).
--
-- Supabase's free plan allows 5 GB of cached egress a month and the shop used
-- 7.5 GB: 46 product photos (plus 4 collection covers pointing at the same
-- files) were served straight from Storage at ~370 KB each. The same photos now
-- live in the repo as 1200x1500 WebP (~120 KB each, public/products/<slug>/)
-- and Vercel serves them, like the older candles' photos. This points the
-- database at the new files. The Storage copies can stay; nothing reads them.
--
-- Run in the Supabase SQL Editor after the deploy that carries the files
-- (commit "Serve product photos from Vercel as WebP"). Shop pages cache up to
-- 1 h; a push, or saving any candle in the admin, clears it.

update public.products set images = array['/products/three-tier-blush-pink-urli-candle/three-tier-blush-pink-urli-candle-1.webp']::text[] where slug = 'three-tier-blush-pink-urli-candle';
update public.products set images = array['/products/peacock-rangoli-urli-set/peacock-rangoli-urli-set-1.webp']::text[] where slug = 'peacock-rangoli-urli-set';
update public.products set images = array['/products/peacock-pond-urli-candle/peacock-pond-urli-candle-1.webp']::text[] where slug = 'peacock-pond-urli-candle';
update public.products set images = array['/products/peacock-four-diya-urli-set/peacock-four-diya-urli-set-1.webp']::text[] where slug = 'peacock-four-diya-urli-set';
update public.products set images = array['/products/three-tier-pearl-urli-candle/three-tier-pearl-urli-candle-1.webp']::text[] where slug = 'three-tier-pearl-urli-candle';
update public.products set images = array['/products/three-tier-rose-ruby-urli-candle/three-tier-rose-ruby-urli-candle-1.webp']::text[] where slug = 'three-tier-rose-ruby-urli-candle';
update public.products set images = array['/products/three-tier-haldi-kumkum-urli-candle/three-tier-haldi-kumkum-urli-candle-1.webp']::text[] where slug = 'three-tier-haldi-kumkum-urli-candle';
update public.products set images = array['/products/three-tier-mint-marigold-urli-candle/three-tier-mint-marigold-urli-candle-1.webp']::text[] where slug = 'three-tier-mint-marigold-urli-candle';
update public.products set images = array['/products/emerald-lily-pond-urli-candle/emerald-lily-pond-urli-candle-1.webp']::text[] where slug = 'emerald-lily-pond-urli-candle';
update public.products set images = array['/products/sapphire-lotus-pond-urli-candle/sapphire-lotus-pond-urli-candle-1.webp']::text[] where slug = 'sapphire-lotus-pond-urli-candle';
update public.products set images = array['/products/green-pond-urli-candle/green-pond-urli-candle-1.webp']::text[] where slug = 'green-pond-urli-candle';
update public.products set images = array['/products/red-peacock-tealight-candle/red-peacock-tealight-candle-1.webp']::text[] where slug = 'red-peacock-tealight-candle';
update public.products set images = array['/products/three-tier-sky-blue-urli-candle/three-tier-sky-blue-urli-candle-1.webp']::text[] where slug = 'three-tier-sky-blue-urli-candle';
update public.products set images = array['/products/floral-tealight-box/floral-tealight-box-1.webp']::text[] where slug = 'floral-tealight-box';
update public.products set images = array['/products/three-tier-pink-ombre-urli-candle/three-tier-pink-ombre-urli-candle-1.webp']::text[] where slug = 'three-tier-pink-ombre-urli-candle';
update public.products set images = array['/products/diwali-basket-hamper/diwali-basket-hamper-1.webp', '/products/diwali-basket-hamper/diwali-basket-hamper-2.webp']::text[] where slug = 'diwali-basket-hamper';
update public.products set images = array['/products/mithai-urli-candle-hamper/mithai-urli-candle-hamper-1.webp']::text[] where slug = 'mithai-urli-candle-hamper';
update public.products set images = array['/products/flower-urli-candle-hamper/flower-urli-candle-hamper-1.webp']::text[] where slug = 'flower-urli-candle-hamper';
update public.products set images = array['/products/blue-lotus-pond-boat-mini-hamper/blue-lotus-pond-boat-mini-hamper-1.webp']::text[] where slug = 'blue-lotus-pond-boat-mini-hamper';
update public.products set images = array['/products/red-hibiscus-sparkle-mini-hamper/red-hibiscus-sparkle-mini-hamper-1.webp']::text[] where slug = 'red-hibiscus-sparkle-mini-hamper';
update public.products set images = array['/products/red-bloom-lily-pond-mini-hamper/red-bloom-lily-pond-mini-hamper-1.webp']::text[] where slug = 'red-bloom-lily-pond-mini-hamper';
update public.products set images = array['/products/blue-pond-pearl-lotus-mini-hamper/blue-pond-pearl-lotus-mini-hamper-1.webp']::text[] where slug = 'blue-pond-pearl-lotus-mini-hamper';
update public.products set images = array['/products/laddoo-jalebi-mithai-mini-hamper/laddoo-jalebi-mithai-mini-hamper-1.webp']::text[] where slug = 'laddoo-jalebi-mithai-mini-hamper';
update public.products set images = array['/products/hibiscus-rose-mini-hamper/hibiscus-rose-mini-hamper-1.webp']::text[] where slug = 'hibiscus-rose-mini-hamper';
update public.products set images = array['/products/yellow-dahlia-garden-mini-hamper/yellow-dahlia-garden-mini-hamper-1.webp']::text[] where slug = 'yellow-dahlia-garden-mini-hamper';
update public.products set images = array['/products/pale-blue-marigold-pearl-mini-hamper/pale-blue-marigold-pearl-mini-hamper-1.webp']::text[] where slug = 'pale-blue-marigold-pearl-mini-hamper';
update public.products set images = array['/products/mint-frangipani-pearl-mini-hamper/mint-frangipani-pearl-mini-hamper-1.webp']::text[] where slug = 'mint-frangipani-pearl-mini-hamper';
update public.products set images = array['/products/peacock-diya-laddoo-mini-hamper/peacock-diya-laddoo-mini-hamper-1.webp']::text[] where slug = 'peacock-diya-laddoo-mini-hamper';
update public.products set images = array['/products/red-marigold-ring-mini-hamper/red-marigold-ring-mini-hamper-1.webp']::text[] where slug = 'red-marigold-ring-mini-hamper';
update public.products set images = array['/products/teen-patti-cards-mini-hamper/teen-patti-cards-mini-hamper-1.webp']::text[] where slug = 'teen-patti-cards-mini-hamper';
update public.products set images = array['/products/marigold-rose-bloom-mini-hamper/marigold-rose-bloom-mini-hamper-1.webp']::text[] where slug = 'marigold-rose-bloom-mini-hamper';
update public.products set images = array['/products/laddoo-candle-box-12/laddoo-candle-box-12-1.webp']::text[] where slug = 'laddoo-candle-box-12';
update public.products set images = array['/products/sunflower-wax-sachet/sunflower-wax-sachet-1.webp']::text[] where slug = 'sunflower-wax-sachet';
update public.products set images = array['/products/mithai-single-candle/mithai-single-candle-1.webp']::text[] where slug = 'mithai-single-candle';
update public.products set images = array['/products/laddoo-candle-box-9/laddoo-candle-box-9-1.webp', '/products/laddoo-candle-box-9/laddoo-candle-box-9-2.webp']::text[] where slug = 'laddoo-candle-box-9';
update public.products set images = array['/products/laddoo-candle-box-4/laddoo-candle-box-4-1.webp']::text[] where slug = 'laddoo-candle-box-4';
update public.products set images = array['/products/seashell-jar-candle/seashell-jar-candle-1.webp', '/products/seashell-jar-candle/seashell-jar-candle-2.webp']::text[] where slug = 'seashell-jar-candle';
update public.products set images = array['/products/rose-petal-wax-sachet/rose-petal-wax-sachet-1.webp']::text[] where slug = 'rose-petal-wax-sachet';
update public.products set images = array['/products/seashell-wax-sachet/seashell-wax-sachet-1.webp']::text[] where slug = 'seashell-wax-sachet';
update public.products set images = array['/products/blue-ocean-shell-wax-sachet/blue-ocean-shell-wax-sachet-1.webp']::text[] where slug = 'blue-ocean-shell-wax-sachet';
update public.products set images = array['/products/orange-wax-sachet/orange-wax-sachet-1.webp']::text[] where slug = 'orange-wax-sachet';
update public.products set images = array['/products/coffee-wax-sachet/coffee-wax-sachet-1.webp']::text[] where slug = 'coffee-wax-sachet';
update public.products set images = array['/products/hibiscus-wax-sachet/hibiscus-wax-sachet-1.webp']::text[] where slug = 'hibiscus-wax-sachet';

update public.collections set cover_image = '/products/diwali-basket-hamper/diwali-basket-hamper-1.webp' where slug = 'mini-hampers';
update public.collections set cover_image = '/products/laddoo-candle-box-12/laddoo-candle-box-12-1.webp' where slug = 'mithai-candles';
update public.collections set cover_image = '/products/rose-petal-wax-sachet/rose-petal-wax-sachet-1.webp' where slug = 'wax-sachets';
update public.collections set cover_image = '/products/seashell-jar-candle/seashell-jar-candle-1.webp' where slug = 'ocean-theme';

-- Check: should return 0 rows.
-- select slug from public.products where array_to_string(images, ' ') like '%supabase%'
-- union all select slug from public.collections where cover_image like '%supabase%';
