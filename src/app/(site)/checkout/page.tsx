import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { getSettings } from "@/lib/data";
import { isCheckoutConfigured } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

// The bag and the checkout must reflect the catalogue as it is right now — a
// page cached from before a slab changed would quote the old rate.
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [settings, configured] = await Promise.all([getSettings(), isCheckoutConfigured()]);

  return (
    <div className="mx-auto max-w-[1240px] px-5 pt-10 pb-24 sm:px-8">
      <h1 className="font-display text-[clamp(1.9rem,4vw,2.6rem)] leading-tight tracking-[-0.02em] text-ink">
        Checkout
      </h1>
      <p className="mt-2 text-[0.95rem] text-ink-soft">
        Delivered across India. Dispatched in 2–4 working days.
      </p>

      <CheckoutForm
        configured={configured}
        instagramHandle={settings.instagramHandle}
        shippingConfig={settings.shipping}
      />
    </div>
  );
}
