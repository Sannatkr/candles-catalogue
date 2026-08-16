import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Admin" };

const STEPS = [
  {
    title: "Create a free Supabase project",
    body: "Go to supabase.com, sign in with Google, and click New project. Any name, any password (save it), region Mumbai or Singapore.",
  },
  {
    title: "Run the setup script",
    body: "Open SQL Editor in the left menu, paste everything from supabase/schema.sql in this project, and press Run.",
  },
  {
    title: "Copy two keys into .env.local",
    body: "Project Settings → API. Copy the Project URL and the anon public key into .env.local as NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the server.",
  },
  {
    title: "Create your login",
    body: "Authentication → Users → Add user. Use your email and a password you will remember. That is the login for this admin.",
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-[720px] px-5 py-20 sm:px-8">
        <p className="eyebrow">Admin</p>
        <h1 className="mt-4 font-display text-[clamp(2rem,4.5vw,2.9rem)] leading-tight tracking-[-0.02em] text-ink">
          One-time setup, four steps
        </h1>
        <p className="mt-4 text-[1rem] leading-relaxed text-ink-soft">
          The catalogue is running on sample candles right now. Connect the database once and the admin
          below becomes live — after that you never touch any of this again.
        </p>

        <ol className="mt-10 space-y-5">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-5 rounded-[14px] border border-line bg-surface p-5">
              <span className="font-display text-[1.4rem] leading-none text-ember-wash">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="font-display text-[1.05rem] text-ink">{step.title}</p>
                <p className="mt-1.5 text-[0.9rem] leading-relaxed text-ink-soft">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <Link
          href="/"
          className="mt-10 inline-block rounded-full border border-line px-6 py-3 text-[0.9rem] text-ink transition-colors hover:border-ink"
        >
          ← Back to the catalogue
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
