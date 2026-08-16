export const BOOKING_STATUSES = ["new", "contacted", "paid", "fulfilled", "cancelled"] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** A booking counts towards revenue once the money has actually come in. */
export const REVENUE_STATUSES: BookingStatus[] = ["paid", "fulfilled"];

export const STATUS_LABEL: Record<BookingStatus, string> = {
  new: "New",
  contacted: "Contacted",
  paid: "Paid",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

export const STATUS_STYLE: Record<BookingStatus, string> = {
  new: "bg-ember-wash text-ember-deep",
  contacted: "bg-[#e7ecf5] text-[#33507f]",
  paid: "bg-[#e6efe3] text-[#3d5730]",
  fulfilled: "bg-[#dfe9db] text-[#2f4623]",
  cancelled: "bg-canvas-deep text-ink-faint",
};

export const SOURCE_LABEL: Record<string, string> = {
  website: "Website",
  manual: "Added by you",
};

export function isBookingStatus(value: string): value is BookingStatus {
  return (BOOKING_STATUSES as readonly string[]).includes(value);
}
