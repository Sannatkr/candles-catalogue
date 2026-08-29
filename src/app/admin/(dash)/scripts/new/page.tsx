import Link from "next/link";
import { ScriptForm } from "@/components/admin/script-form";

export default function NewScriptPage() {
  return (
    <>
      <Link href="/admin/scripts" className="text-[0.825rem] text-ink-soft hover:text-ink">
        ← Scripts
      </Link>
      <h1 className="mt-4 mb-8 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
        New script
      </h1>
      <ScriptForm script={null} />
    </>
  );
}
