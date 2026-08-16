import Link from "next/link";
import { ArrowRight, LayoutGrid, Package, Settings } from "lucide-react";
import { listAdminCollections, listAdminProducts } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [products, collections] = await Promise.all([listAdminProducts(), listAdminCollections()]);
  const live = products.filter((p) => p.in_stock).length;

  const stats = [
    { label: "Products", value: products.length, href: "/admin/products" },
    { label: "Ready stock", value: live, href: "/admin/products" },
    { label: "Collections", value: collections.length, href: "/admin/collections" },
  ];

  const actions = [
    {
      href: "/admin/products/new",
      icon: Package,
      title: "Add a candle",
      body: "Photos, price slabs, sizes. Live the moment you save.",
    },
    {
      href: "/admin/collections/new",
      icon: LayoutGrid,
      title: "Add a collection",
      body: "Group candles so a client can be sent just one part of the range.",
    },
    {
      href: "/admin/settings",
      icon: Settings,
      title: "Edit terms & payment",
      body: "Payment split, lead time, order size, breakage policy.",
    },
  ];

  return (
    <>
      <p className="eyebrow">Dashboard</p>
      <h1 className="mt-3 font-display text-[clamp(1.9rem,4vw,2.6rem)] leading-tight tracking-[-0.02em] text-ink">
        Everything in one place
      </h1>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-[14px] border border-line bg-canvas p-5 transition-colors hover:border-ink/25"
          >
            <p className="font-display text-[2rem] leading-none text-ink">{stat.value}</p>
            <p className="mt-2 text-[0.85rem] text-ink-soft">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col rounded-[14px] border border-line bg-canvas p-5 transition-colors hover:border-ink/25"
            >
              <Icon size={18} className="text-ember" />
              <p className="mt-4 font-display text-[1.1rem] text-ink">{action.title}</p>
              <p className="mt-1.5 flex-1 text-[0.85rem] leading-relaxed text-ink-soft">{action.body}</p>
              <ArrowRight
                size={16}
                className="mt-4 text-ink-faint transition-transform duration-300 group-hover:translate-x-1 group-hover:text-ember"
              />
            </Link>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="mt-8 rounded-[14px] border border-dashed border-line bg-canvas p-8 text-center">
          <p className="font-display text-[1.25rem] text-ink">No candles yet</p>
          <p className="mx-auto mt-2 max-w-[46ch] text-[0.9rem] leading-relaxed text-ink-soft">
            The public catalogue is empty until you add one. Add a candle and the link is ready to send.
          </p>
          <Link
            href="/admin/products/new"
            className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-[0.9rem] text-canvas transition-colors hover:bg-ember"
          >
            Add your first candle
          </Link>
        </div>
      )}
    </>
  );
}
