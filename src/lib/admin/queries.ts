import { type BookingItem, parseItems } from "@/lib/admin/booking-items";
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
  mrp: number | null;
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
  /** The lines on the order. One entry for a single-candle booking. */
  items: BookingItem[];
  productSlug: string;
  productName: string;
  productImage: string | null;
  /** Pieces across the whole order. */
  quantity: number;
  /** Zero on an order with several rates in it — read the lines instead. */
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
  paymentLinkUrl: string | null;
  paymentAmount: number | null;
  amountPaid: number;
};

type BookingRow = Record<string, unknown>;

function toAdminBooking(row: BookingRow): AdminBooking {
  const number = (value: unknown) => Number(value ?? 0);
  const text = (value: unknown) => (value === null || value === undefined ? null : String(value));

  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    items: parseItems(row.items),
    productSlug: String(row.product_slug ?? ""),
    productName: String(row.product_name ?? ""),
    productImage: text(row.product_image),
    quantity: number(row.quantity),
    unitPrice: number(row.unit_price),
    totalPrice: number(row.total_price),
    fragrance: text(row.fragrance),
    pincode: text(row.pincode),
    state: text(row.state),
    buyerName: String(row.buyer_name ?? ""),
    buyerContact: text(row.buyer_contact),
    phone: text(row.phone),
    note: text(row.note),
    status: String(row.status ?? "new"),
    source: String(row.source ?? "website"),
    paidAt: text(row.paid_at),
    paymentLinkUrl: text(row.payment_link_url),
    paymentAmount: row.payment_amount === null || row.payment_amount === undefined ? null : number(row.payment_amount),
    amountPaid: number(row.amount_paid),
  };
}

export async function listBookings(): Promise<AdminBooking[]> {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  return (data ?? []).map(toAdminBooking);
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

  return (data ?? []).map(toAdminBooking);
}
