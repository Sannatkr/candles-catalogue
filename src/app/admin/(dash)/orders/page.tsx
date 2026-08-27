import Link from "next/link";
import { Package } from "lucide-react";
import { ORDER_GRID, OrderRow } from "@/components/admin/order-row";
import { PAID_STATUSES, type OrderStatus } from "@/lib/admin/order-status";
import { listOrders } from "@/lib/admin/queries";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

const FILTERS: { key: string; label: string }[] = [
  { key: "open", label: "To ship" },
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "pending", label: "Unpaid" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const [{ view = "open" }, all] = await Promise.all([searchParams, listOrders()]);

  if (all === null) {
    return (
      <>
        <p className="eyebrow">Shop</p>
        <h1 className="mt-3 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
          Orders
        </h1>
        <div className="mt-8 rounded-[16px] border border-ember/40 bg-ember-wash px-6 py-8">
          <p className="font-display text-[1.15rem] text-ember-deep">The orders table is not there yet</p>
          <p className="mt-2 max-w-[60ch] text-[0.9rem] leading-relaxed text-ember-deep">
            Open Supabase → SQL Editor, paste in{" "}
            <code className="rounded bg-canvas px-1.5 py-0.5 text-[0.85em]">supabase/013-orders.sql</code>{" "}
            and press Run. This page fills itself in after that.
          </p>
        </div>
      </>
    );
  }

  const counts: Record<string, number> = {
    all: all.length,
    open: all.filter((o) => o.status === "paid" || o.status === "packed").length,
  };
  all.forEach((o) => {
    counts[o.status] = (counts[o.status] ?? 0) + 1;
  });

  const orders = all.filter((o) => {
    if (view === "all") return true;
    if (view === "open") return o.status === "paid" || o.status === "packed";
    return o.status === view;
  });

  const collected = all
    .filter((o) => PAID_STATUSES.includes(o.status as OrderStatus))
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Shop</p>
          <h1 className="mt-3 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
            Orders
          </h1>
          <p className="mt-2.5 text-[0.925rem] text-ink-soft">
            {all.length === 0
              ? "Nobody has checked out yet."
              : `${counts.open} to ship · ${money(collected)} collected across ${
                  all.filter((o) => PAID_STATUSES.includes(o.status as OrderStatus)).length
                } paid orders`}
          </p>
        </div>
        <Link
          href="/admin/bookings"
          className="rounded-full border border-line px-5 py-2.5 text-[0.875rem] text-ink-soft transition-colors hover:border-ink hover:text-ink"
        >
          Enquiries instead →
        </Link>
      </div>

      {/* Filters */}
      <div className="-mx-1 mt-7 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((filter) => {
          const count = counts[filter.key] ?? 0;
          const active = view === filter.key;
          return (
            <Link
              key={filter.key}
              href={`/admin/orders?view=${filter.key}`}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[0.85rem] whitespace-nowrap transition-colors ${
                active
                  ? "border-ink bg-ink text-canvas"
                  : "border-line text-ink-soft hover:border-ink/40 hover:text-ink"
              }`}
            >
              {filter.label}
              <span className={active ? "text-canvas/70" : "text-ink-faint"}>{count}</span>
            </Link>
          );
        })}
      </div>

      {/* The table */}
      <div className="mt-6">
        {orders.length === 0 ? (
          <div className="rounded-[16px] border border-line bg-canvas px-6 py-16 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-canvas-deep text-ink-faint">
              <Package size={20} />
            </span>
            <p className="mt-4 text-[0.95rem] text-ink-soft">Nothing here under this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[14px] border border-line bg-canvas">
            <div className="min-w-[760px]">
              {/* Header */}
              <div
                style={{ gridTemplateColumns: ORDER_GRID }}
                className="grid items-center gap-4 border-b border-line bg-canvas-deep/35 px-5 py-3 text-[0.68rem] font-medium tracking-[0.12em] text-ink-faint uppercase"
              >
                <span>Order</span>
                <span className="text-right">Items</span>
                <span>Destination</span>
                <span>Placed</span>
                <span className="text-right">Total</span>
                <span>Status</span>
                <span aria-hidden />
              </div>

              {/* Rows */}
              {orders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
