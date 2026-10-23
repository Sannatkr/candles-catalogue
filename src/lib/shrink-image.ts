/**
 * Shrink a photo in the browser before it is uploaded.
 *
 * Phone photos are 3–12 MB; the shop shows them at most 1200×1500. Every byte
 * uploaded to Supabase Storage is paid for again each time a shopper loads it,
 * and the free plan allows 5 GB of egress a month, so photos are resized and
 * saved as WebP (quality 0.8, ~100 KB) here, on the admin's own machine.
 * Falls back to the original file if the browser cannot do it.
 */
export async function shrinkImage(
  file: File,
  max = { width: 1200, height: 1500 },
  quality = 0.8,
): Promise<{ blob: Blob; ext: string }> {
  const original = { blob: file, ext: extOf(file.name) };
  if (typeof createImageBitmap !== "function") return original;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return original;
  }

  const scale = Math.min(1, max.width / bitmap.width, max.height / bitmap.height);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return original;
  }
  // Transparent PNGs land on white, matching the shop's cards.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );
  if (!blob) return original;
  // A browser without WebP support hands back a PNG; keep whatever it gave us
  // only if it is actually smaller than the photo we started with.
  if (blob.type !== "image/webp" && blob.size >= file.size) return original;
  return { blob, ext: blob.type === "image/webp" ? "webp" : extOf(blob.type.split("/")[1] ?? "png") };
}

function extOf(name: string) {
  const ext = name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  return ext === "jpeg" ? "jpg" : ext;
}
