import { SettingsForm } from "@/components/admin/settings-form";
import { getAdminSettings } from "@/lib/admin/queries";
import { seedSettings } from "@/lib/seed";
import type { SiteSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const stored = await getAdminSettings();
  // Anything not yet saved falls back to the starting copy, so the form is never blank.
  const settings = { ...seedSettings, ...stored } as SiteSettings;

  return (
    <>
      <p className="eyebrow">Site</p>
      <h1 className="mt-3 mb-8 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
        Settings &amp; terms
      </h1>
      <SettingsForm settings={settings} />
    </>
  );
}
