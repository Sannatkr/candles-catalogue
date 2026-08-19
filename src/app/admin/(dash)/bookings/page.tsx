import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { BookingFilters } from "@/components/admin/booking-filters";
import { BookingRowTools } from "@/components/admin/booking-row-tools";
import { SOURCE_LABEL, STATUS_LABEL, STATUS_STYLE, type BookingStatus } from "@/lib/admin/booking-status";
import { isRazorpayConfigured } from "@/lib/payments/razorpay";
import { listBookings } from "@/lib/admin/queries";
import { getSettings } from "@/lib/data";
import { compactQty, money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string; from?: string; status?: string }>;
}) {
  const [{ added, from = "all", status: statusFilter = "all" }, all, settings, paymentsReady] =
    await Promise.all([searchParams, listBookings(), getSettings(), isRazorpayConfigured()]);

  const sourceCounts: Record<string, number> = { all: all.length, website: 0, manual: 0 };
  const statusCounts: Record<string, number> = { all: all.length };
  all.forEach((b) => {
    const key = b.source === "manual" ? "manual" : "website";
    sourceCounts[key] = (sourceCounts[key] ?? 0) + 1;
    statusCounts[b.status] = (statusCounts[b.status] ?? 0) + 1;
  });

  const bookings = all.filter((b) => {
    const bySource = from === "all" || (from === "manual" ? b.source === "manual" : b.source !== "manual");
    const byStatus = statusFilter === "all" || b.status === statusFilter;
    return bySource && byStatus;
  });

  const open = bookings.filter((b) => b.status === "new" || b.status === "contacted").length;
  const earned = bookings
    .filter((b) => b.status === "paid" || b.status === "fulfilled")
    .reduce((sum, b) => sum + b.totalPrice, 0);
  const filtered = bookings.length !== all.length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Orders</p>
          <h1 className="mt-3 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
            Bookings
          </h1>
          <p className="mt-2.5 text-[0.925rem] text-ink-soft">
            {all.length === 0
              ? "Nothing booked yet."
              : `${bookings.length}${filtered ? ` of ${all.length}` : ""} ${
                  bookings.length === 1 ? "order" : "orders"
                } · ${open} still to answer · ${money(earned)} collected`}
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

      {all.length > 0 && (
        <BookingFilters
          source={from}
          status={statusFilter}
          sourceCounts={sourceCounts}
          statusCounts={statusCounts}
        />
      )}

      {added && (
        <p className="mt-6 rounded-[10px] bg-[#eaf0e6] px-4 py-3 text-[0.875rem] text-[#41552f]">
          Booking added.
        </p>
      )}

      {bookings.length === 0 ? (
        <p className="mt-6 rounded-[14px] border border-dashed border-line bg-canvas p-10 text-center text-[0.925rem] text-ink-soft">
          {filtered || all.length > 0
            ? "No orders match that filter."
            : "Orders from the site land here. You can also add one yourself for anything sold offline."}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-[14px] border border-line bg-canvas">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-canvas-deep/35">
                {[
                  { label: "Candle", align: "text-left" },
                  { label: "Qty", align: "text-right" },
                  { label: "Rate", align: "text-right" },
                  { label: "Total", align: "text-right" },
                  { label: "Buyer", align: "text-left" },
                  { label: "Delivery", align: "text-left" },
                  { label: "From", align: "text-left" },
                  { label: "Status", align: "text-left" },
                  { label: "", align: "text-right" },
                ].map((col, i) => (
                  <th
                    key={col.label || i}
                    className={`px-4 py-3 text-[0.68rem] font-medium tracking-[0.12em] whitespace-nowrap text-ink-faint uppercase ${col.align} ${
                      i === 0 ? "sticky left-0 z-10 border-r border-line bg-[#f5f0e6]" : ""
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {bookings.map((b) => {
                const status = b.status as BookingStatus;
                return (
                  <tr key={b.id} className="group border-b border-line-soft align-middle transition-colors last:border-0 hover:bg-canvas-deep/25">
                    <td className="sticky left-0 z-10 border-r border-line-soft bg-canvas px-4 py-3.5 transition-colors group-hover:bg-[#f7f2e8]">
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

                    <td className="px-4 py-3.5 text-right text-[0.9rem] text-ink tabular-nums">
                      {compactQty(b.quantity)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-[0.9rem] whitespace-nowrap text-ink-soft tabular-nums">
                      {money(b.unitPrice)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-[0.9rem] font-medium whitespace-nowrap text-ink tabular-nums">
                      {money(b.totalPrice)}
                    </td>

                    <td className="max-w-[170px] px-4 py-3.5">
                      <p className="truncate text-[0.875rem] text-ink">
                        {b.buyerContact ? `@${b.buyerContact.replace(/^@/, "")}` : b.buyerName || "—"}
                      </p>
                      <p className="truncate text-[0.78rem] text-ink-faint">
                        {[b.buyerContact ? b.buyerName : null, b.phone].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </td>

                    <td className="max-w-[150px] px-4 py-3.5">
                      <p className="text-[0.875rem] text-ink tabular-nums">{b.pincode || "—"}</p>
                      {b.state && (
                        <p className="truncate text-[0.78rem] text-ink-faint" title={b.state}>
                          {b.state}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-[0.8rem] whitespace-nowrap text-ink-soft">
                      {SOURCE_LABEL[b.source] ?? b.source}
                    </td>

                    <td className="max-w-[190px] px-4 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-[0.7rem] tracking-wide whitespace-nowrap uppercase ${
                          STATUS_STYLE[status] ?? STATUS_STYLE.cancelled
                        }`}
                      >
                        {STATUS_LABEL[status] ?? b.status}
                      </span>
                      {b.note && (
                        <p className="mt-1.5 truncate text-[0.75rem] text-ink-faint" title={b.note}>
                          “{b.note}”
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <BookingRowTools booking={b} businessName={settings.businessName} paymentsReady={paymentsReady} />
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
