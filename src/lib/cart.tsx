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
/**
 * The chosen free candle is kept in its own key rather than as a cart line.
 * A line would have to carry a price of 0, and every total, weight and
 * quantity sum would then need to remember to skip it. A slug on the side
 * cannot be accidentally charged for, and it leaves v1 carts readable.
 */
const GIFT_KEY = "sugandha.gift.v1";

/** Stable identity for the server and for the first hydration pass. */
const EMPTY: CartLine[] = [];

const listeners = new Set<() => void>();

/**
 * useSyncExternalStore compares snapshots by identity, so this has to be a
 * cached array that only changes when the cart actually changes. Re-parsing
 * localStorage on every read would loop forever.
 */
let snapshot: CartLine[] | null = null;
let giftSnapshot: string | null | undefined;

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

function getGiftSnapshot(): string | null {
  if (giftSnapshot === undefined) {
    try {
      giftSnapshot = window.localStorage.getItem(GIFT_KEY);
    } catch {
      giftSnapshot = null;
    }
  }
  return giftSnapshot ?? null;
}

const getServerGiftSnapshot = () => null;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === GIFT_KEY) {
      giftSnapshot = event.newValue;
    } else if (event.key === KEY) {
      snapshot = parse(event.newValue);
    } else {
      return;
    }
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

function commitGift(slug: string | null) {
  giftSnapshot = slug;
  try {
    if (slug) window.localStorage.setItem(GIFT_KEY, slug);
    else window.localStorage.removeItem(GIFT_KEY);
  } catch {
    // Session-only is fine.
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
  const giftSlug = useSyncExternalStore(subscribe, getGiftSnapshot, getServerGiftSnapshot);

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

  /** Claim, swap or drop the free candle. Null clears it. */
  const setGift = useCallback((slug: string | null) => commitGift(slug), []);

  const clear = useCallback(() => {
    commitGift(null);
    commit(EMPTY);
  }, []);

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
      // Everything below counts only what is being paid for. The free candle is
      // deliberately absent: it must never help unlock itself, and it must never
      // add weight that could cancel the buyer's free delivery.
      subtotal,
      weightGrams,
      giftSlug,
      add,
      setQty,
      remove,
      setGift,
      clear,
    };
  }, [lines, ready, giftSlug, add, setQty, remove, setGift, clear]);
}
