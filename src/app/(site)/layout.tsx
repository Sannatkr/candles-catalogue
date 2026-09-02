import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSettings } from "@/lib/data";
import { GiftConfigProvider } from "@/lib/gift-context";
import { instagramDmLink } from "@/lib/format";

/**
 * The catalogue is edited in the admin and sometimes straight in Supabase, so
 * pages must not stay frozen at the shape they had when the site was built.
 * Admin saves call revalidatePath for an instant refresh; this is the backstop
 * that picks up anything changed outside the app, so it only needs to be
 * slow — at 60s every page in this segment rewrote its cache entry once a
 * minute, which alone burned through Vercel's 200k/month ISR write tier.
 */
export const revalidate = 3600;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <GiftConfigProvider config={settings.gift}>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader
          businessName={settings.businessName}
          instagramHref={instagramDmLink(settings.instagramHandle)}
        />
        <main className="flex-1">{children}</main>
        <SiteFooter settings={settings} />
      </div>
    </GiftConfigProvider>
  );
}
