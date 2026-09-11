"use client";

import Image from "next/image";
import Link from "next/link";
import { money, sizeLabel } from "@/lib/format";
import { bulkFromPrice, singlePrice } from "@/lib/pricing";
import { useBulkTiers } from "@/lib/shop-config";
import type { Product } from "@/lib/types";

/**
 * One card, one number — but the number is now where the ladder ends, shown as
 * "From ₹169", not the one-piece price it used to lead with.
 *
 * This card once deliberately refused a "from" price: a range in a browsing
 * moment read as "you are not the customer we mean". That was written for a
 * shopper buying one candle for their own shelf. The orders that actually come
 * in are for a hundred at a time, and to that buyer a card saying ₹299 quoted
 * the one price they were never going to pay. The one-piece price is still
 * there the moment the candle is opened, next to the whole ladder.
 *
 * A candle with no ladder — the mithai sets, flat-priced in tens — keeps its
 * plain price and its MRP beside it.
 *
 * The name and the price sit on their own lines rather than at two ends of a
 * flex row. Long names used to run straight into the price on a narrow phone.
 */
export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const price = singlePrice(product);
  const from = bulkFromPrice(product, useBulkTiers());

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-4/5 overflow-hidden rounded-card bg-canvas-deep">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 45vw, 30vw"
          priority={priority}
          className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045]"
        />


        {!product.inStock && (
          <span className="absolute top-3 left-3 rounded-full bg-ink/85 px-3 py-1 text-[0.7rem] tracking-wide text-canvas backdrop-blur-sm">
            Made to order
          </span>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-linear-to-t from-ink/55 to-transparent p-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="text-[0.8rem] text-canvas">View details →</span>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-display text-[0.98rem] leading-snug text-ink transition-colors group-hover:text-ember sm:text-[1.15rem]">
          {product.name}
        </h3>

        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {from ? (
            <span className="text-[0.95rem] text-ink tabular-nums sm:text-[1rem]">
              <span className="text-ink-soft">From </span>
              {money(from)}
            </span>
          ) : (
            <>
              <span className="text-[0.95rem] text-ink tabular-nums sm:text-[1rem]">{money(price)}</span>
              {product.mrp > price && (
                <span className="text-[0.78rem] text-ink-faint line-through tabular-nums sm:text-[0.82rem]">
                  {money(product.mrp)}
                </span>
              )}
            </>
          )}
        </p>

        <p className="mt-1.5 line-clamp-2 text-[0.8rem] leading-relaxed text-ink-soft sm:text-[0.875rem]">
          {product.tagline}
        </p>

        {sizeLabel(product) && (
          <p className="mt-2 text-[0.68rem] tracking-wide text-ink-faint uppercase sm:text-[0.75rem]">
            {sizeLabel(product)}
          </p>
        )}
      </div>
    </Link>
  );
}
