"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerSupabase } from "@/lib/supabase/server";

/**
 * Customer accounts. No passwords anywhere — a one-time code to the buyer's
 * own inbox is the whole of it, which means there is no password to forget, no
 * reset flow to build, and nothing worth stealing if the table ever leaked.
 *
 * Signing up and signing in are the same act. Someone typing their email for
 * the first time gets an account; someone typing it for the tenth gets their
 * order history. They never have to know which one happened.
 */

export type CodeResult = { ok: boolean; message: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendLoginCode(email: string): Promise<CodeResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Accounts are not switched on yet." };
  }

  const address = email.trim().toLowerCase();
  if (!EMAIL.test(address)) {
    return { ok: false, message: "That email address does not look right." };
  }

  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.signInWithOtp({
    email: address,
    // First time in, this is a signup. Tenth time, it is a login. Same door.
    options: { shouldCreateUser: true },
  });

  if (error) {
    // Supabase rate-limits by address and by IP. Say so plainly rather than
    // letting someone tap Send four times wondering why nothing arrives.
    if (error.status === 429) {
      return { ok: false, message: "Too many codes requested. Wait a minute and try again." };
    }
    return { ok: false, message: "Could not send that code. Try again in a moment." };
  }

  return { ok: true, message: `Code sent to ${address}.` };
}

export async function verifyLoginCode(email: string, code: string): Promise<CodeResult> {
  const address = email.trim().toLowerCase();
  const token = code.replace(/\D/g, "");

  // Supabase's code length is a dashboard setting, anywhere from 6 to 10.
  // Checking a range rather than one number keeps this working if it changes.
  if (token.length < 6 || token.length > 10) {
    return { ok: false, message: "That code does not look right — copy it from the email." };
  }

  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.verifyOtp({ email: address, token, type: "email" });

  if (error) {
    return {
      ok: false,
      message:
        error.status === 401 || error.status === 403
          ? "That code is wrong or has expired. Send a new one."
          : "Could not check that code. Try again.",
    };
  }

  // Everything placed with this address before today now belongs to them.
  await supabase.rpc("claim_my_orders");

  revalidatePath("/account");
  return { ok: true, message: "" };
}

export async function signOutCustomer() {
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}

export type AccountOrder = {
  id: string;
  reference: string;
  createdAt: string;
  status: string;
  total: number;
  items: { slug: string; name: string; image: string | null; qty: number; unitPrice: number }[];
  city: string | null;
  state: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
};

/** The signed-in buyer, or null. Cheap enough to call from a layout. */
export async function getCustomer() {
  if (!isSupabaseConfigured) return null;
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  return { id: user.id, email: user.email };
}

export async function getMyOrders(): Promise<AccountOrder[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await getServerSupabase();

  // Cheap and idempotent. Running it on every visit means an order placed as a
  // guest after signing up still finds its way home.
  await supabase.rpc("claim_my_orders");

  /**
   * Only things that actually became orders.
   *
   * A pending row is someone who opened the payment sheet and walked away, and
   * a failed one is a payment that did not go through. Neither is an order, and
   * showing them here reads as "you owe us for four candles" when the buyer owes
   * nothing. Their bag is where unfinished business belongs.
   *
   * They stay visible in the admin, where an abandoned checkout is worth seeing.
   */
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, reference, created_at, status, total, items, city, state, carrier, tracking_number, tracking_url",
    )
    .not("status", "in", "(pending,failed)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];

  return data.map((row) => ({
    id: String(row.id),
    reference: String(row.reference),
    createdAt: String(row.created_at),
    status: String(row.status),
    total: Number(row.total),
    items: Array.isArray(row.items) ? row.items : [],
    city: row.city,
    state: row.state,
    carrier: row.carrier,
    trackingNumber: row.tracking_number,
    trackingUrl: row.tracking_url,
  }));
}
