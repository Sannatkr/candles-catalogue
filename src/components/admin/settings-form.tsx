"use client";

import { useActionState, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Card, Field, Input, Notice, SubmitButton, Textarea, Toggle } from "@/components/admin/ui";
import { IDLE } from "@/lib/admin/action-state";
import { saveSettings } from "@/lib/admin/actions";
import type { SiteSettings, TermsSection } from "@/lib/types";

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action] = useActionState(saveSettings, IDLE);
  const [sections, setSections] = useState<TermsSection[]>(settings.termsSections);

  const patch = (i: number, next: Partial<TermsSection>) =>
    setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...next } : s)));

  const move = (i: number, dir: -1 | 1) =>
    setSections((prev) => {
      const to = i + dir;
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(i, 1);
      next.splice(to, 0, item);
      return next;
    });

  return (
    <form action={action} className="space-y-6 pb-24">
      <Notice ok={state.ok} message={state.message} />

      <Card title="Your business">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Business name">
            <Input name="businessName" defaultValue={settings.businessName} required />
          </Field>
          <Field label="Tagline" hint="One line, shown in the footer.">
            <Input name="tagline" defaultValue={settings.tagline} />
          </Field>
          <Field label="Home page paragraph" className="sm:col-span-2">
            <Textarea name="aboutBlurb" defaultValue={settings.aboutBlurb} />
          </Field>
        </div>
      </Card>

      <Card title="Contact" hint="Your Instagram handle powers every enquiry button on the site.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Instagram handle" hint="Without the @. e.g. sugandha_candles_">
            <Input name="instagramHandle" defaultValue={settings.instagramHandle} autoCapitalize="none" />
          </Field>
          <Field label="Email">
            <Input type="email" name="email" defaultValue={settings.email} />
          </Field>
          <Field label="Address" hint="One line per row.">
            <Textarea name="addressLines" defaultValue={settings.addressLines.join("\n")} className="min-h-[90px]" />
          </Field>
        </div>
      </Card>

      <Card
        title="Fragrance list"
        hint="What a buyer can choose from when they order 50 pieces or more. One per line."
      >
        <Textarea name="fragrances" defaultValue={settings.fragrances.join("\n")} className="min-h-[220px]" />
      </Card>

      <Card
        title="Delivery"
        hint="A flat fee, free over a subtotal — but only while the parcel stays light, so heavy orders (like a stack of urlis) never ship free."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Flat delivery fee (₹)">
            <Input type="number" name="ship_flat" min={0} step="1" defaultValue={settings.shipping.flatFee} />
          </Field>
          <Field label="Free delivery over (₹)" hint="0 turns free delivery off.">
            <Input type="number" name="ship_free_over" min={0} step="1" defaultValue={settings.shipping.freeOverSubtotal} />
          </Field>
          <Field label="…but only under (kg)" hint="So a heavy order never ships free. 0 = no weight limit.">
            <Input
              type="number"
              name="ship_free_under_kg"
              min={0}
              step="0.5"
              defaultValue={settings.shipping.freeUnderGrams / 1000}
            />
          </Field>
        </div>
      </Card>

      <Card
        title="Free candle"
        hint="One free candle, chosen by the buyer, once their bag reaches the amount below. Which candles they may choose from is set per candle, on the product page — tick “Can be given free”."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Toggle
            name="gift_enabled"
            label="Offer a free candle"
            hint="Turn off to end the offer without unticking every candle."
            defaultChecked={settings.gift.enabled}
          />
          <Field label="Bag must reach (₹)" hint="Counts only what is being paid for — the gift never unlocks itself.">
            <Input type="number" name="gift_threshold" min={0} step="1" defaultValue={settings.gift.threshold} />
          </Field>
        </div>
      </Card>

      <Card title="Terms & payment" hint="This is the page you stop re-explaining in every DM.">
        <input type="hidden" name="termsSections" value={JSON.stringify(sections)} readOnly />

        <Field label="Opening paragraph">
          <Textarea name="termsIntro" defaultValue={settings.termsIntro} className="min-h-[90px]" />
        </Field>

        <div className="mt-7 space-y-4">
          {sections.map((section, i) => (
            <div key={i} className="rounded-[12px] border border-line bg-surface p-4">
              <div className="flex items-center gap-2">
                <input
                  value={section.heading}
                  onChange={(e) => patch(i, { heading: e.target.value })}
                  placeholder="Section heading"
                  className="flex-1 bg-transparent font-display text-[1.05rem] text-ink focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move up"
                  className="rounded-full p-1.5 text-ink-faint hover:text-ink disabled:opacity-25"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === sections.length - 1}
                  aria-label="Move down"
                  className="rounded-full p-1.5 text-ink-faint hover:text-ink disabled:opacity-25"
                >
                  <ChevronDown size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setSections((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label="Delete section"
                  className="rounded-full p-1.5 text-ink-faint hover:text-ember-deep"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <textarea
                value={section.body.join("\n")}
                onChange={(e) => patch(i, { body: e.target.value.split("\n") })}
                placeholder="One point per line."
                className="mt-3 min-h-[100px] w-full rounded-[8px] border border-line-soft bg-canvas px-3 py-2.5 text-[0.875rem] leading-relaxed text-ink-soft focus:border-ink/30 focus:outline-none"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setSections((prev) => [...prev, { heading: "", body: [""] }])}
          className="mt-4 inline-flex items-center gap-1.5 text-[0.875rem] text-ember transition-colors hover:text-ember-deep"
        >
          <Plus size={15} />
          Add a section
        </button>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[980px] items-center justify-end px-5 py-4 sm:px-8">
          <SubmitButton>Save settings</SubmitButton>
        </div>
      </div>
    </form>
  );
}
