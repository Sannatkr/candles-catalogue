import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { shipOrderRow } from "@/lib/fulfillment";
import { SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Razorpay calls this. Anyone can POST here, so the signature is what makes it
 * trustworthy — never act on the body before it verifies.
 *
 * Two jobs:
 *  - `payment_link.paid`   → marks a booking paid (the enquiry payment links).
 *  - `order.paid` / `payment.captured` → the safety net for retail checkout: if a
 *    buyer pays and their browser dies before confirmPayment runs, this promotes
 *    the order to paid and books the shipment, so nothing gets stuck pending.
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

type Entity = { id?: string; order_id?: string; amount_paid?: number; notes?: { booking_id?: string } };

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
      payment_link?: { entity?: Entity };
      order?: { entity?: Entity };
      payment?: { entity?: Entity };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ---- enquiry payment links -> bookings ----
  if (event.event === "payment_link.paid") {
    const entity = event.payload?.payment_link?.entity;
    const bookingId = entity?.notes?.booking_id;
    const linkId = entity?.id;
    if (!bookingId && !linkId) return Response.json({ error: "no booking reference" }, { status: 400 });

    const patch = {
      status: "paid",
      paid_at: new Date().toISOString(),
      amount_paid: (entity?.amount_paid ?? 0) / 100,
      paid_via: "razorpay",
    };
    const query = bookingId
      ? supabase.from("bookings").update(patch).eq("id", bookingId)
      : supabase.from("bookings").update(patch).eq("payment_link_id", linkId!);

    const { error } = await query;
    if (error) return Response.json({ error: "could not record payment" }, { status: 500 });
    return Response.json({ ok: true });
  }

  // ---- retail checkout safety net -> orders ----
  if (event.event === "order.paid" || event.event === "payment.captured") {
    const payment = event.payload?.payment?.entity;
    const order = event.payload?.order?.entity;
    const razorpayOrderId = order?.id ?? payment?.order_id;
    const paymentId = payment?.id ?? null;
    if (!razorpayOrderId) return Response.json({ ok: true, ignored: "no order id" });

    const { data } = await supabase
      .from("orders")
      .select("id, total, status")
      .eq("razorpay_order_id", razorpayOrderId)
      .maybeSingle();
    const row = data as { id: string; total: number; status: string } | null;
    if (!row) return Response.json({ ok: true, ignored: "no matching order" });

    // Promote only a still-pending order — confirmPayment usually got there first.
    if (row.status === "pending") {
      await supabase
        .from("orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          razorpay_payment_id: paymentId,
          amount_paid: row.total,
        })
        .eq("id", row.id)
        .eq("status", "pending");
    }

    const liveMode = !(process.env.RAZORPAY_KEY_ID ?? "").startsWith("rzp_test_");
    await shipOrderRow(supabase, row.id, liveMode);
    return Response.json({ ok: true });
  }

  return Response.json({ ok: true, ignored: event.event });
}
