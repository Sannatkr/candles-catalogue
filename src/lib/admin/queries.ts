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
  pack_weight_grams: number | null;
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
  address: string | null;
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
  rapidshypOrderId: string | null;
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
    address: text(row.address),
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
    rapidshypOrderId: text(row.rapidshyp_order_id),
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

// --------------------------------------------------------------- orders ----
// Paid website orders. Kept apart from bookings on purpose: a booking is a
// conversation, an order is a parcel that has to go out.

export type OrderItem = {
  slug: string;
  name: string;
  image: string | null;
  qty: number;
  unitPrice: number;
  total: number;
};

export type AdminOrder = {
  id: string;
  createdAt: string;
  reference: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  buyerName: string;
  phone: string;
  email: string | null;
  instagram: string | null;
  pincode: string;
  state: string | null;
  city: string | null;
  addressLine1: string;
  addressLine2: string | null;
  note: string | null;
  status: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  amountPaid: number;
  paidAt: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  rapidshypOrderId: string | null;
};

export function toOrderItems(value: unknown): OrderItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): OrderItem[] => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    if (typeof item.slug !== "string") return [];
    return [
      {
        slug: item.slug,
        name: String(item.name ?? item.slug),
        image: item.image === null || item.image === undefined ? null : String(item.image),
        qty: Number(item.qty ?? 0),
        unitPrice: Number(item.unitPrice ?? 0),
        total: Number(item.total ?? 0),
      },
    ];
  });
}

function toAdminOrder(row: Record<string, unknown>): AdminOrder {
  const text = (value: unknown) => (value === null || value === undefined ? null : String(value));
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    reference: String(row.reference ?? ""),
    items: toOrderItems(row.items),
    subtotal: Number(row.subtotal ?? 0),
    shipping: Number(row.shipping ?? 0),
    total: Number(row.total ?? 0),
    buyerName: String(row.buyer_name ?? ""),
    phone: String(row.phone ?? ""),
    email: text(row.email),
    instagram: text(row.instagram),
    pincode: String(row.pincode ?? ""),
    state: text(row.state),
    city: text(row.city),
    addressLine1: String(row.address_line1 ?? ""),
    addressLine2: text(row.address_line2),
    note: text(row.note),
    status: String(row.status ?? "pending"),
    razorpayOrderId: text(row.razorpay_order_id),
    razorpayPaymentId: text(row.razorpay_payment_id),
    amountPaid: Number(row.amount_paid ?? 0),
    paidAt: text(row.paid_at),
    carrier: text(row.carrier),
    trackingNumber: text(row.tracking_number),
    trackingUrl: text(row.tracking_url),
    rapidshypOrderId: text(row.rapidshyp_order_id),
  };
}

/** Paid website orders in a window, keyed on when the money landed. */
export async function listRevenueOrders(fromISO: string, toISO: string): Promise<AdminOrder[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .in("status", ["paid", "packed", "shipped", "delivered"])
    .gte("paid_at", fromISO)
    .lte("paid_at", toISO)
    .order("paid_at", { ascending: true })
    .limit(5000);

  if (error) return [];
  return (data ?? []).map(toAdminOrder);
}

/**
 * Returns null — not an empty list — when the orders table has not been created
 * yet, so the screen can say "run the migration" instead of "no orders".
 */
export async function listOrders(): Promise<AdminOrder[] | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) return error.code === "42P01" || error.code === "PGRST205" ? null : [];
  return (data ?? []).map(toAdminOrder);
}
