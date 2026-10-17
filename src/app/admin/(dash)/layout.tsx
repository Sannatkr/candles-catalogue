import { Suspense } from "react";
import { ShieldAlert } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { TopProgress } from "@/components/admin/top-progress";
import { isLockdownPending } from "@/lib/admin/is-admin";
import { getServerSupabase } from "@/lib/supabase/server";

/**
 * Until 014 runs, "logged in" and "admin" are still the same thing. That is
 * fine while you are the only account, and dangerous the moment anyone else
 * can sign up — so it says so, rather than sitting quiet.
 *
 * It is its own async piece so the nav and the page never wait on it: the
 * shell paints at once and this streams in (and, once the migration has
 * answered even once, costs nothing at all).
 */
async function LockdownNotice() {
  const supabase = await getServerSupabase();
  if (!(await isLockdownPending(supabase))) return null;

  return (
    <div className="border-b border-ember/40 bg-ember-wash">
      <div className="flex items-start gap-3 px-5 py-3.5 sm:px-8 lg:px-10">
        <ShieldAlert size={17} className="mt-0.5 shrink-0 text-ember-deep" />
        <p className="text-[0.85rem] leading-relaxed text-ember-deep">
          <span className="font-medium">Admin is not locked down yet.</span> Right now any account
          that can log in has full access here. Run{" "}
          <code className="rounded bg-canvas px-1.5 py-0.5 text-[0.9em]">
            supabase/014-admin-lockdown.sql
          </code>{" "}
          in Supabase before letting customers create accounts.
        </p>
      </div>
    </div>
  );
}

export default function DashLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas lg:flex-row">
      <Suspense fallback={null}>
        <TopProgress />
      </Suspense>
      <AdminNav />

      <div className="flex min-w-0 flex-1 flex-col bg-canvas-deep/25">
        <Suspense fallback={null}>
          <LockdownNotice />
        </Suspense>

        <main className="flex-1 px-5 py-9 sm:px-8 lg:px-10 lg:py-11">{children}</main>
      </div>
    </div>
  );
}
