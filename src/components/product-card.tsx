import Image from "next/image";
import Link from "next/link";
import { bestPrice, money, sizeLabel } from "@/lib/format";
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
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-display text-[0.98rem] leading-snug text-ink transition-colors group-hover:text-ember sm:text-[1.15rem]">
            {product.name}
          </h3>
          <span className="flex shrink-0 items-baseline gap-1.5 text-[0.88rem] text-ink sm:text-[0.95rem]">
            {product.mrp > from && (
              <span className="text-[0.78rem] text-ink-faint line-through sm:text-[0.82rem]">
                {money(product.mrp)}
              </span>
            )}
            <span>
              {hasSlabs && <span className="text-ink-faint">from </span>}
              {money(from)}
            </span>
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-[0.8rem] text-ink-soft sm:text-[0.875rem]">{product.tagline}</p>
        <p className="mt-2 text-[0.68rem] tracking-wide text-ink-faint uppercase sm:text-[0.75rem]">
          {[sizeLabel(product), product.burnTimeHours ? `${product.burnTimeHours} hr burn` : ""]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
    </Link>
  );
}
