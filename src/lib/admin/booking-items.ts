export type BookingItem = {
  slug: string;
  name: string;
  image: string | null;
  qty: number;
  unitPrice: number;
  total: number;
};

/** The fields every booking carries, whichever screen it was read on. */
type BookingLike = {
  items: BookingItem[];
  productSlug: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

const toNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/** Reads whatever the items column holds, discarding anything malformed. */
export function parseItems(value: unknown): BookingItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      slug: String(item.slug ?? ""),
      name: String(item.name ?? ""),
      image: typeof item.image === "string" ? item.image : null,
      qty: toNumber(item.qty),
      unitPrice: toNumber(item.unitPrice),
      total: toNumber(item.total),
    }))
    .filter((item) => item.slug && item.qty > 0);
}

/**
 * Every booking read as a list of lines. Orders placed before multi-candle
 * orders existed have an empty items list, so their single-candle columns are
 * read as the one line they are — no screen needs to know the difference.
 */
export function itemsOf(booking: BookingLike): BookingItem[] {
  if (booking.items.length) return booking.items;
  return [
    {
      slug: booking.productSlug,
      name: booking.productName,
      image: booking.productImage,
      qty: booking.quantity,
      unitPrice: booking.unitPrice,
      total: booking.totalPrice,
    },
  ];
}

/** "Peacock Urli Candle" on its own, "Peacock Urli Candle + 10 more" beyond that. */
export function itemsLabel(items: BookingItem[]) {
  const [first, ...rest] = items;
  if (!first) return "—";
  return rest.length ? `${first.name} + ${rest.length} more` : first.name;
}

/** Totals an order, so the summary is never out of step with its lines. */
export function itemsTotals(items: BookingItem[]) {
  return items.reduce(
    (sum, item) => ({ pieces: sum.pieces + item.qty, amount: sum.amount + item.total }),
    { pieces: 0, amount: 0 },
  );
}
