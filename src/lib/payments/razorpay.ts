"use server";

/**
 * Razorpay Payment Links, called over plain fetch rather than the SDK — one
 * endpoint does not justify a dependency.
 *
 * Keys live only in the server environment. RAZORPAY_KEY_SECRET must never
 * reach the browser, so nothing here may be imported by a client component.
 */

const API = "https://api.razorpay.com/v1/payment_links";

export type PaymentLink = { id: string; url: string; amount: number };
export type LinkResult = { ok: true; link: PaymentLink } | { ok: false; message: string };

export async function isRazorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/** True while the account is still on test keys, which is worth surfacing. */
export async function isRazorpayTestMode() {
  return (process.env.RAZORPAY_KEY_ID ?? "").startsWith("rzp_test");
}

export async function createPaymentLink(input: {
  bookingId: string;
  reference: string;
  description: string;
  /** Rupees. Razorpay wants paise, converted below. */
  amount: number;
  buyerName: string | null;
  buyerPhone: string | null;
  notify: boolean;
}): Promise<LinkResult> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return { ok: false, message: "Razorpay keys are not set on the server yet." };
  }

  const paise = Math.round(input.amount * 100);
  if (paise < 100) return { ok: false, message: "Razorpay needs at least ₹1." };

  const phone = input.buyerPhone?.replace(/\D/g, "").slice(-10);

  const body = {
    amount: paise,
    currency: "INR",
    accept_partial: false,
    description: input.description.slice(0, 2048),
    reference_id: input.reference,
    // Echoed back on the webhook, so a payment can be matched to its order.
    notes: { booking_id: input.bookingId },
    customer: {
      name: input.buyerName?.slice(0, 100) || undefined,
      contact: phone && phone.length === 10 ? phone : undefined,
    },
    notify: { sms: input.notify && Boolean(phone), email: false },
    reminder_enable: true,
  };

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const json = (await res.json()) as {
      id?: string;
      short_url?: string;
      amount?: number;
      error?: { description?: string };
    };

    if (!res.ok || !json.id || !json.short_url) {
      return { ok: false, message: json.error?.description ?? `Razorpay refused that (${res.status}).` };
    }

    return { ok: true, link: { id: json.id, url: json.short_url, amount: (json.amount ?? paise) / 100 } };
  } catch {
    return { ok: false, message: "Could not reach Razorpay. Try again in a moment." };
  }
}
