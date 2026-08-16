"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LayoutGrid, LogOut, Package, Settings } from "lucide-react";
import { signOut } from "@/lib/admin/actions";

const LINKS = [
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/collections", label: "Collections", icon: LayoutGrid },
  { href: "/admin/settings", label: "Settings & terms", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 sm:px-8">
        <Link href="/admin" className="font-display text-[1.15rem] text-ink">
          Sugandha <span className="text-ember">Admin</span>
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-1">
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[0.875rem] transition-colors ${
                  active ? "bg-ink text-canvas" : "text-ink-soft hover:bg-canvas-deep hover:text-ink"
                }`}
              >
                <Icon size={15} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[0.875rem] text-ink-soft transition-colors hover:bg-canvas-deep hover:text-ink"
          >
            <ExternalLink size={15} />
            View site
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[0.875rem] text-ink-soft transition-colors hover:bg-canvas-deep hover:text-ink"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
