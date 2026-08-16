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
  pincode: string | null;
  buyerName: string;
  buyerContact: string;
  note: string | null;
};

export async function placeBooking(input: Input): Promise<BookingResult> {
  const quantity = Math.floor(Number(input.quantity));
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > 100000) {
    return { ok: false, message: "Enter a quantity between 1 and 100000." };
  }
  if (!input.buyerName.trim()) return { ok: false, message: "Please add your name." };
  if (!input.buyerContact.trim()) {
    return { ok: false, message: "Add a phone number or Instagram handle so we can reply." };
  }
  if (quantity >= CUSTOMISE_FROM) {
    if (!input.fragrance) return { ok: false, message: "Pick a fragrance for this order." };
    if (!/^\d{6}$/.test((input.pincode ?? "").trim())) {
      return { ok: false, message: "Enter a 6-digit delivery pincode." };
    }
  }

  if (!isSupabaseConfigured) {
    // Nothing to write to yet — let the buyer through to the Instagram step.
    return { ok: true, message: "", reference: "PREVIEW" };
  }

  const { data, error } = await getPublicSupabase()
    .from("bookings")
    .insert({
      product_slug: input.productSlug,
      product_name: input.productName,
      product_image: input.productImage,
      quantity,
      unit_price: input.unitPrice,
      total_price: Math.round(input.unitPrice * quantity),
      fragrance: input.fragrance,
      pincode: input.pincode?.trim() || null,
      buyer_name: input.buyerName.trim().slice(0, 120),
      buyer_contact: input.buyerContact.trim().slice(0, 120),
      note: input.note?.trim().slice(0, 500) || null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, message: "Could not save that. Please try once more." };

  return { ok: true, message: "", reference: (data?.id ?? "").slice(0, 8).toUpperCase() };
}
