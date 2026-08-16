import type { Product } from "./types";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function money(value: number) {
  return inr.format(value).replace(/\.00$/, "");
}

export function compactQty(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

/** Lowest slab price, which is what "from ₹X" on a card should show. */
export function bestPrice(product: Product) {
  const prices = [product.basePrice, ...product.priceTiers.map((t) => t.price)].filter(
    (p) => typeof p === "number" && p > 0,
  );
  return prices.length ? Math.min(...prices) : product.basePrice;
}

export function whatsappLink(number: string, message: string) {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}
