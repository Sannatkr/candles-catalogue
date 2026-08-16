"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { bestPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

type Sort = "curated" | "price-asc" | "price-desc" | "burn-desc";

const SORTS: { value: Sort; label: string }[] = [
  { value: "curated", label: "Our order" },
  { value: "price-asc", label: "Price: low first" },
  { value: "price-desc", label: "Price: high first" },
  { value: "burn-desc", label: "Longest burn" },
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
    if (sort === "burn-desc") sorted.sort((a, b) => b.burnTimeHours - a.burnTimeHours);
    return sorted;
  }, [products, active, query, sort, haystack]);

  return (
    <>
      <div className="mt-12 flex flex-col gap-5 border-y border-line py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex flex-wrap gap-2 px-1">
          {[{ label: "Everything", match: [] }, ...chips].map((chip) => {
            const isActive = active === chip.label || (chip.label === "Everything" && active === "all");
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => setActive(chip.label === "Everything" ? "all" : chip.label)}
                className={`rounded-full border px-4 py-2 text-[0.85rem] transition-all duration-200 ${
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex items-center">
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
            className="rounded-full border border-line bg-surface px-4 py-2.5 text-[0.875rem] text-ink focus:border-ink/40 focus:outline-none"
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
        <div className="mt-6 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 3} />
          ))}
        </div>
      )}
    </>
  );
}
