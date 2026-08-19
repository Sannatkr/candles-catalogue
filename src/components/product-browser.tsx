"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { bestPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

type Sort = "curated" | "price-asc" | "price-desc";

const SORTS: { value: Sort; label: string }[] = [
  { value: "curated", label: "Our order" },
  { value: "price-asc", label: "Price: low first" },
  { value: "price-desc", label: "Price: high first" },
];

/**
 * The chips a buyer actually thinks in. Each maps to keywords on the products,
 * so adding a keyword in the admin is enough to put a candle under a chip.
 */
const FILTERS: { label: string; match: string[] }[] = [
  { label: "Urli & brass", match: ["urli", "brass"] },
  { label: "Lotus", match: ["lotus"] },
  { label: "Diya", match: ["diya"] },
  { label: "Gift boxes", match: ["gift box", "set", "return gift"] },
  { label: "Pooja", match: ["pooja", "temple", "auspicious", "traditional"] },
  { label: "Wedding", match: ["wedding", "event", "decor"] },
  { label: "Corporate", match: ["corporate", "hamper", "housewarming"] },
  { label: "Novelty", match: ["novelty", "dessert", "mithai", "poker", "cards"] },
];

export function ProductBrowser({ products }: { products: Product[] }) {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("curated");

  const haystack = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) =>
      map.set(
        p.id,
        [p.name, p.tagline, p.description, p.fragrance, p.waxType, ...p.keywords]
          .join(" ")
          .toLowerCase(),
      ),
    );
    return map;
  }, [products]);

  // Only offer a chip if something actually sits under it.
  const chips = useMemo(
    () =>
      FILTERS.filter((f) =>
        products.some((p) => f.match.some((m) => (haystack.get(p.id) ?? "").includes(m))),
      ),
    [products, haystack],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filter = FILTERS.find((f) => f.label === active);

    const filtered = products.filter((p) => {
      const text = haystack.get(p.id) ?? "";
      if (filter && !filter.match.some((m) => text.includes(m))) return false;
      return !q || text.includes(q);
    });

    const sorted = [...filtered];
    if (sort === "price-asc") sorted.sort((a, b) => bestPrice(a) - bestPrice(b));
    if (sort === "price-desc") sorted.sort((a, b) => bestPrice(b) - bestPrice(a));
    return sorted;
  }, [products, active, query, sort, haystack]);

  return (
    <>
      <div className="mt-8 flex flex-col gap-4 border-y border-line py-5 sm:mt-12 sm:gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-5 flex snap-x gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          {[{ label: "Everything", match: [] }, ...chips].map((chip) => {
            const isActive = active === chip.label || (chip.label === "Everything" && active === "all");
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => setActive(chip.label === "Everything" ? "all" : chip.label)}
                className={`shrink-0 snap-start rounded-full border px-4 py-2 text-[0.85rem] transition-all duration-200 ${
                  isActive
                    ? "border-ink bg-ink text-canvas"
                    : "border-line text-ink-soft hover:border-ink/40 hover:text-ink"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <label className="relative flex min-w-0 flex-1 items-center sm:flex-none">
            <Search size={16} className="pointer-events-none absolute left-3.5 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="lotus, diwali, mogra…"
              className="w-full rounded-full border border-line bg-surface py-2.5 pr-4 pl-10 text-[0.875rem] text-ink placeholder:text-ink-faint focus:border-ink/40 focus:outline-none sm:w-60"
            />
          </label>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="shrink-0 rounded-full border border-line bg-surface px-3.5 py-2.5 text-[0.875rem] text-ink focus:border-ink/40 focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-6 text-[0.8rem] tracking-wide text-ink-faint uppercase">
        {visible.length} {visible.length === 1 ? "design" : "designs"}
      </p>

      {visible.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-display text-2xl text-ink">Nothing matched that.</p>
          <p className="mt-2 text-[0.95rem] text-ink-soft">Try a shorter word, or clear the search.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActive("all");
            }}
            className="mt-6 rounded-full border border-line px-6 py-2.5 text-[0.875rem] text-ink transition-colors hover:border-ink"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-3">
          {visible.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 3} />
          ))}
        </div>
      )}
    </>
  );
}
