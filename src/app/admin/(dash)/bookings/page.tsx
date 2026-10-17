import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { BookingFilters } from "@/components/admin/booking-filters";
import { BookingRow } from "@/components/admin/booking-row";
import { ChipsSkeleton, Skeleton, TableSkeleton } from "@/components/admin/skeleton";
import { isRazorpayConfigured } from "@/lib/payments/razorpay";
import { listBookings } from "@/lib/admin/queries";
import { getProducts, getSettings } from "@/lib/data";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = { added?: string; edit?: string; from?: string; status?: string };

/**
 * The heading and the Add button paint at once; the counts and the table
 * stream in. A filter change re-keys the Suspense so the skeleton shows
 * again instead of the old rows sitting there looking stuck.
 */
export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const { added, edit, from = "all", status: statusFilter = "all" } = params;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Enquiries</p>
          <h1 className="mt-3 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
            Bookings
          </h1>
          <Suspense fallback={<Skeleton className="mt-3.5 h-3.5 w-80 max-w-full" />}>
            <Summary from={from} status={statusFilter} />
          </Suspense>
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
        <p className="mt-6 rounded-[10px] bg-[#eaf0e6] px-4 py-3 text-[0.875rem] text-[#41552f]">Booking added.</p>
      )}
      {edit && (
        <p className="mt-6 rounded-[10px] bg-ember-wash px-4 py-3 text-[0.875rem] text-ember-deep">
          Copy made. It is highlighted below and open for editing.
        </p>
      )}

      <Suspense
        key={`${from}|${statusFilter}`}
        fallback={
          <>
            <div className="mt-8 rounded-[14px] border border-line bg-canvas px-4 py-4">
              <ChipsSkeleton count={4} />
            </div>
            <div className="mt-6">
              <TableSkeleton rows={7} />
            </div>
          </>
        }
      >
        <BookingsTable from={from} status={statusFilter} edit={edit} />
      </Suspense>
    </>
  );
}

function filterAll<T extends { source: string; status: string }>(all: T[], from: string, status: string) {
  return all.filter((b) => {
    const bySource = from === "all" || (from === "manual" ? b.source === "manual" : b.source !== "manual");
    const byStatus = status === "all" || b.status === status;
    return bySource && byStatus;
  });
}

async function Summary({ from, status }: { from: string; status: string }) {
  const all = await listBookings();
  const bookings = filterAll(all, from, status);
  const open = bookings.filter((b) => b.status === "new" || b.status === "contacted").length;
  const earned = bookings
    .filter((b) => b.status === "paid" || b.status === "fulfilled")
    .reduce((sum, b) => sum + b.totalPrice, 0);
  const filtered = bookings.length !== all.length;

  return (
    <p className="mt-2.5 text-[0.925rem] text-ink-soft">
      {all.length === 0
        ? "Nothing booked yet."
        : `${bookings.length}${filtered ? ` of ${all.length}` : ""} ${
            bookings.length === 1 ? "order" : "orders"
          } · ${open} still to answer · ${money(earned)} collected`}
    </p>
  );
}

async function BookingsTable({ from, status, edit }: { from: string; status: string; edit?: string }) {
  const [all, settings, paymentsReady, products] = await Promise.all([
    listBookings(),
    getSettings(),
    isRazorpayConfigured(),
    getProducts(),
  ]);

  const sourceCounts: Record<string, number> = { all: all.length, website: 0, manual: 0 };
  const statusCounts: Record<string, number> = { all: all.length };
  all.forEach((b) => {
    const key = b.source === "manual" ? "manual" : "website";
    sourceCounts[key] = (sourceCounts[key] ?? 0) + 1;
    statusCounts[b.status] = (statusCounts[b.status] ?? 0) + 1;
  });

  const bookings = filterAll(all, from, status);

  const columns = [
    { label: "Candle", align: "text-left" },
    { label: "Qty", align: "text-right" },
    { label: "Rate", align: "text-right" },
    { label: "Total", align: "text-right" },
    { label: "Buyer", align: "text-left" },
    { label: "Delivery", align: "text-left" },
    { label: "From", align: "text-left" },
    { label: "Status", align: "text-left" },
    { label: "", align: "text-right" },
  ];

  if (all.length === 0) {
    return (
      <p className="mt-8 rounded-[14px] border border-dashed border-line bg-canvas p-10 text-center text-[0.925rem] text-ink-soft">
        Orders from the site land here. You can also add one yourself for anything sold offline.
      </p>
    );
  }

  return (
    <>
      <div className="mt-8">
        <BookingFilters source={from} status={status} sourceCounts={sourceCounts} statusCounts={statusCounts} />
      </div>

      {bookings.length === 0 ? (
        <p className="mt-6 rounded-[14px] border border-dashed border-line bg-canvas p-10 text-center text-[0.925rem] text-ink-soft">
          No orders match that filter.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-[14px] border border-line bg-canvas">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-canvas-deep/35">
                {columns.map((col, i) => (
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
              {bookings.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  businessName={settings.businessName}
                  paymentsReady={paymentsReady}
                  products={products}
                  autoEdit={edit === b.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
