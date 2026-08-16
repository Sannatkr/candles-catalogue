import { getServerSupabase } from "@/lib/supabase/server";

export type AdminProduct = {
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
  moq: number | null;
  packaging: string | null;
  in_stock: boolean | null;
  featured: boolean | null;
  sort_order: number | null;
};

export type AdminCollection = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  cover_image: string | null;
  sort_order: number | null;
};

export async function listAdminProducts() {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("products")
    .select("*")
    .order("collection_slug")
    .order("sort_order");
  return (data ?? []) as AdminProduct[];
}

export async function getAdminProduct(id: string) {
  const supabase = await getServerSupabase();
  const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  return (data ?? null) as AdminProduct | null;
}

export async function listAdminCollections() {
  const supabase = await getServerSupabase();
  const { data } = await supabase.from("collections").select("*").order("sort_order");
  return (data ?? []) as AdminCollection[];
}

export async function getAdminCollection(id: string) {
  const supabase = await getServerSupabase();
  const { data } = await supabase.from("collections").select("*").eq("id", id).maybeSingle();
  return (data ?? null) as AdminCollection | null;
}

export async function getAdminSettings() {
  const supabase = await getServerSupabase();
  const { data } = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
  return (data?.data ?? {}) as Record<string, unknown>;
}
