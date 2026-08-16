"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, X } from "lucide-react";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/supabase/config";
import { getBrowserSupabase } from "@/lib/supabase/client";

type Props = {
  /** Form field name. Multiple mode submits a JSON array, single mode a plain URL. */
  name: string;
  label: string;
  hint?: string;
  initial?: string[];
  multiple?: boolean;
  folder?: string;
};

function safeName(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

export function ImageUploader({
  name,
  label,
  hint,
  initial = [],
  multiple = true,
  folder = "products",
}: Props) {
  const [urls, setUrls] = useState<string[]>(initial.filter(Boolean));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");

    const supabase = getBrowserSupabase();
    const uploaded: string[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 8 * 1024 * 1024) {
        setError(`${file.name} is over 8 MB. Please use a smaller photo.`);
        continue;
      }

      const path = `${folder}/${safeName(file)}`;
      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(path, file, { cacheControl: "31536000", upsert: false });

      if (uploadError) {
        setError(uploadError.message);
        continue;
      }

      const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }

    setUrls((prev) => (multiple ? [...prev, ...uploaded] : uploaded.slice(-1)));
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  const move = (from: number, to: number) =>
    setUrls((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  return (
    <div>
      <p className="text-[0.8rem] font-medium text-ink">{label}</p>
      {hint && <p className="mt-0.5 text-[0.75rem] text-ink-faint">{hint}</p>}

      <input
        type="hidden"
        name={name}
        value={multiple ? JSON.stringify(urls) : (urls[0] ?? "")}
        readOnly
      />

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {urls.map((url, i) => (
          <div
            key={url}
            className="group relative aspect-square overflow-hidden rounded-[10px] border border-line bg-surface"
          >
            <Image src={url} alt="" fill sizes="200px" className="object-cover" />

            {i === 0 && multiple && (
              <span className="absolute top-1.5 left-1.5 rounded-full bg-ink/80 px-2 py-0.5 text-[0.65rem] text-canvas">
                Main
              </span>
            )}

            <button
              type="button"
              onClick={() => setUrls((prev) => prev.filter((u) => u !== url))}
              aria-label="Remove photo"
              className="absolute top-1.5 right-1.5 rounded-full bg-ink/80 p-1 text-canvas opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X size={13} />
            </button>

            {multiple && urls.length > 1 && (
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/70 px-1 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => move(i, i - 1)}
                  aria-label="Move earlier"
                  className="p-1 text-canvas disabled:opacity-30"
                  disabled={i === 0}
                >
                  <ArrowLeft size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  aria-label="Move later"
                  className="p-1 text-canvas disabled:opacity-30"
                  disabled={i === urls.length - 1}
                >
                  <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-line bg-surface text-ink-faint transition-colors hover:border-ink/40 hover:text-ink disabled:opacity-60"
        >
          {busy ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
          <span className="text-[0.75rem]">{busy ? "Uploading…" : "Add photo"}</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {error && <p className="mt-2 text-[0.8rem] text-ember-deep">{error}</p>}
    </div>
  );
}
