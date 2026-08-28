"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  ShoppingBag,
  ExternalLink,
  IndianRupee,
  LayoutGrid,
  LogOut,
  Package,
  Receipt,
  Settings,
  Users,
} from "lucide-react";
import { signOut } from "@/lib/admin/actions";

const LINKS = [
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/bookings", label: "Enquiries", icon: ClipboardList },
  { href: "/admin/revenue", label: "Revenue", icon: IndianRupee },
  { href: "/admin/invoices", label: "Invoices", icon: Receipt },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/collections", label: "Collections", icon: LayoutGrid },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

/**
 * A left rail on a desktop, a scrolling top bar on a phone — same links, the
 * flex direction just flips at `lg`.
 */
export function AdminNav() {
  const pathname = usePathname();

  const itemBase =
    "inline-flex shrink-0 items-center gap-2.5 rounded-full px-3.5 py-2 text-[0.875rem] whitespace-nowrap transition-colors lg:w-full lg:rounded-[10px] lg:px-3 lg:py-2.5";
  const itemIdle = "text-ink-soft hover:bg-canvas-deep hover:text-ink";

  return (
    <aside className="sticky top-0 z-50 flex shrink-0 items-center gap-4 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur-xl lg:h-dvh lg:w-[232px] lg:flex-col lg:items-stretch lg:gap-0 lg:border-b-0 lg:border-r lg:px-5 lg:py-7">
      <Link
        href="/admin"
        className="shrink-0 font-display text-[1.15rem] whitespace-nowrap text-ink lg:px-2 lg:pb-7"
      >
        Sugandha <span className="text-ember">Admin</span>
      </Link>

      <nav className="-mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1 lg:mx-0 lg:flex-none lg:flex-col lg:items-stretch lg:gap-1 lg:overflow-visible lg:px-0">
        {LINKS.map((link) => {
          const active = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${itemBase} ${active ? "bg-ink text-canvas" : itemIdle}`}
            >
              <Icon size={16} className="shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-1 lg:mt-auto lg:flex-col lg:items-stretch lg:gap-1 lg:border-t lg:border-line lg:pt-4">
        <Link
          href="/"
          target="_blank"
          aria-label="View site"
          title="View site"
          className={`${itemBase} ${itemIdle}`}
        >
          <ExternalLink size={16} className="shrink-0" />
          <span className="hidden lg:inline">View site</span>
        </Link>
        <form action={signOut} className="lg:w-full">
          <button
            type="submit"
            aria-label="Sign out"
            title="Sign out"
            className={`${itemBase} ${itemIdle}`}
          >
            <LogOut size={16} className="shrink-0" />
            <span className="hidden lg:inline">Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
