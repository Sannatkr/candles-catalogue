"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, X } from "lucide-react";
import { InstagramIcon } from "@/components/instagram-icon";
import { SOURCE_LABEL, STATUS_LABEL, type BookingStatus } from "@/lib/admin/booking-status";
import type { AdminBooking } from "@/lib/admin/queries";
import { compactQty, instagramChatLink, isValidInstagramHandle, money, onMobileDevice } from "@/lib/format";

/** Matches the advance stated on the Terms page; overridable per order. */
const DEFAULT_ADVANCE = 65;
const PRESETS = [50, 65, 100];

/** True once the money is in, which changes what there is left to say. */
function isSettled(status: string) {
  return status === "paid" || status === "fulfilled";
}

/**
 * Replies for where the order actually stands. Asking someone who has already
 * paid to confirm and await a QR reads badly, so a settled order gets a
 * different set entirely.
 */
function templates(b: AdminBooking, businessName: string, advancePct: number) {
  const who = b.buyerName ? b.buyerName.split(" ")[0] : "there";
  const ref = b.id.slice(0, 8).toUpperCase();
  const line = `${b.productName} × ${compactQty(b.quantity)} at ${money(b.unitPrice)} each = ${money(b.totalPrice)}`;
  const where = [b.pincode, b.state].filter(Boolean).join(", ");

  if (isSettled(b.status)) {
    return [
      {
        key: "received",
        label: "Payment received",
        body: [
          `Hi ${who}, payment received — thank you.`,
          ``,
          line,
          b.fragrance ? `Fragrance: ${b.fragrance}` : null,
          where ? `Delivery: ${where}` : null,
          `Reference: ${ref}`,
          ``,
          `Your order is confirmed and going into production. I will share photographs before it goes out.`,
        ]
          .filter((l) => l !== null)
          .join("\n"),
      },
      {
        key: "ready",
        label: "Ready to dispatch",
        body: [
          `Hi ${who}, your order is ready.`,
          ``,
          line,
          `Reference: ${ref}`,
          ``,
          `Sharing photographs now.`,
          where
            ? `Confirm this is the right address and it goes out today: ${where}`
            : `Send me the delivery address and it goes out today.`,
        ].join("\n"),
      },
      {
        key: "sent",
        label: "Dispatched",
        body: [
          `Hi ${who}, your order is on its way.`,
          ``,
          line,
          `Reference: ${ref}`,
          ``,
          `Tracking: `,
          ``,
          `Usually 3 to 5 days. Do send a photo once it is lit — I love seeing where they end up.`,
        ].join("\n"),
      },
    ];
  }

  const pct = Math.min(100, Math.max(1, Math.round(advancePct)));
  const advance = Math.round((b.totalPrice * pct) / 100);
  const balance = b.totalPrice - advance;

  const payment =
    pct >= 100
      ? [`Payment:`, `Full amount before dispatch: ${money(b.totalPrice)}`]
      : [
          `Payment:`,
          `Advance to start production (${pct}%): ${money(advance)}`,
          `Balance before dispatch: ${money(balance)}`,
        ];

  return [
    {
      key: "confirm",
      label: "Confirm the order",
      body: [
        `Hi ${who}, thanks for booking with ${businessName}.`,
        ``,
        `Here is what we have:`,
        line,
        b.fragrance ? `Fragrance: ${b.fragrance}` : null,
        where ? `Delivery: ${where}` : null,
        `Reference: ${ref}`,
        ``,
        ...payment,
        ``,
        `Shall I confirm this? Once you say yes I will send the payment QR.`,
      ]
        .filter((l) => l !== null)
        .join("\n"),
    },
    {
      key: "payment",
      label: "Send payment details",
      body: [
        `Confirmed, ${who} — thank you.`,
        ``,
        line,
        ``,
        ...payment,
        ``,
        `Sending the payment QR next. Once it is through we begin pouring, and I will share photographs before dispatch.`,
      ].join("\n"),
    },
    {
      key: "dispatch",
      label: "Ready to dispatch",
      body: [
        `Hi ${who}, your order is ready.`,
        ``,
        line,
        `Reference: ${ref}`,
        ``,
        pct >= 100
          ? `Sharing photographs now. Payment is due before dispatch — shall I send the QR?`
          : `Sharing photographs now. The balance of ${money(balance)} is due before dispatch — shall I send the QR?`,
      ].join("\n"),
    },
  ];
}

export function BookingMessage({
  booking,
  businessName,
  onClose,
}: {
  booking: AdminBooking;
  businessName: string;
  onClose: () => void;
}) {
  const [advancePct, setAdvancePct] = useState(DEFAULT_ADVANCE);
  const settled = isSettled(booking.status);
  const [activeKey, setActiveKey] = useState(settled ? "received" : "confirm");
  // Null until the message is hand-edited, so changing the split or the
  // template rebuilds it rather than leaving a stale draft on screen.
  const [edited, setEdited] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const options = useMemo(
    () => templates(booking, businessName, advancePct),
    [booking, businessName, advancePct],
  );
  const active = options.find((o) => o.key === activeKey) ?? options[0];
  const message = edited ?? active.body;

  const handle = booking.buyerContact?.replace(/^@/, "") ?? "";
  // A handle Instagram cannot possibly resolve would just send him to a dead page.
  const reachable = Boolean(handle) && isValidInstagramHandle(handle);
  // Only mounted after a click, so reading the device here is safe.
  const onPhone = onMobileDevice();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function setPct(next: number) {
    setAdvancePct(next);
    setEdited(null);
    setCopied(false);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      /* the textarea stays selectable as a fallback */
    }
  }

  const facts = [
    { label: "Quantity", value: `${compactQty(booking.quantity)} pcs` },
    { label: "Rate", value: `${money(booking.unitPrice)} each` },
    { label: "Total", value: money(booking.totalPrice) },
    { label: "Fragrance", value: booking.fragrance },
    { label: "Delivery", value: [booking.pincode, booking.state].filter(Boolean).join(" · ") },
    { label: "Buyer", value: booking.buyerName },
    { label: "Instagram", value: handle ? `@${handle}` : null },
    { label: "Phone", value: booking.phone },
    {
      label: "Booked",
      value: new Date(booking.createdAt).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    },
    { label: "Came from", value: SOURCE_LABEL[booking.source] ?? booking.source },
    { label: "Status", value: STATUS_LABEL[booking.status as BookingStatus] ?? booking.status },
    { label: "Reference", value: booking.id.slice(0, 8).toUpperCase() },
    { label: "Their note", value: booking.note },
  ].filter((f) => f.value);

  const advanceAmount = Math.round((booking.totalPrice * Math.min(100, Math.max(1, advancePct))) / 100);

  const dialog = (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-ink/45 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Order for ${booking.productName}`}
        className="flex max-h-[92dvh] w-full max-w-[620px] flex-col overflow-hidden rounded-t-[20px] bg-canvas sm:rounded-[20px]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-4">
          <p className="font-display text-[1.15rem] text-ink">Order details</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 rounded-full p-2 text-ink-soft transition-colors hover:text-ink"
          >
            <X size={19} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-canvas-deep">
              {booking.productImage && (
                <Image src={booking.productImage} alt="" fill sizes="56px" className="object-cover" />
              )}
            </div>
            <p className="font-display text-[1.15rem] text-ink">{booking.productName}</p>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="flex items-baseline justify-between gap-4 border-b border-line-soft py-2.5"
              >
                <dt className="shrink-0 text-[0.8rem] text-ink-faint">{fact.label}</dt>
                <dd className="text-right text-[0.875rem] text-ink">{fact.value}</dd>
              </div>
            ))}
          </dl>

          {/* Advance share — drives the numbers in the templates below. Pointless
              once the money is in, so it only shows while something is owed. */}
          {!settled && (
          <div className="mt-8 rounded-[12px] border border-line bg-surface px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[0.8rem] font-medium text-ink">Advance for this order</p>
              <p className="text-[0.85rem] text-ink-soft">
                <span className="text-ink tabular-nums">{money(advanceAmount)}</span>
                {advancePct < 100 && (
                  <>
                    {" "}
                    now, {money(booking.totalPrice - advanceAmount)} later
                  </>
                )}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPct(p)}
                  className={`rounded-full border px-3.5 py-1.5 text-[0.8rem] transition-colors ${
                    advancePct === p
                      ? "border-ink bg-ink text-canvas"
                      : "border-line text-ink-soft hover:border-ink/40 hover:text-ink"
                  }`}
                >
                  {p === 100 ? "Full payment" : `${p}%`}
                </button>
              ))}
              <span className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={advancePct}
                  onChange={(e) => setPct(Number(e.target.value))}
                  aria-label="Advance percentage"
                  className="w-12 bg-transparent text-[0.8rem] text-ink tabular-nums focus:outline-none"
                />
                <span className="text-[0.8rem] text-ink-faint">%</span>
              </span>
            </div>
          </div>
          )}

          <p className="mt-8 text-[0.8rem] font-medium text-ink">Message them</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {options.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  setActiveKey(option.key);
                  setEdited(null);
                  setCopied(false);
                }}
                className={`rounded-full border px-3.5 py-1.5 text-[0.8rem] transition-colors ${
                  activeKey === option.key
                    ? "border-ink bg-ink text-canvas"
                    : "border-line text-ink-soft hover:border-ink/40 hover:text-ink"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <textarea
            value={message}
            onChange={(e) => {
              setEdited(e.target.value);
              setCopied(false);
            }}
            rows={10}
            className="mt-3 w-full resize-none rounded-[12px] border border-line bg-surface p-4 text-[0.85rem] leading-relaxed text-ink focus:border-ink/40 focus:outline-none"
          />
          <p className="mt-1.5 text-[0.75rem] text-ink-faint">
            {edited
              ? "Edited. Changing the split or the template rewrites it."
              : "Edit it however you like before sending."}
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-6 py-3.5 text-[0.9rem] text-ink transition-colors hover:border-ink"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy message"}
            </button>

            {reachable && (
              <a
                href={instagramChatLink(handle)}
                target="_blank"
                rel="noreferrer"
                onClick={copy}
                className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-full bg-ink px-6 py-3.5 text-[0.9rem] text-canvas transition-colors hover:bg-ember"
              >
                <InstagramIcon size={17} />
                {onPhone ? `Open chat with @${handle}` : `Open @${handle} on Instagram`}
              </a>
            )}
          </div>

          {reachable ? (
            <p className="mt-3 text-[0.75rem] leading-relaxed text-ink-faint">
              {onPhone
                ? "Opens the chat in the Instagram app. Long-press the message box and paste."
                : "Instagram has no way to open a chat by username on a computer, so this opens their profile — press Message there, then paste."}
            </p>
          ) : (
            <p className="mt-3 rounded-[10px] bg-ember-wash px-4 py-3 text-[0.82rem] leading-relaxed text-ember-deep">
              {handle
                ? `“${handle}” is not a usable Instagram username, so there is no chat to open.`
                : "No Instagram handle on this order, so there is no chat to open."}{" "}
              Copy the message and send it however you have been talking to them.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document === "undefined" ? null : createPortal(dialog, document.body);
}
