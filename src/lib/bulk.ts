"use server";

import { CUSTOMISE_FROM, type BookingResult } from "@/lib/booking-config";
import { getProducts, getSettings } from "@/lib/data";
import { isValidInstagramHandle } from "@/lib/format";
import { maxQtyOf, minQtyOf, unitPriceAt } from "@/lib/pricing";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getPublicSupabase } from "@/lib/supabase/server";

/**
 * The bulk enquiry: several candles, a quantity against each, one form.
 *
 * This is the path a corporate or wedding buyer actually takes. They do not
 * want one design at 300 pieces — they want forty of this, sixty of that, in a
 * budget. Sending them to an Instagram DM to type all that out lost most of
 * them at the first message, so the form asks for it here and the DM becomes
 * optional: a place to follow up, not the only door in.
 *
 * The catalogue is fetched on demand rather than shipped with every page. The
 * picker needs a photograph and a price for all thirty-odd candles, which is a
 * lot of markup to put on a product page nobody may ever open the form from.
 */

export type BulkPick = { slug: string; qty: number };

/** A candle as the picker shows it: a photograph, a price, and a set size. */
export type BulkChoice = {
  slug: string;
  name: string;
  image: string | null;
  basePrice: number;
  minQty: number;
  maxQty: number;
  /** Do the quantity slabs apply? The picker prices the line with it, so the
   *  number the buyer is shown is the number the server will save. */
  bulkPricing: boolean;
};

export async function bulkCatalogue(): Promise<BulkChoice[]> {
  const products = await getProducts();
  return products
    .filter((p) => p.inStock)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      image: p.images[0] ?? null,
      basePrice: p.basePrice,
      minQty: minQtyOf(p),
      maxQty: maxQtyOf(p),
      bulkPricing: p.bulkPricing,
    }));
}

export type BulkEnquiryInput = {
  picks: BulkPick[];
  fragrance: string | null;
  buyerName: string;
  phone: string;
  instagram: string;
  pincode: string;
  state: string | null;
  note: string | null;
};

/**
 * Files the enquiry. Every line is rebuilt from the catalogue: the browser
 * sends slugs and quantities, and the names, photographs and indicative rates
 * are looked up here. A quote is not a checkout, but the number the owner opens
 * in the admin still has to be one the shop would actually stand behind.
 */
export async function placeBulkEnquiry(input: BulkEnquiryInput): Promise<BookingResult> {
  const name = input.buyerName.trim();
  if (!name) return { ok: false, message: "Add your name." };

  const handle = input.instagram
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/.*$/, "");
  if (handle && !isValidInstagramHandle(handle)) {
    return {
      ok: false,
      message: "That does not look like an Instagram username — letters, numbers, dots and underscores only.",
    };
  }

  const phone = input.phone.replace(/\D/g, "").slice(-10);
  if (input.phone.trim() && phone.length !== 10) {
    return { ok: false, message: "That needs to be a 10-digit mobile number." };
  }
  if (!handle && !phone) {
    return { ok: false, message: "Leave a phone number or an Instagram username so we can reply." };
  }

  const pincode = input.pincode.trim();
  if (pincode && !/^\d{6}$/.test(pincode)) {
    return { ok: false, message: "A pincode is 6 digits — or leave it blank." };
  }

  const [catalogue, settings] = await Promise.all([getProducts(), getSettings()]);

  const items = input.picks.flatMap((pick) => {
    const product = catalogue.find((p) => p.slug === pick.slug);
    if (!product) return [];
    const qty = Math.floor(Number(pick.qty) || 0);
    if (qty < 1 || qty > 100000) return [];
    // The rate the slabs would give at that quantity. Above the online ceiling
    // there is no slab left to read, so the deepest rung is the honest opener —
    // it is what the buyer would have paid had the parcel allowed it.
    const unitPrice = unitPriceAt(product, settings.bulkTiers, qty);
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

  if (!items.length) return { ok: false, message: "Pick at least one candle and a quantity." };

  const quantity = items.reduce((sum, i) => sum + i.qty, 0);
  const total = items.reduce((sum, i) => sum + i.total, 0);

  if (quantity >= CUSTOMISE_FROM && !input.fragrance) {
    return { ok: false, message: "Pick a fragrance for this order." };
  }

  if (!isSupabaseConfigured) {
    // Nothing to write to yet — let the buyer through to the Instagram step.
    return { ok: true, message: "", reference: "PREVIEW" };
  }

  // Buyers can insert a booking but must never read the table back, so the id
  // is generated here rather than selected after the write.
  const id = crypto.randomUUID();
  const lead = items[0];

  const row = {
    id,
    items,
    // The single-candle columns stay filled, so every admin screen written
    // before multi-line enquiries existed still reads this row.
    product_slug: lead.slug,
    product_name: items.length > 1 ? `${lead.name} +${items.length - 1} more` : lead.name,
    product_image: lead.image,
    quantity,
    unit_price: items.length > 1 ? null : lead.unitPrice,
    total_price: total,
    fragrance: input.fragrance,
    pincode: pincode || null,
    state: input.state?.slice(0, 120) || null,
    buyer_name: name.slice(0, 120),
    buyer_contact: handle.slice(0, 120),
    phone: phone || null,
    note: input.note?.trim().slice(0, 500) || null,
  };

  const { error } = await getPublicSupabase().from("bookings").insert(row);
  if (error) return { ok: false, message: "Could not save that. Please try once more." };

  return { ok: true, message: "", reference: id.slice(0, 8).toUpperCase() };
}
