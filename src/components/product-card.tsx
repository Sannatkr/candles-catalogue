import Image from "next/image";
import Link from "next/link";
import { bestPrice, money } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const from = bestPrice(product);
  const hasSlabs = product.priceTiers.length > 1;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-4/5 overflow-hidden rounded-card bg-canvas-deep">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
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
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-display text-[1.15rem] leading-snug text-ink transition-colors group-hover:text-ember">
            {product.name}
          </h3>
          <span className="shrink-0 text-[0.95rem] text-ink">
            {hasSlabs && <span className="text-ink-faint">from </span>}
            {money(from)}
          </span>
        </div>
        <p className="mt-1 text-[0.875rem] text-ink-soft">{product.tagline}</p>
        <p className="mt-2.5 text-[0.75rem] tracking-wide text-ink-faint uppercase">
          {product.heightCm}×{product.diameterCm} cm · {product.burnTimeHours} hr burn
        </p>
      </div>
    </Link>
  );
}
