import type { SupabaseClient } from "@supabase/supabase-js";
import { getProducts } from "@/lib/data";
import { toOrderItems } from "@/lib/admin/queries";
import { createRapidshypShipment, isRapidshypConfigured } from "@/lib/rapidshyp";
import { packGramsOf } from "@/lib/shipping";

/**
 * Books a RapidShyp shipment for a paid order row.
 *
 * Two callers, one body. The payment paths call shipOrderRow, which swallows
 * everything — a courier hiccup must never break a sale — and the admin's
 * "Create shipment" button calls shipOrder, which needs to say what went wrong
 * so he can fix it and press again. Idempotent either way: an order that
 * already carries a rapidshyp_order_id is left alone.
 */
type OrderRow = {
  reference: string;
  buyer_name: string | null;
  phone: string | null;
  email: string | null;
  pincode: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  shipping: number | null;
  items: unknown;
  rapidshyp_order_id: string | null;
};

export type ShipOutcome = { ok: true; id: string; already?: true } | { ok: false; message: string };

/**
 * The client decides who is asking: the service key from a payment callback, or
 * the signed-in admin, whose RLS rules already let them read and update orders.
 */
export async function shipOrder(client: SupabaseClient, orderId: string): Promise<ShipOutcome> {
  if (!isRapidshypConfigured()) {
    return { ok: false, message: "RapidShyp is not set up yet (needs the API key and pickup name)." };
  }

  const { data } = await client.from("orders").select("*").eq("id", orderId).maybeSingle();
  const row = data as OrderRow | null;
  if (!row) return { ok: false, message: "That order no longer exists." };
  if (row.rapidshyp_order_id) return { ok: true, id: row.rapidshyp_order_id, already: true };

  const items = toOrderItems(row.items);
  if (!items.length) return { ok: false, message: "This order has no items on it." };

  // Everything below is fixed at checkout, so these only ever bite on a row that
  // was edited by hand into a state the courier would reject anyway.
  const address = String(row.address_line1 ?? "").trim();
  const pincode = String(row.pincode ?? "").trim();
  const phone = String(row.phone ?? "").replace(/\D/g, "").slice(-10);
  if (address.length < 3) return { ok: false, message: "Add a delivery address first, then save." };
  if (!/^\d{6}$/.test(pincode)) return { ok: false, message: "Add a 6-digit pincode first, then save." };
  if (phone.length !== 10) return { ok: false, message: "Add a 10-digit phone number first, then save." };

  const catalogue = await getProducts();
  const grams = items.reduce((sum, i) => {
    const product = catalogue.find((p) => p.slug === i.slug);
    return sum + (product ? packGramsOf(product) : 400) * i.qty;
  }, 0);

  const shipment = await createRapidshypShipment({
    reference: String(row.reference ?? ""),
    buyerName: String(row.buyer_name ?? ""),
    phone,
    email: row.email ?? null,
    pincode,
    addressLine1: address,
    addressLine2: row.address_line2 ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    shipping: Number(row.shipping) || 0,
    items: items.map((i) => ({ slug: i.slug, name: i.name, qty: i.qty, unitPrice: i.unitPrice })),
    grams,
  });

  if (!shipment.ok) return shipment;

  await client.from("orders").update({ rapidshyp_order_id: shipment.id }).eq("id", orderId);
  return { ok: true, id: shipment.id };
}

/**
 * The payment-flow wrapper: best-effort, silent, and off entirely in test mode.
 * Shared by the browser confirm and the Razorpay webhook.
 */
export async function shipOrderRow(service: SupabaseClient, orderId: string, liveMode: boolean): Promise<void> {
  try {
    if (!liveMode) return;
    await shipOrder(service, orderId);
  } catch {
    // Fulfilment must never throw back into a payment flow.
  }
}
