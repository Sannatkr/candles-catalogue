import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Razorpay calls this when a payment link is paid. Anyone can POST here, so the
 * signature is what makes it trustworthy — never act on the body before it
 * verifies.
 */
export const dynamic = "force-dynamic";

function signatureMatches(rawBody: string, header: string | null, secret: string) {
  if (!header) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(header, "utf8");
  // Length check first: timingSafeEqual throws on a mismatch.
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !serviceKey) {
    return Response.json({ error: "not configured" }, { status: 503 });
  }

  const raw = await request.text();
  if (!signatureMatches(raw, request.headers.get("x-razorpay-signature"), secret)) {
    return Response.json({ error: "bad signature" }, { status: 401 });
  }

  let event: {
    event?: string;
    payload?: {
      payment_link?: { entity?: { id?: string; amount_paid?: number; notes?: { booking_id?: string } } };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }

  // Only the paid event matters; acknowledge the rest so Razorpay stops retrying.
  if (event.event !== "payment_link.paid") return Response.json({ ok: true, ignored: event.event });

  const entity = event.payload?.payment_link?.entity;
  const bookingId = entity?.notes?.booking_id;
  const linkId = entity?.id;
  if (!bookingId && !linkId) return Response.json({ error: "no booking reference" }, { status: 400 });

  const supabase = createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const patch = {
    status: "paid",
    paid_at: new Date().toISOString(),
    amount_paid: (entity?.amount_paid ?? 0) / 100,
    paid_via: "razorpay",
  };

  // Prefer the id we put in notes; fall back to the link id we stored.
  const query = bookingId
    ? supabase.from("bookings").update(patch).eq("id", bookingId)
    : supabase.from("bookings").update(patch).eq("payment_link_id", linkId!);

  const { error } = await query;
  if (error) return Response.json({ error: "could not record payment" }, { status: 500 });

  return Response.json({ ok: true });
}
