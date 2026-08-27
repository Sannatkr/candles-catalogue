import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Package } from "lucide-react";
import { getSettings } from "@/lib/data";
import { instagramProfileLink, money } from "@/lib/format";
import { getReceipt } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

/** Never cached: an order goes from pending to paid within seconds of landing. */
export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const [{ id }, { ref }] = await Promise.all([params, searchParams]);
  if (!ref) notFound();

  const [receipt, settings] = await Promise.all([getReceipt(id, ref), getSettings()]);
  if (!receipt) notFound();

  const paid = receipt.status !== "pending" && receipt.status !== "failed";

  return (
    <div className="mx-auto max-w-[720px] px-5 pt-12 pb-24 sm:px-8">
      <div className="flex items-start gap-4">
        <span
          className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            paid ? "bg-[#e6efe3] text-[#3d5730]" : "bg-ember-wash text-ember-deep"
          }`}
        >
          {paid ? <Check size={20} /> : <Package size={20} />}
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-[clamp(1.8rem,4vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
            {paid ? "Thank you." : "Almost there."}
          </h1>
          <p className="mt-2 text-[0.975rem] leading-relaxed text-ink-soft">
            {paid ? (
              <>
                Your order is in, {receipt.buyerName.split(" ")[0]}. We pack and dispatch within 2–4
                working days, and message you when it leaves.
              </>
            ) : (
              <>We have your details but no payment yet. If money left your account, message us.</>
            )}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-[18px] border border-line bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <div>
            <p className="eyebrow">Reference</p>
            <p className="mt-1.5 font-display text-[1.35rem] text-ink">{receipt.reference}</p>
          </div>
          <div className="text-right">
            <p className="eyebrow">Delivering to</p>
            <p className="mt-1.5 text-[0.925rem] text-ink">
              {[receipt.city, receipt.state].filter(Boolean).join(", ") || receipt.pincode}
            </p>
          </div>
        </div>

        <ul className="mt-6 space-y-4 border-t border-line pt-5">
          {receipt.items.map((item) => (
            <li key={item.slug} className="flex items-center gap-3.5">
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-canvas-deep">
                {item.image && <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.95rem] text-ink">{item.name}</span>
                <span className="block text-[0.8rem] text-ink-faint tabular-nums">
                  {item.qty} × {money(item.unitPrice)}
                </span>
              </span>
              <span className="shrink-0 text-[0.925rem] text-ink tabular-nums">{money(item.total)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-5 space-y-3 border-t border-line pt-4 text-[0.925rem]">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd className="text-ink tabular-nums">{money(receipt.subtotal)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-ink-soft">Delivery</dt>
            <dd className="text-ink tabular-nums">
              {receipt.shipping === 0 ? <span className="text-[#3d5730]">Free</span> : money(receipt.shipping)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
            <dt className="text-ink">{paid ? "Paid" : "Total"}</dt>
            <dd className="font-display text-[1.4rem] text-ink tabular-nums">{money(receipt.total)}</dd>
          </div>
        </dl>
      </div>

      <p className="mt-6 text-center text-[0.85rem] leading-relaxed text-ink-soft">
        Keep this reference. Any question about the order,{" "}
        <a
          href={instagramProfileLink(settings.instagramHandle)}
          target="_blank"
          rel="noreferrer"
          className="text-ink underline underline-offset-2"
        >
          message us on Instagram
        </a>
        .
      </p>

      <Link
        href="/products"
        className="mt-7 inline-flex w-full items-center justify-center rounded-full border border-line px-7 py-3.5 text-[0.925rem] text-ink transition-colors hover:border-ink"
      >
        Keep shopping
      </Link>
    </div>
  );
}
