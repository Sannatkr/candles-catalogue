"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  ExternalLink,
  IndianRupee,
  LayoutGrid,
  LogOut,
  Package,
  Settings,
} from "lucide-react";
import { signOut } from "@/lib/admin/actions";

const LINKS = [
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/admin/revenue", label: "Revenue", icon: IndianRupee },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/collections", label: "Collections", icon: LayoutGrid },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1240px] items-center gap-5 px-5 sm:px-8">
        <Link href="/admin" className="shrink-0 font-display text-[1.15rem] whitespace-nowrap text-ink">
          Sugandha <span className="text-ember">Admin</span>
        </Link>

        {/* Scrolls sideways on narrow screens rather than wrapping to a second row. */}
        <nav className="-mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1">
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[0.875rem] whitespace-nowrap transition-colors ${
                  active ? "bg-ink text-canvas" : "text-ink-soft hover:bg-canvas-deep hover:text-ink"
                }`}
              >
                <Icon size={15} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/"
            target="_blank"
            aria-label="View site"
            title="View site"
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[0.875rem] whitespace-nowrap text-ink-soft transition-colors hover:bg-canvas-deep hover:text-ink"
          >
            <ExternalLink size={15} />
            <span className="hidden lg:inline">View site</span>
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Sign out"
              title="Sign out"
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[0.875rem] whitespace-nowrap text-ink-soft transition-colors hover:bg-canvas-deep hover:text-ink"
            >
              <LogOut size={15} />
              <span className="hidden lg:inline">Sign out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
