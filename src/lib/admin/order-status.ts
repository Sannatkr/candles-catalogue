export const ORDER_STATUSES = [
  "pending",
  "paid",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
  "failed",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** The happy path, in the order it actually happens. */
export const FULFILMENT_FLOW: OrderStatus[] = ["paid", "packed", "shipped", "delivered"];

/** Money that has genuinely landed. Pending is a started checkout, not a sale. */
export const PAID_STATUSES: OrderStatus[] = ["paid", "packed", "shipped", "delivered"];

/**
 * What the ⋯ menu offers as a manual move. Leaves out `pending` and `failed`,
 * which are set by the checkout itself, never by hand.
 */
export const MANAGE_STATUSES: OrderStatus[] = [
  "paid",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  failed: "Failed",
};

export const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-ember-wash text-ember-deep",
  paid: "bg-[#e6efe3] text-[#3d5730]",
  packed: "bg-[#e7ecf5] text-[#33507f]",
  shipped: "bg-[#e2ecf3] text-[#2c5568]",
  delivered: "bg-[#dfe9db] text-[#2f4623]",
  cancelled: "bg-canvas-deep text-ink-faint",
  refunded: "bg-[#f3e7e2] text-[#8a4b34]",
  failed: "bg-canvas-deep text-ink-faint",
};

/** The next step a parcel takes, or null once it is delivered or dead. */
export function nextStatus(status: string): OrderStatus | null {
  const at = FULFILMENT_FLOW.indexOf(status as OrderStatus);
  if (at === -1 || at === FULFILMENT_FLOW.length - 1) return null;
  return FULFILMENT_FLOW[at + 1];
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}
