// Turns the catalogue in src/lib/seed.ts into SQL for the Supabase editor.
// Run: node --experimental-strip-types scripts/gen-seed-sql.ts > supabase/003-catalogue.sql
import { seedCollections, seedProducts, seedSettings } from "../src/lib/seed.ts";

const q = (v: string) => `'${v.replace(/'/g, "''")}'`;
const arr = (v: string[]) => (v.length ? `ARRAY[${v.map(q).join(",")}]::text[]` : `'{}'::text[]`);
const json = (v: unknown) => `${q(JSON.stringify(v))}::jsonb`;

const out: string[] = [
  "-- Sugandha Candles — catalogue content.",
  "-- Generated from src/lib/seed.ts. Paste into Supabase → SQL Editor → Run.",
  "-- Safe to run twice: it updates rows that already exist.",
  "",
  "-- Only one collection for now, so clear out any leftovers from the first setup.",
  "delete from public.products where collection_slug <> 'festive-candles';",
  "delete from public.collections where slug <> 'festive-candles';",
  "",
];

for (const c of seedCollections) {
  out.push(
    `insert into public.collections (slug, name, tagline, description, cover_image, sort_order) values`,
    `  (${q(c.slug)}, ${q(c.name)}, ${q(c.tagline)}, ${q(c.description)}, ${q(c.coverImage)}, ${c.sortOrder})`,
    `on conflict (slug) do update set`,
    `  name = excluded.name, tagline = excluded.tagline, description = excluded.description,`,
    `  cover_image = excluded.cover_image, sort_order = excluded.sort_order;`,
    "",
  );
}

for (const p of seedProducts) {
  out.push(
    `insert into public.products (`,
    `  slug, name, collection_slug, tagline, description, images, size_chart_image, keywords,`,
    `  fragrance, wax_type, wick_type, burn_time_hours, height_cm, diameter_cm, weight_grams,`,
    `  base_price, price_tiers, packaging, in_stock, featured, sort_order`,
    `) values (`,
    `  ${q(p.slug)}, ${q(p.name)}, ${q(p.collectionSlug)}, ${q(p.tagline)}, ${q(p.description)},`,
    `  ${arr(p.images)}, null, ${arr(p.keywords)},`,
    `  ${q(p.fragrance)}, ${q(p.waxType)}, ${q(p.wickType)}, ${p.burnTimeHours}, ${p.heightCm}, ${p.diameterCm}, ${p.weightGrams},`,
    `  ${p.basePrice}, ${json(p.priceTiers)}, ${q(p.packaging)}, ${p.inStock}, ${p.featured}, ${p.sortOrder}`,
    `) on conflict (slug) do update set`,
    `  name = excluded.name, collection_slug = excluded.collection_slug, tagline = excluded.tagline,`,
    `  description = excluded.description, images = excluded.images, keywords = excluded.keywords,`,
    `  fragrance = excluded.fragrance, wax_type = excluded.wax_type, wick_type = excluded.wick_type,`,
    `  burn_time_hours = excluded.burn_time_hours, height_cm = excluded.height_cm,`,
    `  diameter_cm = excluded.diameter_cm, weight_grams = excluded.weight_grams,`,
    `  base_price = excluded.base_price, price_tiers = excluded.price_tiers,`,
    `  packaging = excluded.packaging, in_stock = excluded.in_stock,`,
    `  featured = excluded.featured, sort_order = excluded.sort_order;`,
    "",
  );
}

out.push(
  `insert into public.site_settings (id, data) values (1, ${json(seedSettings)})`,
  `on conflict (id) do update set data = excluded.data, updated_at = now();`,
  "",
);

console.log(out.join("\n"));
