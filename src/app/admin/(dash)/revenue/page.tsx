import { type Bucket, RevenueColumns, SourceSplit, TopProducts } from "@/components/admin/charts";
import { RangePicker } from "@/components/admin/range-picker";
import { listRevenueBookings } from "@/lib/admin/queries";
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

  const rows = await listRevenueBookings(start.toISOString(), endOfDay.toISOString());

  const revenue = rows.reduce((sum, r) => sum + r.totalPrice, 0);
  const pieces = rows.reduce((sum, r) => sum + r.quantity, 0);
  const average = rows.length ? Math.round(revenue / rows.length) : 0;

  const byProduct = new Map<string, { name: string; value: number; qty: number }>();
  rows.forEach((r) => {
    const entry = byProduct.get(r.productSlug) ?? { name: r.productName, value: 0, qty: 0 };
    entry.value += r.totalPrice;
    entry.qty += r.quantity;
    byProduct.set(r.productSlug, entry);
  });
  const top = [...byProduct.values()].sort((a, b) => b.value - a.value).slice(0, 6);

  const website = rows.filter((r) => r.source !== "manual").reduce((s, r) => s + r.totalPrice, 0);
  const manual = rows.filter((r) => r.source === "manual").reduce((s, r) => s + r.totalPrice, 0);

  const stats = [
    { label: "Orders paid", value: String(rows.length) },
    { label: "Pieces sold", value: compactQty(pieces) },
    { label: "Average order", value: money(average) },
  ];

  return (
    <>
      <p className="eyebrow">Money in</p>
      <h1 className="mt-3 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
        Revenue
      </h1>
      <p className="mt-2.5 text-[0.925rem] text-ink-soft">
        Counts every order marked Paid or Fulfilled, on the date the payment came in.
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
        <RevenueColumns buckets={bucketise(start, end, rows)} />
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-[16px] border border-line bg-canvas p-6 sm:p-7">
          <h2 className="font-display text-[1.15rem] text-ink">Best sellers</h2>
          <p className="mt-1 mb-6 text-[0.8rem] text-ink-faint">By money collected in this period.</p>
          <TopProducts rows={top} />
        </section>

        <section className="rounded-[16px] border border-line bg-canvas p-6 sm:p-7">
          <h2 className="font-display text-[1.15rem] text-ink">Where orders came from</h2>
          <p className="mt-1 mb-6 text-[0.8rem] text-ink-faint">
            Site bookings against the ones you entered yourself.
          </p>
          <SourceSplit website={website} manual={manual} />
        </section>
      </div>
    </>
  );
}
