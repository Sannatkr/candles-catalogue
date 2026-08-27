import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, Truck } from "lucide-react";
import { getCustomer, getMyOrders, signOutCustomer } from "@/lib/account";
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE, type OrderStatus } from "@/lib/admin/order-status";
import { money } from "@/lib/format";

export const metadata: Metadata = {
  title: "Your orders",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

function when(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default async function AccountPage() {
  const customer = await getCustomer();
  if (!customer) redirect("/account/login?next=%2Faccount");

  const orders = await getMyOrders();

  return (
    <div className="mx-auto max-w-[720px] px-5 pt-12 pb-24 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[clamp(1.9rem,4vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
            Your orders
          </h1>
          <p className="mt-2 truncate text-[0.9rem] text-ink-soft">{customer.email}</p>
        </div>
        <form action={signOutCustomer}>
          <button
            type="submit"
            className="rounded-full border border-line px-5 py-2.5 text-[0.85rem] text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            Sign out
          </button>
        </form>
      </div>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-[18px] border border-line bg-surface px-6 py-16 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-canvas-deep text-ink-faint">
            <Package size={22} />
          </span>
          <p className="mt-5 font-display text-[1.3rem] text-ink">Nothing here yet</p>
          <p className="mx-auto mt-2 max-w-[38ch] text-[0.925rem] leading-relaxed text-ink-soft">
            Orders you place with this email address show up here on their own — including any you
            placed before signing in.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-ink px-7 py-3.5 text-[0.925rem] text-canvas transition-colors hover:bg-ember"
          >
            Browse the range
          </Link>
        </div>
      ) : (
        <ul className="mt-9 space-y-4">
          {orders.map((order) => {
            const status = order.status as OrderStatus;
            const pieces = order.items.reduce((sum, i) => sum + i.qty, 0);

            return (
              <li key={order.id} className="rounded-[18px] border border-line bg-surface p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                      <span className="font-display text-[1.1rem] text-ink">{order.reference}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[0.7rem] whitespace-nowrap ${ORDER_STATUS_STYLE[status] ?? ""}`}
                      >
                        {ORDER_STATUS_LABEL[status] ?? order.status}
                      </span>
                    </p>
                    <p className="mt-1.5 text-[0.82rem] text-ink-faint">
                      {when(order.createdAt)} · {pieces} {pieces === 1 ? "piece" : "pieces"}
                    </p>
                  </div>
                  <span className="font-display text-[1.2rem] text-ink tabular-nums">
                    {money(order.total)}
                  </span>
                </div>

                <ul className="mt-5 space-y-3 border-t border-line-soft pt-4">
                  {order.items.map((item) => (
                    <li key={item.slug} className="flex items-center gap-3.5">
                      <Link
                        href={`/products/${item.slug}`}
                        className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-canvas-deep"
                      >
                        {item.image && (
                          <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />
                        )}
                      </Link>
                      <span className="min-w-0 flex-1">
                        <Link
                          href={`/products/${item.slug}`}
                          className="block truncate text-[0.9rem] text-ink transition-colors hover:text-ember"
                        >
                          {item.name}
                        </Link>
                        <span className="block text-[0.78rem] text-ink-faint tabular-nums">
                          {item.qty} × {money(item.unitPrice)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>

                {order.trackingNumber && (
                  <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line-soft pt-4 text-[0.85rem] text-ink-soft">
                    <Truck size={15} className="shrink-0 text-ember" />
                    {order.carrier ? `${order.carrier} · ` : ""}
                    {order.trackingUrl ? (
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ink underline underline-offset-2"
                      >
                        {order.trackingNumber}
                      </a>
                    ) : (
                      <span className="text-ink">{order.trackingNumber}</span>
                    )}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
