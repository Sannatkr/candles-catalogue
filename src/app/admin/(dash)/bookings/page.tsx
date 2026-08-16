import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { BookingRowActions } from "@/components/admin/booking-row-actions";
import { SOURCE_LABEL, STATUS_LABEL, STATUS_STYLE, type BookingStatus } from "@/lib/admin/booking-status";
import { listBookings } from "@/lib/admin/queries";
import { compactQty, money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string }>;
}) {
  const [{ added }, bookings] = await Promise.all([searchParams, listBookings()]);

  const open = bookings.filter((b) => b.status === "new" || b.status === "contacted").length;
  const earned = bookings
    .filter((b) => b.status === "paid" || b.status === "fulfilled")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Orders</p>
          <h1 className="mt-3 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
            Bookings
          </h1>
          <p className="mt-2.5 text-[0.925rem] text-ink-soft">
            {bookings.length === 0
              ? "Nothing booked yet."
              : `${bookings.length} total · ${open} still to answer · ${money(earned)} collected`}
          </p>
        </div>
        <Link
          href="/admin/bookings/new"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[0.9rem] text-canvas transition-colors hover:bg-ember"
        >
          <Plus size={16} />
          Add booking
        </Link>
      </div>

      {added && (
        <p className="mt-6 rounded-[10px] bg-[#eaf0e6] px-4 py-3 text-[0.875rem] text-[#41552f]">
          Booking added.
        </p>
      )}

      {bookings.length === 0 ? (
        <p className="mt-10 rounded-[14px] border border-dashed border-line bg-canvas p-10 text-center text-[0.925rem] text-ink-soft">
          Orders from the site land here. You can also add one yourself for anything sold offline.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-[14px] border border-line bg-canvas">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {["Candle", "Qty", "Rate", "Total", "Buyer", "Delivery", "From", "Status", ""].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-[0.7rem] font-medium tracking-[0.12em] text-ink-faint uppercase"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {bookings.map((b) => {
                const status = b.status as BookingStatus;
                return (
                  <tr key={b.id} className="border-b border-line-soft last:border-0 align-top">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[8px] bg-canvas-deep">
                          {b.productImage && (
                            <Image src={b.productImage} alt="" fill sizes="44px" className="object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[0.9rem] text-ink">{b.productName}</p>
                          <p className="text-[0.75rem] text-ink-faint">
                            {new Date(b.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                            {b.fragrance && ` · ${b.fragrance}`}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-[0.9rem] text-ink">{compactQty(b.quantity)}</td>
                    <td className="px-4 py-3.5 text-[0.9rem] text-ink-soft">{money(b.unitPrice)}</td>
                    <td className="px-4 py-3.5 text-[0.9rem] font-medium text-ink">{money(b.totalPrice)}</td>

                    <td className="px-4 py-3.5">
                      <p className="text-[0.875rem] text-ink">{b.buyerName || "—"}</p>
                      <p className="text-[0.78rem] text-ink-faint">{b.buyerContact || "—"}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="text-[0.875rem] text-ink">{b.pincode || "—"}</p>
                      {b.state && <p className="text-[0.78rem] text-ink-faint">{b.state}</p>}
                    </td>

                    <td className="px-4 py-3.5 text-[0.8rem] text-ink-soft">
                      {SOURCE_LABEL[b.source] ?? b.source}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-[0.7rem] tracking-wide uppercase ${
                          STATUS_STYLE[status] ?? STATUS_STYLE.cancelled
                        }`}
                      >
                        {STATUS_LABEL[status] ?? b.status}
                      </span>
                      {b.note && (
                        <p className="mt-1.5 max-w-[200px] text-[0.75rem] text-ink-faint">“{b.note}”</p>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <BookingRowActions id={b.id} status={status} label={b.productName} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
