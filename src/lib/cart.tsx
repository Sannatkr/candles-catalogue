"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { RETAIL_MAX } from "@/lib/pricing";

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
 * Retail only. A line is capped at RETAIL_MAX because past that the buyer is
 * asking for a quote, not checking out.
 */

export type CartLine = {
  slug: string;
  name: string;
  image: string | null;
  qty: number;
  unitPrice: number;
  /** Chargeable shipping weight of one piece, in grams. Drives delivery cost. */
  packWeightGrams: number;
};

const KEY = "sugandha.cart.v1";

/** Stable identity for the server and for the first hydration pass. */
const EMPTY: CartLine[] = [];

const listeners = new Set<() => void>();

/**
 * useSyncExternalStore compares snapshots by identity, so this has to be a
 * cached array that only changes when the cart actually changes. Re-parsing
 * localStorage on every read would loop forever.
 */
let snapshot: CartLine[] | null = null;

function parse(raw: string | null): CartLine[] {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return EMPTY;
    const lines = parsed.flatMap((entry): CartLine[] => {
      if (!entry || typeof entry !== "object") return [];
      const line = entry as Partial<CartLine>;
      if (typeof line.slug !== "string" || typeof line.name !== "string") return [];
      const unitPrice = Number(line.unitPrice);
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) return [];
      const qty = Math.min(RETAIL_MAX, Math.max(1, Math.floor(Number(line.qty) || 1)));
      const packWeightGrams = Math.max(0, Math.floor(Number(line.packWeightGrams) || 0));
      return [{ slug: line.slug, name: line.name, image: line.image ?? null, qty, unitPrice, packWeightGrams }];
    });
    return lines.length ? lines : EMPTY;
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): CartLine[] {
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

function commit(next: CartLine[]) {
  snapshot = next.length ? next : EMPTY;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    // The cart still works for this session even if it cannot be persisted.
  }
  listeners.forEach((listener) => listener());
}

export function useCart() {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // False during the server render and the hydration pass, true from the first
  // client render on. Lets the badge stay blank rather than flashing a zero.
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  /**
   * Returns how many pieces actually went in. Less than asked for means a
   * ceiling was hit, and the caller has something honest to say about it
   * instead of silently adding fewer than the buyer chose.
   */
  const add = useCallback((line: Omit<CartLine, "qty">, qty: number): number => {
    const wanted = Math.max(1, Math.floor(qty));
    const current = getSnapshot();
    const existing = current.find((l) => l.slug === line.slug);

    // Only a per-design ceiling now — past it the buyer is asking for a bulk
    // quote. The bag as a whole is unbounded.
    const roomOnLine = Math.max(0, RETAIL_MAX - (existing?.qty ?? 0));
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

    if (next < 1) {
      commit(current.filter((l) => l.slug !== slug));
      return;
    }

    commit(current.map((l) => (l.slug === slug ? { ...l, qty: Math.min(RETAIL_MAX, next) } : l)));
  }, []);

  const remove = useCallback((slug: string) => {
    commit(getSnapshot().filter((l) => l.slug !== slug));
  }, []);

  const clear = useCallback(() => commit(EMPTY), []);

  return useMemo(() => {
    const count = lines.reduce((sum, l) => sum + l.qty, 0);
    const subtotal = lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
    // Delivery is worked out from weight and destination, which the cart alone
    // does not know (no pincode yet), so shipping/total are computed by the cart
    // and checkout screens from this weight — not here.
    const weightGrams = lines.reduce((sum, l) => sum + l.qty * l.packWeightGrams, 0);
    return {
      lines,
      ready,
      count,
      subtotal,
      weightGrams,
      add,
      setQty,
      remove,
      clear,
    };
  }, [lines, ready, add, setQty, remove, clear]);
}
