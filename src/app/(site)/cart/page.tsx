import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
import { getProducts, getSettings } from "@/lib/data";
import { eligibleGifts } from "@/lib/gift";

export const metadata: Metadata = {
  title: "Your bag",
  robots: { index: false },
};

// The bag and the checkout must reflect the catalogue as it is right now — a
// page cached from before a candle became giftable would quietly hide the offer.
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const [settings, products] = await Promise.all([getSettings(), getProducts()]);

  return (
    <div className="mx-auto max-w-[1240px] px-5 pt-10 pb-24 sm:px-8">
      <h1 className="font-display text-[clamp(1.9rem,4vw,2.6rem)] leading-tight tracking-[-0.02em] text-ink">
        Your bag
      </h1>
      <CartView
        shippingConfig={settings.shipping}
        giftConfig={settings.gift}
        giftProducts={eligibleGifts(products)}
      />
    </div>
  );
}
