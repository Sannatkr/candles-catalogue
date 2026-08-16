"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export type Tier = { minQty: number; price: number };

export function PriceTiers({ name, initial }: { name: string; initial: Tier[] }) {
  const [tiers, setTiers] = useState<Tier[]>(initial.length ? initial : [{ minQty: 1, price: 0 }]);

  const update = (i: number, patch: Partial<Tier>) =>
    setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));

  return (
    <div>
      <p className="text-[0.8rem] font-medium text-ink">Price slabs</p>
      <p className="mt-0.5 text-[0.75rem] text-ink-faint">
        Price per piece at each quantity. Start at 1 for the single-piece rate; add rows only if you
        discount on volume.
      </p>

      <input type="hidden" name={name} value={JSON.stringify(tiers)} readOnly />

      <div className="mt-3 space-y-2">
        {tiers.map((tier, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-[10px] border border-line bg-surface px-3 py-2">
              <span className="text-[0.75rem] text-ink-faint">From</span>
              <input
                type="number"
                min={1}
                value={tier.minQty || ""}
                onChange={(e) => update(i, { minQty: Number(e.target.value) })}
                className="w-24 bg-transparent text-[0.9rem] text-ink focus:outline-none"
              />
              <span className="text-[0.75rem] text-ink-faint">pcs</span>
            </div>

            <div className="flex flex-1 items-center gap-2 rounded-[10px] border border-line bg-surface px-3 py-2">
              <span className="text-[0.9rem] text-ink-faint">₹</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={tier.price || ""}
                onChange={(e) => update(i, { price: Number(e.target.value) })}
                className="w-24 bg-transparent text-[0.9rem] text-ink focus:outline-none"
              />
              <span className="text-[0.75rem] text-ink-faint">each</span>
            </div>

            <button
              type="button"
              onClick={() => setTiers((prev) => prev.filter((_, idx) => idx !== i))}
              disabled={tiers.length === 1}
              aria-label="Remove slab"
              className="rounded-full p-2 text-ink-faint transition-colors hover:text-ember-deep disabled:opacity-30"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          setTiers((prev) => [
            ...prev,
            { minQty: (prev.at(-1)?.minQty ?? 100) * 5, price: prev.at(-1)?.price ?? 0 },
          ])
        }
        className="mt-3 inline-flex items-center gap-1.5 text-[0.85rem] text-ember transition-colors hover:text-ember-deep"
      >
        <Plus size={15} />
        Add another slab
      </button>
    </div>
  );
}
