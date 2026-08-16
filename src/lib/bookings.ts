"use server";

import { CUSTOMISE_FROM, type BookingResult } from "@/lib/booking-config";
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
  note: string | null;
};

export async function placeBooking(input: Input): Promise<BookingResult> {
  const quantity = Math.floor(Number(input.quantity));
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > 100000) {
    return { ok: false, message: "Enter a quantity between 1 and 100000." };
  }
  if (!input.buyerContact.trim()) {
    return { ok: false, message: "Add a phone number or Instagram handle so we can reply." };
  }
  if (!/^\d{6}$/.test(input.pincode.trim())) {
    return { ok: false, message: "Enter a 6-digit delivery pincode." };
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

  const row = {
    id,
    product_slug: input.productSlug,
    product_name: input.productName,
    product_image: input.productImage,
    quantity,
    unit_price: input.unitPrice,
    total_price: Math.round(input.unitPrice * quantity),
    fragrance: input.fragrance,
    pincode: input.pincode.trim(),
    state: input.state?.slice(0, 120) || null,
    buyer_name: input.buyerName.trim().slice(0, 120),
    buyer_contact: input.buyerContact.trim().slice(0, 120),
    note: input.note?.trim().slice(0, 500) || null,
  };

  let { error } = await supabase.from("bookings").insert(row);

  // 42703 is "column does not exist" — the state column arrives with migration
  // 004, so until that has been run the order still goes through without it.
  if (error?.code === "42703") {
    const withoutState: Partial<typeof row> = { ...row };
    delete withoutState.state;
    ({ error } = await supabase.from("bookings").insert(withoutState));
  }

  if (error) return { ok: false, message: "Could not save that. Please try once more." };

  return { ok: true, message: "", reference: id.slice(0, 8).toUpperCase() };
}
