import { seedCollections, seedProducts, seedSettings } from "./seed";
import { isSupabaseConfigured } from "./supabase/config";
import { getPublicSupabase } from "./supabase/server";
import type { Collection, Product, SiteSettings } from "./types";

type CollectionRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  cover_image: string | null;
  sort_order: number | null;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  collection_slug: string;
  tagline: string | null;
  description: string | null;
  images: string[] | null;
  size_chart_image: string | null;
  fragrance: string | null;
  wax_type: string | null;
  wick_type: string | null;
  burn_time_hours: number | null;
  height_cm: number | null;
  diameter_cm: number | null;
  weight_grams: number | null;
  base_price: number | null;
  price_tiers: { minQty: number; price: number }[] | null;
  packaging: string | null;
  in_stock: boolean | null;
  featured: boolean | null;
  sort_order: number | null;
};

const FALLBACK_IMAGE = "/placeholders/candle-01.svg";

function toCollection(row: CollectionRow): Collection {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline ?? "",
    description: row.description ?? "",
    coverImage: row.cover_image ?? FALLBACK_IMAGE,
    sortOrder: row.sort_order ?? 0,
  };
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    collectionSlug: row.collection_slug,
    tagline: row.tagline ?? "",
    description: row.description ?? "",
    images: row.images?.length ? row.images : [FALLBACK_IMAGE],
    sizeChartImage: row.size_chart_image,
    fragrance: row.fragrance ?? "",
    waxType: row.wax_type ?? "",
    wickType: row.wick_type ?? "",
    burnTimeHours: row.burn_time_hours ?? 0,
    heightCm: row.height_cm ?? 0,
    diameterCm: row.diameter_cm ?? 0,
    weightGrams: row.weight_grams ?? 0,
    basePrice: row.base_price ?? 0,
    priceTiers: row.price_tiers ?? [],
    packaging: row.packaging ?? "",
    inStock: row.in_stock ?? true,
    featured: row.featured ?? false,
    sortOrder: row.sort_order ?? 0,
  };
}

const bySortOrder = <T extends { sortOrder: number; name: string }>(a: T, b: T) =>
  a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);

export async function getCollections(): Promise<Collection[]> {
  if (!isSupabaseConfigured) return [...seedCollections].sort(bySortOrder);

  const { data, error } = await getPublicSupabase()
    .from("collections")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data) return [...seedCollections].sort(bySortOrder);
  return (data as CollectionRow[]).map(toCollection);
}

export async function getCollection(slug: string): Promise<Collection | null> {
  const all = await getCollections();
  return all.find((c) => c.slug === slug) ?? null;
}

export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured) return [...seedProducts].sort(bySortOrder);

  const { data, error } = await getPublicSupabase()
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data) return [...seedProducts].sort(bySortOrder);
  return (data as ProductRow[]).map(toProduct);
}

export async function getProductsByCollection(slug: string): Promise<Product[]> {
  const all = await getProducts();
  return all.filter((p) => p.collectionSlug === slug);
}

export async function getProduct(slug: string): Promise<Product | null> {
  const all = await getProducts();
  return all.find((p) => p.slug === slug) ?? null;
}

export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  const all = await getProducts();
  const featured = all.filter((p) => p.featured);
  return (featured.length ? featured : all).slice(0, limit);
}

export async function getSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured) return seedSettings;

  const { data, error } = await getPublicSupabase()
    .from("site_settings")
    .select("data")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data?.data) return seedSettings;
  return { ...seedSettings, ...(data.data as Partial<SiteSettings>) };
}
