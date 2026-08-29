import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { markScriptPosted } from "@/lib/admin/actions";
import { type AdminScript, listScripts } from "@/lib/admin/queries";
import {
  isScriptStatus,
  SCRIPT_STATUS_LABEL,
  SCRIPT_STATUS_STYLE,
  type ScriptStatus,
} from "@/lib/admin/script-status";

export const dynamic = "force-dynamic";

const IST = "Asia/Kolkata";

function whenLabel(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const day = d.toLocaleDateString("en-IN", {
    timeZone: IST,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = d.toLocaleTimeString("en-IN", {
    timeZone: IST,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return { day, time };
}

const nf = new Intl.NumberFormat("en-IN");

export default async function AdminScriptsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  const [{ saved, deleted }, scripts] = await Promise.all([searchParams, listScripts()]);

  if (scripts === null) {
    return (
      <>
        <p className="eyebrow">Content</p>
        <h1 className="mt-3 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
          Scripts
        </h1>
        <p className="mt-6 rounded-[10px] bg-ember-wash px-4 py-3 text-[0.875rem] text-ember-deep">
          Run <code>supabase/020-scripts.sql</code> in Supabase → SQL Editor to create the scripts table. Your
          five reels are seeded inside that same file.
        </p>
      </>
    );
  }

  const upcoming = scripts.filter((s) => s.status === "draft" || s.status === "scheduled");
  // Coming up reads forwards (soonest first); posted reads backwards (latest first).
  const done = scripts.filter((s) => s.status === "posted" || s.status === "archived").reverse();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Content</p>
          <h1 className="mt-3 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
            Scripts
          </h1>
          <p className="mt-2 text-[0.875rem] text-ink-soft">
            {upcoming.length} to shoot · {done.length} posted
          </p>
        </div>
        <Link
          href="/admin/scripts/new"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[0.9rem] text-canvas transition-colors hover:bg-ember"
        >
          <Plus size={16} />
          New script
        </Link>
      </div>

      {(saved || deleted) && (
        <p className="mt-6 rounded-[10px] bg-[#eaf0e6] px-4 py-3 text-[0.875rem] text-[#41552f]">
          {saved ? "Saved." : "Deleted."}
        </p>
      )}

      {scripts.length === 0 && (
        <p className="mt-8 rounded-[14px] border border-line bg-canvas px-5 py-8 text-center text-[0.9rem] text-ink-soft">
          No scripts yet. Write your first one.
        </p>
      )}

      {upcoming.length > 0 && <Section title="Coming up" scripts={upcoming} />}
      {done.length > 0 && <Section title="Already posted" scripts={done} />}
    </>
  );
}

function Section({ title, scripts }: { title: string; scripts: AdminScript[] }) {
  return (
    <section className="mt-9">
      <h2 className="text-[0.8rem] font-medium tracking-[0.08em] text-ink-faint uppercase">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {scripts.map((script) => {
          const when = whenLabel(script.postedAt ?? script.scheduledAt);
          const status = (isScriptStatus(script.status) ? script.status : "draft") as ScriptStatus;

          return (
            <li key={script.id} className="rounded-[14px] border border-line bg-canvas p-4 sm:p-5">
              <div className="flex flex-wrap items-start gap-4">
                {when && (
                  <div className="w-[92px] shrink-0 rounded-[10px] bg-canvas-deep px-3 py-2.5 text-center">
                    <p className="text-[0.8rem] leading-snug font-medium text-ink">{when.day}</p>
                    <p className="mt-0.5 text-[0.72rem] text-ink-soft">{when.time}</p>
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <p className="font-display text-[1.05rem] text-ink">{script.title}</p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[0.7rem] ${SCRIPT_STATUS_STYLE[status]}`}
                    >
                      {SCRIPT_STATUS_LABEL[status]}
                    </span>
                    {script.cta && (
                      <span className="rounded-full border border-line px-2.5 py-0.5 text-[0.7rem] text-ink-soft">
                        {script.cta}
                      </span>
                    )}
                  </div>

                  {script.hook && (
                    <p className="mt-2 line-clamp-2 text-[0.875rem] leading-relaxed text-ink">
                      &ldquo;{script.hook}&rdquo;
                    </p>
                  )}

                  <p className="mt-1.5 text-[0.75rem] text-ink-faint">
                    {script.durationSec ? `~${script.durationSec} sec · ` : ""}
                    {script.wordCount} words
                    {script.views !== null && ` · ${nf.format(script.views)} views`}
                    {script.likes !== null && ` · ${nf.format(script.likes)} likes`}
                    {script.comments !== null && ` · ${nf.format(script.comments)} comments`}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {script.permalink && (
                    <a
                      href={script.permalink}
                      target="_blank"
                      rel="noreferrer"
                      title="Open reel"
                      className="rounded-full border border-line p-2 text-ink-soft transition-colors hover:border-ink hover:text-ink"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  {status !== "posted" && (
                    <form action={markScriptPosted}>
                      <input type="hidden" name="id" value={script.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-line px-4 py-2 text-[0.825rem] text-ink transition-colors hover:border-ink"
                      >
                        Mark posted
                      </button>
                    </form>
                  )}
                  <Link
                    href={`/admin/scripts/${script.id}`}
                    className="rounded-full bg-ink px-4 py-2 text-[0.825rem] text-canvas transition-colors hover:bg-ember"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
