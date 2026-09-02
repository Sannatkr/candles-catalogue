"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/admin/action-state";
import { type BookingItem, itemsLabel, itemsTotals, parseItems } from "@/lib/admin/booking-items";
import { isBookingStatus } from "@/lib/admin/booking-status";
import { checkIsAdmin } from "@/lib/admin/is-admin";
import { toOrderItems } from "@/lib/admin/queries";
import { isOrderStatus, type OrderStatus, PAID_STATUSES } from "@/lib/admin/order-status";
import { countWords, estimateDuration, isScriptStatus } from "@/lib/admin/script-status";
import { slugify } from "@/lib/slug";
import { getProducts } from "@/lib/data";
import { createPaymentLink } from "@/lib/payments/razorpay";
import { createRapidshypShipment, isRapidshypConfigured } from "@/lib/rapidshyp";
import { packGramsOf } from "@/lib/shipping";
import { getServerSupabase } from "@/lib/supabase/server";

const str = (fd: FormData, key: string) => (fd.get(key) ?? "").toString().trim();
const num = (fd: FormData, key: string) => {
  const value = Number(str(fd, key));
  return Number.isFinite(value) ? value : 0;
};
const bool = (fd: FormData, key: string) => str(fd, key) === "on" || str(fd, key) === "true";
const json = <T,>(fd: FormData, key: string, fallback: T): T => {
  try {
    const raw = str(fd, key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

/**
 * The middleware turns non-admins away at the door, but a server action is its
 * own entry point — anyone who can post a request reaches it directly, with no
 * page load and no middleware in between. So it gets checked again here.
 *
 * The row-level rules in 014 are the real backstop; this is what makes the
 * refusal land as a redirect instead of a silent no-op.
 */
async function requireAdmin() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  if (!(await checkIsAdmin(supabase))) redirect("/");

  return supabase;
}

function refreshPublicPages() {
  revalidatePath("/", "layout");
}

/* ------------------------------------------------------------- products -- */

export async function saveProduct(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();

  const name = str(fd, "name");
  if (!name) return { ok: false, message: "Give the candle a name." };

  const collectionSlug = str(fd, "collection_slug");
  if (!collectionSlug) return { ok: false, message: "Pick a collection." };

  const images = json<string[]>(fd, "images", []);
  if (images.length === 0) return { ok: false, message: "Add at least one photo." };

  const tiers = json<{ minQty: number; price: number }[]>(fd, "price_tiers", [])
    .filter((t) => t.minQty > 0 && t.price > 0)
    .sort((a, b) => a.minQty - b.minQty);

  const row = {
    slug: str(fd, "slug") || slugify(name),
    name,
    collection_slug: collectionSlug,
    tagline: str(fd, "tagline"),
    description: str(fd, "description"),
    images,
    size_chart_image: str(fd, "size_chart_image") || null,
    keywords: str(fd, "keywords")
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean),
    fragrance: str(fd, "fragrance"),
    wax_type: str(fd, "wax_type"),
    wick_type: str(fd, "wick_type"),
    height_cm: num(fd, "height_cm"),
    diameter_cm: num(fd, "diameter_cm"),
    pack_weight_grams: num(fd, "pack_weight_grams"),
    base_price: tiers[0]?.price ?? num(fd, "base_price"),
    mrp: num(fd, "mrp"),
    price_tiers: tiers,
    in_stock: bool(fd, "in_stock"),
    featured: bool(fd, "featured"),
    gift_eligible: bool(fd, "gift_eligible"),
    sort_order: num(fd, "sort_order"),
  };

  const id = str(fd, "id");
  const { error } = id
    ? await supabase.from("products").update(row).eq("id", id)
    : await supabase.from("products").insert(row);

  if (error) {
    const friendly = error.code === "23505" ? "A product with that web address already exists." : error.message;
    return { ok: false, message: friendly };
  }

  refreshPublicPages();
  redirect("/admin/products?saved=1");
}

export async function deleteProduct(fd: FormData) {
  const supabase = await requireAdmin();
  await supabase.from("products").delete().eq("id", str(fd, "id"));
  refreshPublicPages();
  redirect("/admin/products?deleted=1");
}

/* ---------------------------------------------------------- collections -- */

export async function saveCollection(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();

  const name = str(fd, "name");
  if (!name) return { ok: false, message: "Give the collection a name." };

  const row = {
    slug: str(fd, "slug") || slugify(name),
    name,
    tagline: str(fd, "tagline"),
    description: str(fd, "description"),
    cover_image: str(fd, "cover_image") || null,
    sort_order: num(fd, "sort_order"),
  };

  const id = str(fd, "id");
  const { error } = id
    ? await supabase.from("collections").update(row).eq("id", id)
    : await supabase.from("collections").insert(row);

  if (error) {
    const friendly = error.code === "23505" ? "A collection with that web address already exists." : error.message;
    return { ok: false, message: friendly };
  }

  refreshPublicPages();
  redirect("/admin/collections?saved=1");
}

export async function deleteCollection(fd: FormData) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("collections").delete().eq("id", str(fd, "id"));
  refreshPublicPages();
  redirect(error ? "/admin/collections?inuse=1" : "/admin/collections?deleted=1");
}

/* ------------------------------------------------------------- settings -- */

export async function saveSettings(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();

  const data = {
    businessName: str(fd, "businessName"),
    tagline: str(fd, "tagline"),
    aboutBlurb: str(fd, "aboutBlurb"),
    instagramHandle: str(fd, "instagramHandle").replace(/^@/, ""),
    email: str(fd, "email"),
    addressLines: str(fd, "addressLines")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
    fragrances: str(fd, "fragrances")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
    currency: "INR",
    shipping: {
      flatFee: num(fd, "ship_flat"),
      freeOverSubtotal: num(fd, "ship_free_over"),
      freeUnderGrams: Math.round(num(fd, "ship_free_under_kg") * 1000),
    },
    gift: {
      enabled: bool(fd, "gift_enabled"),
      threshold: num(fd, "gift_threshold"),
      surpriseEnabled: bool(fd, "gift_surprise_enabled"),
      surpriseLabel: str(fd, "gift_surprise_label") || "A surprise gift",
    },
    termsIntro: str(fd, "termsIntro"),
    termsSections: json<{ heading: string; body: string[] }[]>(fd, "termsSections", []).filter(
      (s) => s.heading.trim(),
    ),
  };

  const { error } = await supabase.from("site_settings").upsert({ id: 1, data, updated_at: new Date().toISOString() });
  if (error) return { ok: false, message: error.message };

  refreshPublicPages();
  return { ok: true, message: "Saved. The live site is already updated." };
}

/* ----------------------------------------------------------------- auth -- */

export async function signOut() {
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/* ------------------------------------------------------------- bookings -- */

export async function setBookingStatus(fd: FormData) {
  const supabase = await requireAdmin();
  const status = str(fd, "status");
  if (!isBookingStatus(status)) return;

  // Stamp the moment money landed, so revenue can be reported by payment date
  // rather than by when the order was first placed.
  const patch: Record<string, unknown> = { status };
  if (status === "paid" || status === "fulfilled") patch.paid_at = new Date().toISOString();
  if (status === "new" || status === "contacted" || status === "cancelled") patch.paid_at = null;

  await supabase.from("bookings").update(patch).eq("id", str(fd, "id"));
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/revenue");
  revalidatePath("/admin");
}

export async function deleteBooking(fd: FormData) {
  const supabase = await requireAdmin();
  await supabase.from("bookings").delete().eq("id", str(fd, "id"));
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/revenue");
  revalidatePath("/admin");
}

export async function createBooking(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();

  // One order, one or many candles. The form sends the lines as JSON so the
  // whole basket arrives in a single save.
  const lines = json<{ slug: string; qty: number; unitPrice: number }[]>(fd, "items", []).filter(
    (line) => line.slug && line.qty > 0,
  );
  if (lines.length === 0) return { ok: false, message: "Add at least one candle to the order." };
  if (lines.some((line) => !(line.unitPrice > 0))) {
    return { ok: false, message: "Every line needs the rate you sold it at." };
  }

  const { data: products } = await supabase
    .from("products")
    .select("slug, name, images")
    .in("slug", lines.map((line) => line.slug));

  const catalogue = new Map((products ?? []).map((p) => [p.slug as string, p]));

  const items: BookingItem[] = lines.map((line) => {
    const product = catalogue.get(line.slug);
    const qty = Math.floor(line.qty);
    return {
      slug: line.slug,
      name: (product?.name as string) ?? line.slug,
      image: (product?.images as string[] | null)?.[0] ?? null,
      qty,
      unitPrice: line.unitPrice,
      total: Math.round(line.unitPrice * qty),
    };
  });

  const { pieces, amount } = itemsTotals(items);
  const first = items[0];

  const status = str(fd, "status");
  if (!isBookingStatus(status)) return { ok: false, message: "Pick a status." };

  const paidAt =
    status === "paid" || status === "fulfilled"
      ? (str(fd, "paid_on") ? new Date(str(fd, "paid_on")).toISOString() : new Date().toISOString())
      : null;

  const { error } = await supabase.from("bookings").insert({
    items,
    // The single-candle columns stay filled with the first line and the order
    // totals, so every older screen and query still reads this row correctly.
    product_slug: first.slug,
    product_name: itemsLabel(items),
    product_image: first.image,
    quantity: pieces,
    unit_price: items.length === 1 ? first.unitPrice : 0,
    total_price: amount,
    fragrance: str(fd, "fragrance") || null,
    pincode: str(fd, "pincode") || null,
    state: str(fd, "state") || null,
    buyer_name: str(fd, "buyer_name") || null,
    buyer_contact: str(fd, "buyer_contact").replace(/^@/, "") || null,
    phone: str(fd, "phone") || null,
    note: str(fd, "note") || null,
    status,
    source: "manual",
    paid_at: paidAt,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/bookings");
  revalidatePath("/admin/revenue");
  revalidatePath("/admin");
  redirect("/admin/bookings?added=1");
}

/* ------------------------------------------------------- payment links -- */

export type LinkState = { ok: boolean; message: string; url?: string };

/**
 * Raises a Razorpay payment link for part or all of an order. The amount is
 * whatever advance share he chose, so it matches the message he is about to
 * send.
 */
export async function createBookingPaymentLink(
  _prev: LinkState,
  fd: FormData,
): Promise<LinkState> {
  const supabase = await requireAdmin();

  const id = str(fd, "id");
  const amount = num(fd, "amount");
  if (!id) return { ok: false, message: "Which order?" };
  if (amount < 1) return { ok: false, message: "Amount must be at least ₹1." };

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, product_name, quantity, items, buyer_name, phone")
    .eq("id", id)
    .maybeSingle();
  if (!booking) return { ok: false, message: "That order no longer exists." };

  const lines = parseItems(booking.items);
  const reference = id.slice(0, 8).toUpperCase();
  // An order with several candles in it says how many pieces in total rather
  // than pretending it is one line.
  const what =
    lines.length > 1
      ? `${lines.length} candles × ${booking.quantity} pcs`
      : `${booking.product_name} × ${booking.quantity}`;
  const result = await createPaymentLink({
    bookingId: id,
    reference,
    description: `${what} — Sugandha Candles (ref ${reference})`,
    amount,
    buyerName: booking.buyer_name,
    buyerPhone: booking.phone,
    notify: bool(fd, "notify"),
  });

  if (!result.ok) return { ok: false, message: result.message };

  const { error } = await supabase
    .from("bookings")
    .update({
      payment_link_id: result.link.id,
      payment_link_url: result.link.url,
      payment_amount: result.link.amount,
    })
    .eq("id", id);

  if (error) {
    return {
      ok: false,
      message: "Link created at Razorpay but could not be saved here. Run migration 010.",
      url: result.link.url,
    };
  }

  revalidatePath("/admin/bookings");
  return { ok: true, message: "Link ready.", url: result.link.url };
}

// --------------------------------------------------------------- orders ----

/**
 * A payment link for a retail order whose checkout never completed — the buyer
 * hit a card failure, or closed the tab. The link is hosted by Razorpay, so it
 * works from a WhatsApp message and does not depend on our own checkout page.
 *
 * Always the full total: unlike an enquiry, a retail order has no advance.
 */
export async function createOrderPaymentLink(_prev: LinkState, fd: FormData): Promise<LinkState> {
  const supabase = await requireAdmin();

  const id = str(fd, "id");
  if (!id) return { ok: false, message: "Which order?" };

  const { data: order } = await supabase
    .from("orders")
    .select("id, reference, items, total, buyer_name, phone, status, payment_link_url")
    .eq("id", id)
    .maybeSingle();
  if (!order) return { ok: false, message: "That order no longer exists." };
  if (PAID_STATUSES.includes(order.status as OrderStatus)) {
    return { ok: false, message: "This order is already paid." };
  }
  // Raising a second link would let the same order be paid twice.
  if (order.payment_link_url) {
    return { ok: true, message: "Link ready.", url: order.payment_link_url as string };
  }

  const lines = toOrderItems(order.items);
  const pieces = lines.reduce((sum, line) => sum + line.qty, 0);
  const what = lines.length === 1 ? `${lines[0].name} × ${lines[0].qty}` : `${pieces} candles`;

  const result = await createPaymentLink({
    orderId: id,
    reference: String(order.reference ?? id.slice(0, 8).toUpperCase()),
    description: `${what} — Sugandha Candles (ref ${order.reference})`,
    amount: Number(order.total ?? 0),
    buyerName: order.buyer_name as string | null,
    buyerPhone: order.phone as string | null,
    notify: bool(fd, "notify"),
  });
  if (!result.ok) return { ok: false, message: result.message };

  const { error } = await supabase
    .from("orders")
    .update({ payment_link_id: result.link.id, payment_link_url: result.link.url })
    .eq("id", id);

  if (error) {
    return {
      ok: false,
      message: "Link made at Razorpay but could not be saved here. Run migration 022.",
      url: result.link.url,
    };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true, message: "Link ready.", url: result.link.url };
}


export async function setOrderStatus(fd: FormData) {
  const supabase = await requireAdmin();
  const status = str(fd, "status");
  if (!isOrderStatus(status)) return;

  const patch: Record<string, unknown> = { status };
  // A payment recorded by hand still needs a timestamp, or the order sorts and
  // reports as if the money never arrived.
  if (PAID_STATUSES.includes(status)) patch.paid_at = new Date().toISOString();

  await supabase.from("orders").update(patch).eq("id", str(fd, "id"));
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

export async function saveOrderTracking(fd: FormData) {
  const supabase = await requireAdmin();
  const trackingNumber = str(fd, "trackingNumber");

  await supabase
    .from("orders")
    .update({
      carrier: str(fd, "carrier") || null,
      tracking_number: trackingNumber || null,
      tracking_url: str(fd, "trackingUrl") || null,
      // Handing a parcel to a courier is what "shipped" means, so filling this
      // in moves the order along rather than making it a second click.
      ...(trackingNumber ? { status: "shipped" } : {}),
    })
    .eq("id", str(fd, "id"));

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

export async function deleteOrder(fd: FormData) {
  const supabase = await requireAdmin();
  await supabase.from("orders").delete().eq("id", str(fd, "id"));
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

/**
 * Edits the where-it-goes half of an order — who it is for and where it ships.
 * Deliberately does not touch the items, prices or the amount paid: those were
 * fixed at checkout, and changing them here would put the money and the parcel
 * out of step. A change to the order itself is a refund and a fresh order.
 */
export async function updateOrderDetails(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();

  const id = str(fd, "id");
  if (!id) return { ok: false, message: "Which order?" };

  const buyerName = str(fd, "buyer_name");
  if (!buyerName) return { ok: false, message: "The buyer needs a name." };

  const phone = str(fd, "phone").replace(/\D/g, "").slice(-10);
  if (phone.length !== 10) return { ok: false, message: "The phone must be a 10-digit number." };

  const email = str(fd, "email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "That email address does not look right." };
  }

  const pincode = str(fd, "pincode");
  if (!/^\d{6}$/.test(pincode)) return { ok: false, message: "A pincode is 6 digits." };

  const addressLine1 = str(fd, "address_line1");
  if (addressLine1.length < 4) return { ok: false, message: "Add the house or flat number and the street." };

  const { error } = await supabase
    .from("orders")
    .update({
      buyer_name: buyerName.slice(0, 120),
      phone,
      email: email.slice(0, 160) || null,
      pincode,
      state: str(fd, "state").slice(0, 120) || null,
      city: str(fd, "city").slice(0, 120) || null,
      address_line1: addressLine1.slice(0, 240),
      address_line2: str(fd, "address_line2").slice(0, 240) || null,
      note: str(fd, "note").slice(0, 500) || null,
    })
    .eq("id", id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true, message: "Saved." };
}

/**
 * Edits the details on an enquiry — buyer, delivery and note. Like an order, the
 * lines and rates are left alone; use the booking form to rebuild an order whose
 * contents changed.
 */
export async function updateBooking(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();

  const id = str(fd, "id");
  if (!id) return { ok: false, message: "Which order?" };

  const patch: Record<string, unknown> = {
    buyer_name: str(fd, "buyer_name") || null,
    buyer_contact: str(fd, "buyer_contact").replace(/^@/, "") || null,
    phone: str(fd, "phone") || null,
    pincode: str(fd, "pincode") || null,
    state: str(fd, "state") || null,
    address: str(fd, "address") || null,
    fragrance: str(fd, "fragrance") || null,
    note: str(fd, "note") || null,
  };

  // Rebuild the lines when the editor sends them. A custom ("unknown") candle
  // has no catalogue slug, so one is made from its name — an empty slug would be
  // silently dropped when the items are read back.
  const raw = json<{ slug?: string; name?: string; image?: string | null; qty?: number; unitPrice?: number }[]>(
    fd,
    "items",
    [],
  );
  const items: BookingItem[] = raw
    .map((line, i) => {
      const name = String(line.name ?? "").trim();
      const qty = Math.max(0, Math.floor(Number(line.qty) || 0));
      const unitPrice = Math.max(0, Number(line.unitPrice) || 0);
      const slug = (line.slug || slugify(name) || `line-${i + 1}`).trim() || `line-${i + 1}`;
      return {
        slug,
        name: name || slug,
        image: typeof line.image === "string" ? line.image : null,
        qty,
        unitPrice,
        total: Math.round(unitPrice * qty),
      };
    })
    .filter((l) => l.qty > 0);

  if (items.length) {
    const { pieces, amount } = itemsTotals(items);
    // The agreed price after any discount. Blank or 0 falls back to the line sum.
    const finalTotal = num(fd, "final_total");
    const first = items[0];
    patch.items = items;
    patch.product_slug = first.slug;
    patch.product_name = itemsLabel(items);
    patch.product_image = first.image;
    patch.quantity = pieces;
    patch.unit_price = items.length === 1 ? first.unitPrice : 0;
    patch.total_price = finalTotal > 0 ? Math.round(finalTotal) : amount;
  }

  const { error } = await supabase.from("bookings").update(patch).eq("id", id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/bookings");
  revalidatePath("/admin/revenue");
  revalidatePath("/admin");
  return { ok: true, message: "Saved." };
}

/**
 * Hands an enquiry to RapidShyp as a shipment, by hand. Unlike a paid order (auto
 * on payment), an enquiry has no address until you fill one in — so this checks
 * for it first. Idempotent: refuses to make a second shipment for the same row.
 */
export async function createBookingShipment(id: string): Promise<ActionState> {
  const supabase = await requireAdmin();
  if (!id) return { ok: false, message: "Which enquiry?" };

  if (!isRapidshypConfigured()) {
    return { ok: false, message: "RapidShyp is not set up yet (needs the API key and pickup name)." };
  }

  const { data: b } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();
  if (!b) return { ok: false, message: "That enquiry no longer exists." };
  if (b.rapidshyp_order_id) {
    return { ok: true, message: `Shipment already made: ${b.rapidshyp_order_id}` };
  }

  const address = String(b.address ?? "").trim();
  const phone = String(b.phone ?? "").replace(/\D/g, "").slice(-10);
  const pincode = String(b.pincode ?? "").trim();
  if (address.length < 3) return { ok: false, message: "Add a delivery address first (Edit → Address)." };
  if (!/^\d{6}$/.test(pincode)) return { ok: false, message: "Add a 6-digit pincode first (Edit)." };
  if (phone.length !== 10) return { ok: false, message: "Add a 10-digit phone number first (Edit)." };

  const parsed = parseItems(b.items);
  const items = parsed.length
    ? parsed
    : [
        {
          slug: String(b.product_slug ?? "item"),
          name: String(b.product_name ?? "Candle"),
          image: null,
          qty: Number(b.quantity) || 1,
          unitPrice: Number(b.unit_price) || Number(b.total_price) || 1,
          total: Number(b.total_price) || 0,
        },
      ];

  const catalogue = await getProducts();
  const grams = items.reduce((sum, i) => {
    const product = catalogue.find((p) => p.slug === i.slug);
    // Custom ("unknown") candles have no catalogue weight — assume 400 g/piece;
    // the box is refined by hand in RapidShyp anyway.
    return sum + (product ? packGramsOf(product) : 400) * (i.qty || 1);
  }, 0);

  const shipment = await createRapidshypShipment({
    reference: `ENQ-${String(b.id).slice(0, 8).toUpperCase()}`,
    buyerName: String(b.buyer_name || b.buyer_contact || "Customer"),
    phone,
    email: null,
    pincode,
    addressLine1: address,
    addressLine2: null,
    city: b.state ?? null,
    state: b.state ?? null,
    shipping: 0,
    items: items.map((i) => ({ slug: i.slug, name: i.name, qty: i.qty, unitPrice: i.unitPrice })),
    grams,
  });

  if (!shipment.ok) return { ok: false, message: shipment.message };

  await supabase.from("bookings").update({ rapidshyp_order_id: shipment.id }).eq("id", id);
  revalidatePath("/admin/bookings");
  return { ok: true, message: `Shipment created: ${shipment.id}` };
}

/* ---------------------------------------------------------- reel scripts -- */

/** "" → null, so an empty metric box stays "not measured yet", not zero. */
const intOrNull = (fd: FormData, key: string) => {
  const raw = str(fd, key);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.round(n) : null;
};

/**
 * A datetime-local field hands over wall-clock text with no zone ("2026-08-31T19:30").
 * The shop, the phone typing it and the audience are all in IST, so it is read
 * as IST rather than as the server's zone — otherwise a reel scheduled for
 * 7:30 pm lands at 1 am on a UTC host.
 */
const IST_OFFSET = "+05:30";
const localToISO = (value: string) => (value ? new Date(`${value}${IST_OFFSET}`).toISOString() : null);

export async function saveScript(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();

  const title = str(fd, "title");
  if (!title) return { ok: false, message: "Give the script a title." };

  const body = str(fd, "body");
  const status = str(fd, "status");
  const words = countWords(body);

  const row = {
    title,
    hook: str(fd, "hook"),
    body,
    on_screen_text: str(fd, "on_screen_text"),
    notes: str(fd, "notes"),
    cta: str(fd, "cta"),
    status: isScriptStatus(status) ? status : "draft",
    scheduled_at: localToISO(str(fd, "scheduled_at")),
    posted_at: localToISO(str(fd, "posted_at")),
    permalink: str(fd, "permalink") || null,
    word_count: words,
    // Trust a hand-typed timing; fall back to reading speed when it is blank.
    duration_sec: num(fd, "duration_sec") || estimateDuration(words),
    views: intOrNull(fd, "views"),
    likes: intOrNull(fd, "likes"),
    comments: intOrNull(fd, "comments"),
    shares: intOrNull(fd, "shares"),
    saves: intOrNull(fd, "saves"),
    reach: intOrNull(fd, "reach"),
    follows: intOrNull(fd, "follows"),
  };

  const id = str(fd, "id");
  const { error } = id
    ? await supabase.from("reel_scripts").update(row).eq("id", id)
    : await supabase.from("reel_scripts").insert(row);

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") {
      return { ok: false, message: "Run migration 020-scripts.sql in Supabase first." };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/scripts");
  redirect("/admin/scripts?saved=1");
}

/**
 * The one-click "Posted" on a row. Stamps the time it actually went out, which
 * is what the engagement numbers get read against later.
 */
export async function markScriptPosted(fd: FormData) {
  const supabase = await requireAdmin();
  const id = str(fd, "id");
  if (id) {
    await supabase
      .from("reel_scripts")
      .update({ status: "posted", posted_at: new Date().toISOString() })
      .eq("id", id);
  }
  revalidatePath("/admin/scripts");
}

export async function deleteScript(fd: FormData) {
  const supabase = await requireAdmin();
  await supabase.from("reel_scripts").delete().eq("id", str(fd, "id"));
  revalidatePath("/admin/scripts");
  redirect("/admin/scripts?deleted=1");
}
