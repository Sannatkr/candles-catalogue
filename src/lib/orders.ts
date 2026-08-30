"use server";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getProducts, getSettings } from "@/lib/data";
import { resolveGift } from "@/lib/gift";
import { priceAtQty, RETAIL_MAX } from "@/lib/pricing";
import { shipOrderRow } from "@/lib/fulfillment";
import { packGramsOf, shippingCost } from "@/lib/shipping";
import { isSupabaseConfigured, SUPABASE_URL } from "@/lib/supabase/config";
import { getPublicSupabase, getServerSupabase } from "@/lib/supabase/server";

/**
 * A retail order, start to finish.
 *
 * The browser sends slugs and quantities and nothing else that matters. Every
 * price is looked up again here from the catalogue — a cart in localStorage is
 * a wish, not a quote, and anyone can edit it.
 */

export type CheckoutLine = { slug: string; qty: number };

export type CheckoutInput = {
  lines: CheckoutLine[];
  /** The free candle the buyer chose. Re-checked here; never trusted as sent. */
  giftSlug?: string | null;
  buyerName: string;
  phone: string;
  email: string;
  instagram: string;
  pincode: string;
  state: string;
  city: string;
  addressLine1: string;
  addressLine2: string;
  note: string;
};

export type CheckoutStart =
  | {
      ok: true;
      orderId: string;
      reference: string;
      razorpayOrderId: string;
      /** Paise, which is what Razorpay Checkout expects. */
      amount: number;
      keyId: string;
      buyerName: string;
      phone: string;
      email: string;
    }
  | { ok: false; message: string };

/** Unambiguous alphabet: no O/0, no I/1, so a reference read aloud survives. */
const ALPHABET = "ACDEFGHJKLMNPQRTUVWXY2346789";

function makeReference() {
  const bytes = randomBytes(6);
  let out = "";
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return `SC-${out}`;
}

/** Bypasses RLS. Only ever used to record a payment we have already verified. */
function getServiceSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function isCheckoutConfigured() {
  return Boolean(
    isSupabaseConfigured && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET,
  );
}

export async function startCheckout(input: CheckoutInput): Promise<CheckoutStart> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return { ok: false, message: "Payments are not switched on yet. Message us on Instagram instead." };
  }
  if (!isSupabaseConfigured) {
    return { ok: false, message: "The shop is not connected to its database yet." };
  }

  const name = input.buyerName.trim();
  if (!name) return { ok: false, message: "Add your name." };

  const phone = input.phone.replace(/\D/g, "").slice(-10);
  if (phone.length !== 10) return { ok: false, message: "That needs to be a 10-digit mobile number." };

  const email = input.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "That email address does not look right." };
  }

  const pincode = input.pincode.trim();
  if (!/^\d{6}$/.test(pincode)) return { ok: false, message: "A pincode is 6 digits." };

  const addressLine1 = input.addressLine1.trim();
  if (addressLine1.length < 6) {
    return { ok: false, message: "Add the house or flat number and the street." };
  }
  if (!input.city.trim()) return { ok: false, message: "Add your town or city." };

  // Rebuild every line from the catalogue. Unknown slugs are dropped rather
  // than failing the whole order — a candle can be retired mid-session.
  const catalogue = await getProducts();
  const items = input.lines.flatMap((line) => {
    const product = catalogue.find((p) => p.slug === line.slug);
    if (!product || !product.inStock) return [];
    const qty = Math.min(RETAIL_MAX, Math.max(1, Math.floor(Number(line.qty) || 0)));
    if (qty < 1) return [];
    const unitPrice = priceAtQty(product, qty);
    if (!(unitPrice > 0)) return [];
    return [
      {
        slug: product.slug,
        name: product.name,
        image: product.images[0] ?? null,
        qty,
        unitPrice,
        total: unitPrice * qty,
      },
    ];
  });

  if (!items.length) {
    return { ok: false, message: "Your bag is empty, or those candles are no longer available." };
  }

  const subtotal = items.reduce((sum, i) => sum + i.total, 0);

  // Delivery is worked out here, on the server, the same way the checkout page
  // showed it: total pack weight × the zone the pincode falls in. The browser's
  // figure is never trusted.
  const grams = items.reduce((sum, i) => {
    const product = catalogue.find((p) => p.slug === i.slug);
    return sum + (product ? packGramsOf(product) : 0) * i.qty;
  }, 0);
  const { shipping: shippingConfig, gift: giftConfig } = await getSettings();

  // The free candle, re-decided from scratch. The browser only names a slug;
  // whether it is giftable, in stock, and actually earned is settled here
  // against `subtotal`, which contains only paid lines. A cart that claims a
  // ₹699 urli for free simply resolves to null and is dropped.
  const gift = resolveGift(giftConfig, catalogue, subtotal, input.giftSlug ?? null);
  if (gift) {
    items.push({
      slug: gift.slug,
      name: gift.name,
      image: gift.images[0] ?? null,
      qty: 1,
      unitPrice: 0,
      total: 0,
    });
  }

  // Note what is NOT added: the gift contributes nothing to `subtotal` (so it
  // cannot unlock itself) and nothing to `grams` (so a heavy gift never cancels
  // the free delivery the buyer already earned). It still physically ships, and
  // the courier's weight is recomputed from the saved items at fulfilment.
  const shipping = shippingCost(shippingConfig, { grams, subtotal });
  const total = subtotal + shipping;
  const paise = Math.round(total * 100);
  if (paise < 100) return { ok: false, message: "That order is too small to charge." };

  // Razorpay first: if it refuses, no half-made order is left in the table. The
  // row can then be written with its razorpay id already in place, which
  // matters because a buyer has no permission to update the row afterwards.
  let razorpayOrderId: string;
  const reference = makeReference();
  try {
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: paise,
        currency: "INR",
        receipt: reference,
        notes: { reference, pincode },
      }),
      cache: "no-store",
    });
    const json = (await res.json()) as { id?: string; error?: { description?: string } };
    if (!res.ok || !json.id) {
      return { ok: false, message: json.error?.description ?? "Razorpay would not open that order." };
    }
    razorpayOrderId = json.id;
  } catch {
    return { ok: false, message: "Could not reach Razorpay. Try again in a moment." };
  }

  // If they are already signed in, tie the order to them now. If they are not,
  // nothing is lost: the email is on the row, and claim_my_orders() attaches it
  // the first time they sign in with that address.
  const session = await getServerSupabase();
  const {
    data: { user },
  } = await session.auth.getUser();

  const id = crypto.randomUUID();
  const { error } = await getPublicSupabase()
    .from("orders")
    .insert({
      id,
      user_id: user?.id ?? null,
      reference,
      items,
      subtotal,
      shipping,
      total,
      buyer_name: name.slice(0, 120),
      phone,
      email: email.slice(0, 160) || null,
      instagram: input.instagram.trim().replace(/^@/, "").slice(0, 120) || null,
      pincode,
      state: input.state.trim().slice(0, 120) || null,
      city: input.city.trim().slice(0, 120),
      address_line1: addressLine1.slice(0, 240),
      address_line2: input.addressLine2.trim().slice(0, 240) || null,
      note: input.note.trim().slice(0, 500) || null,
      status: "pending",
      razorpay_order_id: razorpayOrderId,
    });

  if (error) {
    // 42P01 is Postgres reporting a missing table; PGRST205 is PostgREST saying
    // the same thing from its schema cache, which is what actually comes back
    // over the REST API before the migration has been run.
    const missingTable = error.code === "42P01" || error.code === "PGRST205";
    return {
      ok: false,
      message: missingTable
        ? "The orders table is not set up yet — run supabase/013-orders.sql in Supabase."
        : "Could not start that order. Please try once more.",
    };
  }

  return {
    ok: true,
    orderId: id,
    reference,
    razorpayOrderId,
    amount: paise,
    keyId,
    buyerName: name,
    phone,
    email,
  };
}

export type ConfirmResult = { ok: true; orderId: string; reference: string } | { ok: false; message: string };

/**
 * Razorpay signs `order_id|payment_id` with the key secret. Recomputing that
 * here is the only proof the payment is real — the browser's word for it is
 * worth nothing.
 */
function signatureMatches(orderId: string, paymentId: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function confirmPayment(input: {
  orderId: string;
  reference: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): Promise<ConfirmResult> {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return { ok: false, message: "Payments are not configured." };

  if (!signatureMatches(input.razorpayOrderId, input.razorpayPaymentId, input.signature, keySecret)) {
    return { ok: false, message: "That payment could not be verified." };
  }

  const service = getServiceSupabase();
  if (!service) {
    // The money is taken and the signature checks out; the row simply cannot be
    // promoted without an elevated key. Better to send the buyer to their
    // receipt than to tell them a good payment failed.
    return {
      ok: false,
      message:
        "Payment went through, but it could not be recorded. Keep reference " +
        `${input.reference} and message us — SUPABASE_SERVICE_ROLE_KEY is missing on the server.`,
    };
  }

  // Match on the razorpay order id as well, so a valid signature for one order
  // can never be replayed against another row. Selecting the updated row back
  // confirms something was actually matched — a silent zero-row update would
  // otherwise read as success.
  const { data, error } = await service
    .from("orders")
    .update({
      status: "paid",
      razorpay_payment_id: input.razorpayPaymentId,
      paid_at: new Date().toISOString(),
    })
    .eq("id", input.orderId)
    .eq("razorpay_order_id", input.razorpayOrderId)
    .select("id, total")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, message: "Payment taken, but recording it failed. Message us." };
  }

  // amount_paid mirrors the total, which was fixed server-side at start.
  await service.from("orders").update({ amount_paid: data.total }).eq("id", input.orderId);

  // Hand it to RapidShyp as a shipment. Best-effort + skipped in test mode; see
  // shipOrderRow. Shared with the webhook so both confirmation paths ship.
  const liveMode = !(process.env.RAZORPAY_KEY_ID ?? "").startsWith("rzp_test_");
  await shipOrderRow(service, input.orderId, liveMode);

  return { ok: true, orderId: input.orderId, reference: input.reference };
}

/** Marks an abandoned or failed attempt so the admin list is not full of ghosts. */
export async function abandonOrder(orderId: string, reference: string) {
  const service = getServiceSupabase();
  if (!service) return;
  await service
    .from("orders")
    .update({ status: "failed" })
    .eq("id", orderId)
    .eq("reference", reference)
    .eq("status", "pending");
}

export type Receipt = {
  reference: string;
  items: { slug: string; name: string; image: string | null; qty: number; unitPrice: number; total: number }[];
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  createdAt: string;
  buyerName: string;
  city: string | null;
  state: string | null;
  pincode: string;
};

/** Reads back one order for its own thank-you page. Needs both id and reference. */
export async function getReceipt(id: string, reference: string): Promise<Receipt | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await getPublicSupabase()
    .rpc("order_receipt", { p_id: id, p_reference: reference })
    .maybeSingle();

  if (error || !data) return null;

  const row = data as {
    reference: string;
    items: Receipt["items"];
    subtotal: number;
    shipping: number;
    total: number;
    status: string;
    created_at: string;
    buyer_name: string;
    city: string | null;
    state: string | null;
    pincode: string;
  };

  return {
    reference: row.reference,
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    total: Number(row.total),
    status: row.status,
    createdAt: row.created_at,
    buyerName: row.buyer_name,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
  };
}
