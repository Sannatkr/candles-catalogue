import { type Bucket, RevenueColumns, SourceSplit, TopProducts } from "@/components/admin/charts";
import { RangePicker } from "@/components/admin/range-picker";
import { itemsOf } from "@/lib/admin/booking-items";
import { listRevenueBookings, listRevenueOrders } from "@/lib/admin/queries";
import { compactQty, money } from "@/lib/format";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);

function resolveRange(range: string, from?: string, to?: string) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (range === "custom" && from && to) {
    return { start: new Date(`${from}T00:00:00`), end: new Date(`${to}T00:00:00`) };
  }
  if (range === "month") return { start: new Date(now.getFullYear(), now.getMonth(), 1), end };
  if (range === "year") return { start: new Date(now.getFullYear(), 0, 1), end };
  if (range === "all") return { start: new Date(2020, 0, 1), end };

  const days = range === "90d" ? 89 : range === "7d" ? 6 : 29;
  return { start: new Date(end.getTime() - days * DAY), end };
}

/** Days for a short window, weeks for a season, months for a year or more. */
function bucketise(start: Date, end: Date, rows: { paidAt: string | null; totalPrice: number }[]) {
  const span = Math.round((end.getTime() - start.getTime()) / DAY) + 1;
  const unit: "day" | "week" | "month" = span <= 45 ? "day" : span <= 200 ? "week" : "month";

  const keyOf = (d: Date) => {
    if (unit === "month") return `${d.getFullYear()}-${d.getMonth()}`;
    if (unit === "week") {
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      return iso(monday);
    }
    return iso(d);
  };

  const buckets = new Map<string, Bucket>();
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = keyOf(cursor);
    if (!buckets.has(key)) {
      buckets.set(key, {
        label:
          unit === "month"
            ? cursor.toLocaleDateString("en-IN", { month: "short" })
            : String(cursor.getDate()),
        sublabel:
          unit === "month"
            ? cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
            : unit === "week"
              ? `Week of ${cursor.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
              : cursor.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        value: 0,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  rows.forEach((row) => {
    if (!row.paidAt) return;
    const bucket = buckets.get(keyOf(new Date(row.paidAt)));
    if (bucket) bucket.value += row.totalPrice;
  });

  return [...buckets.values()];
}

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const { range = "30d", from, to } = await searchParams;
  const { start, end } = resolveRange(range, from, to);

  const endOfDay = new Date(end);
  endOfDay.setHours(23, 59, 59, 999);

  const [bookings, orders] = await Promise.all([
    listRevenueBookings(start.toISOString(), endOfDay.toISOString()),
    listRevenueOrders(start.toISOString(), endOfDay.toISOString()),
  ]);

  const enquiriesRevenue = bookings.reduce((sum, r) => sum + r.totalPrice, 0);
  const ordersRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const revenue = enquiriesRevenue + ordersRevenue;

  const pieces =
    bookings.reduce((sum, r) => sum + r.quantity, 0) +
    orders.reduce((sum, o) => sum + o.items.reduce((a, i) => a + i.qty, 0), 0);

  // Both sources, keyed on the date the money came in, for the timeline.
  const timeRows = [
    ...bookings.map((r) => ({ paidAt: r.paidAt, totalPrice: r.totalPrice })),
    ...orders.map((o) => ({ paidAt: o.paidAt, totalPrice: o.total })),
  ];

  // Best sellers combine enquiry lines and order lines.
  const byProduct = new Map<string, { name: string; value: number; qty: number }>();
  const addItem = (slug: string, name: string, value: number, qty: number) => {
    const entry = byProduct.get(slug) ?? { name, value: 0, qty: 0 };
    entry.value += value;
    entry.qty += qty;
    byProduct.set(slug, entry);
  };
  bookings.forEach((r) => itemsOf(r).forEach((i) => addItem(i.slug, i.name, i.total, i.qty)));
  orders.forEach((o) => o.items.forEach((i) => addItem(i.slug, i.name, i.total, i.qty)));
  const top = [...byProduct.values()].sort((a, b) => b.value - a.value).slice(0, 6);

  const stats = [
    { label: "Orders revenue", value: money(ordersRevenue) },
    { label: "Enquiries revenue", value: money(enquiriesRevenue) },
    { label: "Pieces sold", value: compactQty(pieces) },
  ];

  return (
    <>
      <p className="eyebrow">Money in</p>
      <h1 className="mt-3 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
        Revenue
      </h1>
      <p className="mt-2.5 text-[0.925rem] text-ink-soft">
        Paid website orders and paid/fulfilled enquiries together, on the date the money came in.
      </p>

      <div className="mt-7">
        <RangePicker range={range} from={from ?? iso(start)} to={to ?? iso(end)} />
      </div>

      {/* Hero figure */}
      <div className="mt-8 rounded-[16px] border border-line bg-canvas p-6 sm:p-7">
        <p className="eyebrow">
          {start.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} –{" "}
          {end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
        <p className="mt-2 font-sans text-[clamp(2.4rem,6vw,3.4rem)] leading-none font-semibold tracking-[-0.03em] text-ink tabular-nums">
          {money(revenue)}
        </p>

        <div className="mt-7 grid grid-cols-3 gap-4 border-t border-line pt-5">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-[0.75rem] text-ink-faint">{s.label}</p>
              <p className="mt-1 text-[1.15rem] text-ink tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="mt-4 rounded-[16px] border border-line bg-canvas p-6 sm:p-7">
        <h2 className="font-display text-[1.15rem] text-ink">Revenue over time</h2>
        <RevenueColumns buckets={bucketise(start, end, timeRows)} />
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-[16px] border border-line bg-canvas p-6 sm:p-7">
          <h2 className="font-display text-[1.15rem] text-ink">Best sellers</h2>
          <p className="mt-1 mb-6 text-[0.8rem] text-ink-faint">By money collected in this period.</p>
          <TopProducts rows={top} />
        </section>

        <section className="rounded-[16px] border border-line bg-canvas p-6 sm:p-7">
          <h2 className="font-display text-[1.15rem] text-ink">Orders vs Enquiries</h2>
          <p className="mt-1 mb-6 text-[0.8rem] text-ink-faint">
            Paid checkouts on the site against paid enquiries.
          </p>
          <SourceSplit
            website={ordersRevenue}
            manual={enquiriesRevenue}
            labelA="Orders"
            labelB="Enquiries"
          />
        </section>
      </div>
    </>
  );
}
