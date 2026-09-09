import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Your bag",
  robots: { index: false },
};

// The bag and the checkout must reflect the catalogue as it is right now — a
// page cached from before a slab changed would quote the old rate.
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-[1240px] px-5 pt-10 pb-24 sm:px-8">
      <h1 className="font-display text-[clamp(1.9rem,4vw,2.6rem)] leading-tight tracking-[-0.02em] text-ink">
        Your bag
      </h1>
      <CartView shippingConfig={settings.shipping} />
    </div>
  );
}
