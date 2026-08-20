"use server";

import { CUSTOMISE_FROM, type BookingResult } from "@/lib/booking-config";
import { isValidInstagramHandle } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getPublicSupabase } from "@/lib/supabase/server";

type Input = {
  productSlug: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  fragrance: string | null;
  pincode: string;
  state: string | null;
  buyerName: string;
  buyerContact: string;
  phone: string;
  note: string | null;
};

export async function placeBooking(input: Input): Promise<BookingResult> {
  const quantity = Math.floor(Number(input.quantity));
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > 100000) {
    return { ok: false, message: "Enter a quantity between 1 and 100000." };
  }
  const handle = input.buyerContact
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/.*$/, "");
  if (!handle) {
    return { ok: false, message: "Add your Instagram username so we can reply." };
  }
  if (!isValidInstagramHandle(handle)) {
    return {
      ok: false,
      message: "That does not look like an Instagram username — letters, numbers, dots and underscores only.",
    };
  }

  const pincode = input.pincode.trim();
  if (pincode && !/^\d{6}$/.test(pincode)) {
    return { ok: false, message: "A pincode is 6 digits — or leave it blank." };
  }
  if (quantity >= CUSTOMISE_FROM && !input.fragrance) {
    return { ok: false, message: "Pick a fragrance for this order." };
  }

  if (!isSupabaseConfigured) {
    // Nothing to write to yet — let the buyer through to the Instagram step.
    return { ok: true, message: "", reference: "PREVIEW" };
  }

  // Buyers can insert a booking but must never read the table back, so the id is
  // generated here rather than selected after the write.
  const id = crypto.randomUUID();

  const supabase = getPublicSupabase();

  const total = Math.round(input.unitPrice * quantity);

  const row = {
    id,
    items: [
      {
        slug: input.productSlug,
        name: input.productName,
        image: input.productImage,
        qty: quantity,
        unitPrice: input.unitPrice,
        total,
      },
    ],
    product_slug: input.productSlug,
    product_name: input.productName,
    product_image: input.productImage,
    quantity,
    unit_price: input.unitPrice,
    total_price: total,
    fragrance: input.fragrance,
    pincode: pincode || null,
    state: input.state?.slice(0, 120) || null,
    buyer_name: input.buyerName.trim().slice(0, 120),
    buyer_contact: handle.slice(0, 120),
    phone: input.phone.trim().slice(0, 40) || null,
    note: input.note?.trim().slice(0, 500) || null,
  };

  let { error } = await supabase.from("bookings").insert(row);

  // PGRST204 is PostgREST rejecting an unknown column from its schema cache;
  // 42703 is Postgres saying the same thing. The state, phone and items columns
  // arrive with later migrations, so until those are run the order still goes
  // through.
  if (error?.code === "PGRST204" || error?.code === "42703") {
    const trimmed: Partial<typeof row> = { ...row };
    delete trimmed.state;
    delete trimmed.phone;
    delete trimmed.items;
    ({ error } = await supabase.from("bookings").insert(trimmed));
  }

  if (error) return { ok: false, message: "Could not save that. Please try once more." };

  return { ok: true, message: "", reference: id.slice(0, 8).toUpperCase() };
}
