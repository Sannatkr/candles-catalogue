"use client";

import { Gift } from "lucide-react";
import { useCart } from "@/lib/cart";
import { celebrateGift } from "@/lib/celebrate";
import { giftUnlocked } from "@/lib/gift";
import { useGiftConfig } from "@/lib/gift-context";
import type { Product } from "@/lib/types";

/**
 * The shiny "free" tag in the corner of a giftable candle.
 *
 * A tiny client island so the card itself stays a server component — the card
 * is rendered dozens at a time on a listing, and it needs no JavaScript except
 * this. It shows itself only when there is genuinely something to claim: the
 * bag has earned a gift, this candle qualifies, and nothing has been picked
 * yet. Any other moment and it renders nothing, because a tag offering what a
 * shopper cannot have is worse than no tag at all.
 *
 * It sits inside the card's <Link>, so the click has to be stopped from
 * navigating before it can claim.
 */
export function GiftRibbon({ product }: { product: Product }) {
  const { subtotal, giftSlug, setGift, ready } = useCart();
  const config = useGiftConfig();

  if (!ready || !config.enabled || !product.giftEligible || !product.inStock) return null;
  if (!giftUnlocked(config, subtotal) || giftSlug) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setGift(product.slug);
        celebrateGift();
      }}
      className="gift-shine absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-ember px-3 py-1.5 text-[0.7rem] font-medium tracking-wide text-canvas shadow-sm transition-transform hover:scale-105"
    >
      <Gift size={12} className="shrink-0" />
      Get this free
    </button>
  );
}
