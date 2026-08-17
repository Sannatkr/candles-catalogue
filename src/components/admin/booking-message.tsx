"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, X } from "lucide-react";
import { InstagramIcon } from "@/components/instagram-icon";
import type { AdminBooking } from "@/lib/admin/queries";
import { SOURCE_LABEL, STATUS_LABEL, type BookingStatus } from "@/lib/admin/booking-status";
import { compactQty, instagramDmLink, money } from "@/lib/format";

/** Ready-made replies for the three moments an order needs a message. */
function templates(b: AdminBooking, businessName: string) {
  const who = b.buyerName ? b.buyerName.split(" ")[0] : "there";
  const ref = b.id.slice(0, 8).toUpperCase();
  const line = `${b.productName} × ${compactQty(b.quantity)} at ${money(b.unitPrice)} each = ${money(b.totalPrice)}`;
  const advance = Math.round(b.totalPrice * 0.65);

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
        b.pincode ? `Delivery: ${b.pincode}${b.state ? `, ${b.state}` : ""}` : null,
        `Reference: ${ref}`,
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
        `Advance to start production (65%): ${money(advance)}`,
        `Balance before dispatch: ${money(b.totalPrice - advance)}`,
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
        `Sharing photographs now. The balance is due before dispatch — shall I send the QR?`,
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
  const options = templates(booking, businessName);
  const [active, setActive] = useState(options[0].key);
  const [message, setMessage] = useState(options[0].body);
  const [copied, setCopied] = useState(false);

  const handle = booking.buyerContact?.replace(/^@/, "") ?? "";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      /* the textarea is selectable as a fallback */
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
    { label: "Booked", value: new Date(booking.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) },
    { label: "Came from", value: SOURCE_LABEL[booking.source] ?? booking.source },
    { label: "Status", value: STATUS_LABEL[booking.status as BookingStatus] ?? booking.status },
    { label: "Reference", value: booking.id.slice(0, 8).toUpperCase() },
    { label: "Their note", value: booking.note },
  ].filter((f) => f.value);

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

          <p className="mt-8 text-[0.8rem] font-medium text-ink">Message them</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {options.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  setActive(option.key);
                  setMessage(option.body);
                  setCopied(false);
                }}
                className={`rounded-full border px-3.5 py-1.5 text-[0.8rem] transition-colors ${
                  active === option.key
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
              setMessage(e.target.value);
              setCopied(false);
            }}
            rows={9}
            className="mt-3 w-full resize-none rounded-[12px] border border-line bg-surface p-4 text-[0.85rem] leading-relaxed text-ink focus:border-ink/40 focus:outline-none"
          />
          <p className="mt-1.5 text-[0.75rem] text-ink-faint">Edit it however you like before sending.</p>

          {handle ? (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-6 py-3.5 text-[0.9rem] text-ink transition-colors hover:border-ink"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied" : "Copy message"}
              </button>
              <a
                href={instagramDmLink(handle)}
                target="_blank"
                rel="noreferrer"
                onClick={copy}
                className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-full bg-ink px-6 py-3.5 text-[0.9rem] text-canvas transition-colors hover:bg-ember"
              >
                <InstagramIcon size={17} />
                Open @{handle} &amp; paste
              </a>
            </div>
          ) : (
            <p className="mt-5 rounded-[10px] bg-ember-wash px-4 py-3 text-[0.85rem] text-ember-deep">
              No Instagram handle on this order, so there is nobody to open a chat with. Copy the message
              and send it however you have been talking to them.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document === "undefined" ? null : createPortal(dialog, document.body);
}
