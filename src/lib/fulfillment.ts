import type { SupabaseClient } from "@supabase/supabase-js";
import { getProducts } from "@/lib/data";
import { toOrderItems } from "@/lib/admin/queries";
import { createRapidshypShipment, isRapidshypConfigured } from "@/lib/rapidshyp";
import { packGramsOf } from "@/lib/shipping";

/**
 * Books a RapidShyp shipment for a paid order row, shared by the browser
 * confirm and the webhook. Best-effort and idempotent: it swallows every error
 * (a courier hiccup must never break a payment) and does nothing if a shipment
 * already exists or RapidShyp is off / in test mode.
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

export async function shipOrderRow(service: SupabaseClient, orderId: string, liveMode: boolean): Promise<void> {
  try {
    if (!liveMode || !isRapidshypConfigured()) return;

    const { data } = await service.from("orders").select("*").eq("id", orderId).maybeSingle();
    const row = data as OrderRow | null;
    if (!row || row.rapidshyp_order_id) return;

    const items = toOrderItems(row.items);
    if (!items.length) return;

    const catalogue = await getProducts();
    const grams = items.reduce((sum, i) => {
      const product = catalogue.find((p) => p.slug === i.slug);
      return sum + (product ? packGramsOf(product) : 400) * i.qty;
    }, 0);

    const shipment = await createRapidshypShipment({
      reference: String(row.reference ?? ""),
      buyerName: String(row.buyer_name ?? ""),
      phone: String(row.phone ?? ""),
      email: row.email ?? null,
      pincode: String(row.pincode ?? ""),
      addressLine1: String(row.address_line1 ?? ""),
      addressLine2: row.address_line2 ?? null,
      city: row.city ?? null,
      state: row.state ?? null,
      shipping: Number(row.shipping) || 0,
      items: items.map((i) => ({ slug: i.slug, name: i.name, qty: i.qty, unitPrice: i.unitPrice })),
      grams,
    });

    if (shipment.ok) {
      await service.from("orders").update({ rapidshyp_order_id: shipment.id }).eq("id", orderId);
    }
  } catch {
    // Fulfilment must never throw back into a payment flow.
  }
}
