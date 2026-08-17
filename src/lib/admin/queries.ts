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
  keywords: string[] | null;
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

export type AdminBooking = {
  id: string;
  createdAt: string;
  productSlug: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  fragrance: string | null;
  pincode: string | null;
  state: string | null;
  buyerName: string;
  buyerContact: string | null;
  phone: string | null;
  note: string | null;
  status: string;
  source: string;
  paidAt: string | null;
};

export async function listBookings(): Promise<AdminBooking[]> {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  return (data ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    productSlug: row.product_slug,
    productName: row.product_name,
    productImage: row.product_image,
    quantity: row.quantity ?? 0,
    unitPrice: Number(row.unit_price ?? 0),
    totalPrice: Number(row.total_price ?? 0),
    fragrance: row.fragrance,
    pincode: row.pincode,
    state: row.state,
    buyerName: row.buyer_name,
    buyerContact: row.buyer_contact,
    phone: row.phone ?? null,
    note: row.note,
    status: row.status ?? "new",
    source: row.source ?? "website",
    paidAt: row.paid_at ?? null,
  }));
}

/** Paid and fulfilled orders in a window, keyed on when the money landed. */
export async function listRevenueBookings(fromISO: string, toISO: string): Promise<AdminBooking[]> {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("bookings")
    .select("*")
    .in("status", ["paid", "fulfilled"])
    .gte("paid_at", fromISO)
    .lte("paid_at", toISO)
    .order("paid_at", { ascending: true })
    .limit(5000);

  return (data ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    productSlug: row.product_slug,
    productName: row.product_name,
    productImage: row.product_image,
    quantity: row.quantity ?? 0,
    unitPrice: Number(row.unit_price ?? 0),
    totalPrice: Number(row.total_price ?? 0),
    fragrance: row.fragrance,
    pincode: row.pincode,
    state: row.state,
    buyerName: row.buyer_name,
    buyerContact: row.buyer_contact,
    phone: row.phone ?? null,
    note: row.note,
    status: row.status ?? "paid",
    source: row.source ?? "website",
    paidAt: row.paid_at ?? null,
  }));
}
