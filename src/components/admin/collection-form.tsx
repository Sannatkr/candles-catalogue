"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Card, Field, Input, Notice, SubmitButton, Textarea } from "@/components/admin/ui";
import { IDLE } from "@/lib/admin/action-state";
import { saveCollection } from "@/lib/admin/actions";
import type { AdminCollection } from "@/lib/admin/queries";
import { slugify } from "@/lib/slug";

export function CollectionForm({ collection }: { collection: AdminCollection | null }) {
  const [state, action] = useActionState(saveCollection, IDLE);
  const [name, setName] = useState(collection?.name ?? "");
  const [slug, setSlug] = useState(collection?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(collection?.slug));

  return (
    <form action={action} className="space-y-6 pb-24">
      {collection && <input type="hidden" name="id" value={collection.id} />}

      <Notice ok={state.ok} message={state.message} />

      <Card title="Collection details">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name">
            <Input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Signature Jars"
              required
            />
          </Field>

          <Field label="Web address" hint="Fills itself from the name.">
            <Input
              name="slug"
              value={slugTouched ? slug : slugify(name)}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="signature-jars"
            />
          </Field>

          <Field label="One-line hook" className="sm:col-span-2">
            <Input name="tagline" defaultValue={collection?.tagline ?? ""} placeholder="Our core range, in glass" />
          </Field>

          <Field label="Description" className="sm:col-span-2">
            <Textarea
              name="description"
              defaultValue={collection?.description ?? ""}
              placeholder="A short paragraph a buyer reads before opening the collection."
            />
          </Field>

          <Field label="Position in list" hint="Lower number shows first.">
            <Input type="number" name="sort_order" defaultValue={collection?.sort_order ?? 0} />
          </Field>
        </div>
      </Card>

      <Card title="Cover photo" hint="Shown on the home page and at the top of the collection.">
        <ImageUploader
          name="cover_image"
          label="Cover"
          initial={collection?.cover_image ? [collection.cover_image] : []}
          multiple={false}
          folder="collections"
        />
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[980px] items-center justify-end gap-3 px-5 py-4 sm:px-8">
          <Link
            href="/admin/collections"
            className="rounded-full border border-line px-6 py-3 text-[0.9rem] text-ink transition-colors hover:border-ink"
          >
            Cancel
          </Link>
          <SubmitButton>{collection ? "Save changes" : "Create collection"}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
