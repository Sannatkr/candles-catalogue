"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { MAX_ONLINE_QTY, unitPriceAt } from "@/lib/pricing";
import { useBulkTiers } from "@/lib/shop-config";

/**
 * The cart lives in localStorage, not the database. Nobody has an account, so
 * there is nothing to tie a server-side cart to, and a buyer who closes the tab
 * should still find their candles there tomorrow.
 *
 * localStorage is an external store, so it is read through useSyncExternalStore
 * rather than copied into state inside an effect. That gets three things for
 * free: no flash of an empty cart, no cascading render on mount, and a second
 * tab staying in step — which is a real case when someone opens two candles
 * side by side.
 *
 * What a line stores is the *base* price, not the price paid. The price paid
 * depends on how many are in the line — the bulk ladder — so it is worked out
 * on every read against the current ladder rather than frozen at the moment the
 * candle was added. A stale price in localStorage would otherwise survive a
 * change to the slabs for as long as the buyer left the tab open. The server
 * recomputes all of it again at checkout regardless; this is only what the
 * buyer sees.
 *
 * Every line is capped at its own candle's ceiling, because past that the buyer
 * is asking for a quote, not checking out.
 */

/** What is written to localStorage. Prices are derived, never stored. */
export type StoredLine = {
  slug: string;
  name: string;
  image: string | null;
  qty: number;
  /** Price per piece at one. The slabs cut down from here. */
  basePrice: number;
  /** Chargeable shipping weight of one piece, in grams. Drives delivery cost. */
  packWeightGrams: number;
  /** Sold in sets of this many. 1 for most candles; 10 for the mithai. */
  minQty: number;
  /** The most of this design that may be bought online. 0 = the site-wide one. */
  maxQty: number;
  /** How many of this design earn free delivery. 0 = never. */
  freeShipQty: number;
  /** Do the quantity slabs apply to it? */
  bulkPricing: boolean;
  /** Hand-set rung prices, keyed by rung quantity. Usually empty. */
  tierPrices: Record<string, number>;
};

/** A line as the screens see it, with the price this quantity actually earns. */
export type CartLine = StoredLine & { unitPrice: number };

const KEY = "sugandha.cart.v1";

/** Stable identity for the server and for the first hydration pass. */
const EMPTY: StoredLine[] = [];

const listeners = new Set<() => void>();

/**
 * useSyncExternalStore compares snapshots by identity, so this has to be a
 * cached array that only changes when the cart actually changes. Re-parsing
 * localStorage on every read would loop forever.
 */
let snapshot: StoredLine[] | null = null;

/** This line's own ceiling, or the site-wide one for a candle without one. */
function capOf(line: { maxQty: number; minQty: number }) {
  const cap = line.maxQty > 0 ? line.maxQty : MAX_ONLINE_QTY;
  return Math.max(1, line.minQty, cap);
}

function parse(raw: string | null): StoredLine[] {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return EMPTY;
    const lines = parsed.flatMap((entry): StoredLine[] => {
      if (!entry || typeof entry !== "object") return [];
      const line = entry as Partial<StoredLine> & { unitPrice?: number };
      if (typeof line.slug !== "string" || typeof line.name !== "string") return [];
      // Carts saved before the slabs came back hold unitPrice and no basePrice.
      // They were all saved at the one-piece rate, so it is the base price.
      const basePrice = Number(line.basePrice ?? line.unitPrice);
      if (!Number.isFinite(basePrice) || basePrice <= 0) return [];
      const packWeightGrams = Math.max(0, Math.floor(Number(line.packWeightGrams) || 0));
      // Carts saved before sets existed have no minQty; they were all singles.
      const minQty = Math.max(1, Math.floor(Number(line.minQty) || 1));
      const maxQty = Math.max(0, Math.floor(Number(line.maxQty) || 0));
      const freeShipQty = Math.max(0, Math.floor(Number(line.freeShipQty) || 0));
      const qty = Math.min(
        capOf({ maxQty, minQty }),
        Math.max(1, Math.floor(Number(line.qty) || 1)),
      );
      return [
        {
          slug: line.slug,
          name: line.name,
          image: line.image ?? null,
          qty,
          basePrice,
          packWeightGrams,
          minQty,
          maxQty,
          freeShipQty,
          bulkPricing: line.bulkPricing ?? true,
          tierPrices:
            line.tierPrices && typeof line.tierPrices === "object" ? line.tierPrices : {},
        },
      ];
    });
    return lines.length ? lines : EMPTY;
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): StoredLine[] {
  if (snapshot === null) {
    try {
      snapshot = parse(window.localStorage.getItem(KEY));
    } catch {
      // Private browsing with storage switched off.
      snapshot = EMPTY;
    }
  }
  return snapshot;
}

const getServerSnapshot = () => EMPTY;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY) return;
    snapshot = parse(event.newValue);
    listeners.forEach((listener) => listener());
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function commit(next: StoredLine[]) {
  snapshot = next.length ? next : EMPTY;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    // The cart still works for this session even if it cannot be persisted.
  }
  listeners.forEach((listener) => listener());
}

export function useCart() {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // False during the server render and the hydration pass, true from the first
  // client render on. Lets the badge stay blank rather than flashing a zero.
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const tiers = useBulkTiers();

  /**
   * Returns how many pieces actually went in. Less than asked for means a
   * ceiling was hit, and the caller has something honest to say about it
   * instead of silently adding fewer than the buyer chose.
   */
  const add = useCallback((line: Omit<StoredLine, "qty">, qty: number): number => {
    const wanted = Math.max(1, Math.floor(qty));
    const current = getSnapshot();
    const existing = current.find((l) => l.slug === line.slug);

    // Only a per-design ceiling, and it is the candle's own — a peacock urli
    // stops at 7 where a mithai set goes to 300. The bag as a whole is
    // unbounded.
    const roomOnLine = Math.max(0, capOf(line) - (existing?.qty ?? 0));
    const added = Math.min(wanted, roomOnLine);
    if (added === 0) return 0;

    commit(
      existing
        ? current.map((l) => (l.slug === line.slug ? { ...l, ...line, qty: l.qty + added } : l))
        : [...current, { ...line, qty: added }],
    );
    return added;
  }, []);

  const setQty = useCallback((slug: string, qty: number) => {
    const next = Math.floor(qty);
    const current = getSnapshot();
    const line = current.find((l) => l.slug === slug);
    if (!line) return;

    // Stepping below the minimum takes the line out. A set of ten cannot
    // become a set of six, and one fewer than a single is none.
    if (next < Math.max(1, line.minQty)) {
      commit(current.filter((l) => l.slug !== slug));
      return;
    }

    commit(current.map((l) => (l.slug === slug ? { ...l, qty: Math.min(capOf(l), next) } : l)));
  }, []);

  const remove = useCallback((slug: string) => {
    commit(getSnapshot().filter((l) => l.slug !== slug));
  }, []);

  const clear = useCallback(() => commit(EMPTY), []);

  return useMemo(() => {
    // The slab rate for the quantity each line actually holds.
    const lines: CartLine[] = stored.map((l) => ({
      ...l,
      unitPrice: unitPriceAt(l, tiers, l.qty),
    }));
    const count = lines.reduce((sum, l) => sum + l.qty, 0);
    const subtotal = lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
    // What the same bag would have cost with no slabs — the saving to show.
    const beforeBulk = lines.reduce((sum, l) => sum + l.qty * l.basePrice, 0);
    // Delivery is worked out from weight and destination, which the cart alone
    // does not know (no pincode yet), so shipping/total are computed by the cart
    // and checkout screens from this weight — not here.
    const weightGrams = lines.reduce((sum, l) => sum + l.qty * l.packWeightGrams, 0);
    return {
      lines,
      ready,
      count,
      subtotal,
      beforeBulk,
      bulkSaving: Math.max(0, beforeBulk - subtotal),
      weightGrams,
      add,
      setQty,
      remove,
      clear,
    };
  }, [stored, tiers, ready, add, setQty, remove, clear]);
}
