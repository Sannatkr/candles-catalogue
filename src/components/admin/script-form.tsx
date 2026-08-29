"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Card, Field, Input, Notice, Select, SubmitButton, Textarea } from "@/components/admin/ui";
import { IDLE } from "@/lib/admin/action-state";
import { saveScript } from "@/lib/admin/actions";
import type { AdminScript } from "@/lib/admin/queries";
import {
  countWords,
  CTA_OPTIONS,
  estimateDuration,
  SCRIPT_STATUSES,
  SCRIPT_STATUS_LABEL,
} from "@/lib/admin/script-status";

/**
 * A stored instant → the "YYYY-MM-DDTHH:mm" a datetime-local input wants,
 * rendered in IST so the box shows the hour the reel actually goes out
 * regardless of where this page is opened from.
 */
function toISTLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 16);
}

const METRICS = [
  { name: "views", label: "Views" },
  { name: "reach", label: "Reach" },
  { name: "likes", label: "Likes" },
  { name: "comments", label: "Comments" },
  { name: "shares", label: "Shares" },
  { name: "saves", label: "Saves" },
  { name: "follows", label: "New follows" },
] as const;

export function ScriptForm({ script }: { script: AdminScript | null }) {
  const [state, action] = useActionState(saveScript, IDLE);
  const [body, setBody] = useState(script?.body ?? "");
  const [hook, setHook] = useState(script?.hook ?? "");

  const words = countWords(body);
  const seconds = estimateDuration(words);

  return (
    <form action={action} className="space-y-6 pb-24">
      {script && <input type="hidden" name="id" value={script.id} />}

      <Notice ok={state.ok} message={state.message} />

      <Card title="The script" hint="Hinglish, written the way you say it out loud.">
        <div className="grid gap-5">
          <Field label="Title" hint="Just for you — how you'll find it in the list.">
            <Input name="title" defaultValue={script?.title ?? ""} placeholder="40 return gift hampers" required />
          </Field>

          <Field
            label="Hook"
            hint="The first line. This is the one that decides if anyone watches — kept separate so you can compare hooks later."
          >
            <Textarea
              name="hook"
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              rows={2}
              className="min-h-[72px] font-medium"
              placeholder="Ye order deliver hi nahi hua — meri client khud hi lene aa gayi."
            />
          </Field>

          <Field label="Script" hint={`${words} words · reads in about ${seconds} sec`}>
            <Textarea
              name="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              className="min-h-[300px]"
              placeholder="Toh hua ye ki…"
            />
          </Field>

          <Field label="On-screen text" hint="The beats that sit on the video, arrow separated.">
            <Textarea
              name="on_screen_text"
              defaultValue={script?.onScreenText ?? ""}
              rows={2}
              className="min-h-[72px]"
              placeholder="40 boxes → 6 items per box → Client khud lene aa gayi"
            />
          </Field>

          <Field label="Shoot notes" hint="What to blur, what to check, what to keep fast.">
            <Textarea
              name="notes"
              defaultValue={script?.notes ?? ""}
              rows={2}
              className="min-h-[72px]"
              placeholder="Blur the baby's name on the card."
            />
          </Field>
        </div>
      </Card>

      <Card title="Posting" hint="Times are IST.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="The ask">
            <Input
              name="cta"
              list="cta-options"
              defaultValue={script?.cta ?? ""}
              placeholder="Comment FREE"
            />
            <datalist id="cta-options">
              {CTA_OPTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>

          <Field label="Status">
            <Select name="status" defaultValue={script?.status ?? "draft"}>
              {SCRIPT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {SCRIPT_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Post on" hint="When it should go out.">
            <Input type="datetime-local" name="scheduled_at" defaultValue={toISTLocal(script?.scheduledAt ?? null)} />
          </Field>

          <Field label="Actually posted at" hint="Leave blank until it's up.">
            <Input type="datetime-local" name="posted_at" defaultValue={toISTLocal(script?.postedAt ?? null)} />
          </Field>

          <Field label="Length (sec)" hint={`Blank = use the ~${seconds} sec estimate.`}>
            <Input type="number" name="duration_sec" min={0} defaultValue={script?.durationSec || ""} />
          </Field>

          <Field label="Reel link" hint="Paste the Instagram link once it's live.">
            <Input name="permalink" defaultValue={script?.permalink ?? ""} placeholder="https://instagram.com/reel/…" />
          </Field>
        </div>
      </Card>

      <Card
        title="How it did"
        hint="Fill these in a few days after posting. Leave blank if you haven't checked — blank means 'not measured', which is not the same as zero."
      >
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {METRICS.map((m) => (
            <Field key={m.name} label={m.label}>
              <Input
                type="number"
                name={m.name}
                min={0}
                defaultValue={script?.[m.name] ?? ""}
                placeholder="—"
              />
            </Field>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-4">
        <SubmitButton>{script ? "Save script" : "Add script"}</SubmitButton>
        <Link href="/admin/scripts" className="text-[0.875rem] text-ink-soft hover:text-ink">
          Cancel
        </Link>
      </div>
    </form>
  );
}
