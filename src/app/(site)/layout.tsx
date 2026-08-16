import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSettings } from "@/lib/data";
import { instagramDmLink } from "@/lib/format";

/**
 * The catalogue is edited in the admin and sometimes straight in Supabase, so
 * pages must not stay frozen at the shape they had when the site was built.
 * Admin saves call revalidatePath for an instant refresh; this is the backstop
 * that picks up anything changed outside the app.
 */
export const revalidate = 60;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader
        businessName={settings.businessName}
        instagramHref={instagramDmLink(settings.instagramHandle)}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
    </div>
  );
}
