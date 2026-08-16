import Link from "next/link";
import { InstagramIcon } from "@/components/instagram-icon";
import { instagramProfileLink } from "@/lib/format";
import type { SiteSettings } from "@/lib/types";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="mt-28 border-t border-line bg-canvas-deep">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-2xl text-ink">{settings.businessName}</p>
            <p className="mt-3 max-w-sm text-[0.925rem] leading-relaxed text-ink-soft">
              {settings.tagline}
            </p>
          </div>

          <div>
            <p className="eyebrow">Catalogue</p>
            <ul className="mt-4 space-y-2.5 text-[0.925rem] text-ink-soft">
              <li>
                <Link href="/collections" className="transition-colors hover:text-ember">
                  Collections
                </Link>
              </li>
              <li>
                <Link href="/products" className="transition-colors hover:text-ember">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-ember">
                  Terms &amp; Payment
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow">Get in touch</p>
            <ul className="mt-4 space-y-2.5 text-[0.925rem] text-ink-soft">
              <li>
                <a
                  href={instagramProfileLink(settings.instagramHandle)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-ember"
                >
                  <InstagramIcon size={15} />@{settings.instagramHandle.replace(/^@/, "")}
                </a>
              </li>
              <li>
                <a href={`mailto:${settings.email}`} className="transition-colors hover:text-ember">
                  {settings.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${settings.phone.replace(/\s/g, "")}`}
                  className="transition-colors hover:text-ember"
                >
                  {settings.phone}
                </a>
              </li>
            </ul>
            <address className="mt-5 text-[0.85rem] leading-relaxed text-ink-faint not-italic">
              {settings.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-6 text-[0.8rem] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {settings.businessName}. Trade catalogue — prices exclude GST.
          </p>
          <p>Prices valid 30 days from the date this link was shared.</p>
        </div>
      </div>
    </footer>
  );
}
