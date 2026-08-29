import Link from "next/link";
import { notFound } from "next/navigation";
import { ScriptForm } from "@/components/admin/script-form";
import { deleteScript } from "@/lib/admin/actions";
import { getScript } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function EditScriptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const script = await getScript(id);
  if (!script) notFound();

  return (
    <>
      <Link href="/admin/scripts" className="text-[0.825rem] text-ink-soft hover:text-ink">
        ← Scripts
      </Link>
      <h1 className="mt-4 mb-8 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
        {script.title}
      </h1>

      <ScriptForm script={script} />

      <form action={deleteScript} className="mt-10 border-t border-line pt-6">
        <input type="hidden" name="id" value={script.id} />
        <button
          type="submit"
          className="text-[0.825rem] text-ink-faint transition-colors hover:text-ember-deep"
        >
          Delete this script
        </button>
      </form>
    </>
  );
}
