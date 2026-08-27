"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

/**
 * The bag in the header. The count is deliberately hidden until localStorage
 * has been read: rendering 0 first and correcting it a frame later reads as a
 * glitch on every single page load.
 */
export function CartButton({ className = "" }: { className?: string }) {
  const { count, ready } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={count ? `Bag, ${count} ${count === 1 ? "piece" : "pieces"}` : "Bag"}
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-canvas-deep ${className}`}
    >
      <ShoppingBag size={19} />
      {ready && count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ember px-1 text-[0.65rem] font-medium text-canvas tabular-nums">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
