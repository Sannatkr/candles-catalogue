"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { BulkEnquiryDialog } from "@/components/bulk-enquiry-dialog";
import { InstagramIcon } from "@/components/instagram-icon";
import { track } from "@/lib/analytics";

/**
 * The one floating thing on the site: a bulk-enquiry button, bottom right.
 *
 * It keeps the Instagram gradient the owner uses for "talk to us", but it now
 * opens the enquiry form rather than an empty DM: "DM for price" trains an
 * inbox to fill with one-word messages, and the buyer worth answering is the
 * one who has already said forty of this and sixty of that. The form hands
 * them to the chat at the end, with the whole enquiry on the clipboard.
 *
 * Not on the bag or the checkout. Someone there is paying; the only button they
 * should be looking at is the one that finishes the order.
 */
export function BulkFab({
  fragrances,
  instagramHandle,
  businessName,
}: {
  fragrances: string[];
  instagramHandle: string;
  businessName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname.startsWith("/cart") || pathname.startsWith("/checkout")) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          track("bulk_fab_clicked", { path: pathname });
        }}
        style={{
          backgroundImage:
            "linear-gradient(95deg, #405DE6 0%, #833AB4 35%, #C13584 60%, #E1306C 80%, #F77737 100%)",
        }}
        className="fixed right-4 bottom-4 z-40 inline-flex items-center gap-2.5 rounded-full px-5 py-3.5 text-[0.9rem] font-medium text-white shadow-[0_8px_28px_rgba(0,0,0,0.22)] transition-transform hover:scale-[1.03] sm:right-6 sm:bottom-6"
      >
        <InstagramIcon size={17} />
        Bulk enquiry
      </button>

      {open && (
        <BulkEnquiryDialog
          fragrances={fragrances}
          instagramHandle={instagramHandle}
          businessName={businessName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
