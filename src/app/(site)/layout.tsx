import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSettings } from "@/lib/data";
import { instagramDmLink } from "@/lib/format";

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
