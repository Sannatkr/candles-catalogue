"use client";

import { usePathname } from "next/navigation";
import { InstagramIcon } from "@/components/instagram-icon";
import { track } from "@/lib/analytics";

/**
 * The one floating thing on the site: a bulk-enquiry button, bottom right,
 * that opens the Instagram chat the same way the header's Enquire does.
 *
 * Not on the bag or the checkout. Someone there is paying; the only button
 * they should be looking at is the one that finishes the order.
 */
export function BulkFab({ href }: { href: string }) {
  const pathname = usePathname();
  if (pathname.startsWith("/cart") || pathname.startsWith("/checkout")) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={() => track("bulk_fab_clicked", { path: pathname })}
      style={{
        backgroundImage:
          "linear-gradient(95deg, #405DE6 0%, #833AB4 35%, #C13584 60%, #E1306C 80%, #F77737 100%)",
      }}
      className="fixed right-4 bottom-4 z-40 inline-flex items-center gap-2.5 rounded-full px-5 py-3.5 text-[0.9rem] font-medium text-white shadow-[0_8px_28px_rgba(0,0,0,0.22)] transition-transform hover:scale-[1.03] sm:right-6 sm:bottom-6"
    >
      <InstagramIcon size={17} />
      Bulk enquiry
    </a>
  );
}
