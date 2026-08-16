"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0];

  return (
    <div>
      <div className="relative aspect-4/5 overflow-hidden rounded-[18px] bg-canvas-deep">
        <Image
          key={current}
          src={current}
          alt={alt}
          fill
          priority
          sizes="(max-width: 1024px) 92vw, 52vw"
          className="animate-[fadeIn_0.5s_ease] object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-3">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === index}
              className={`relative aspect-square overflow-hidden rounded-[10px] bg-canvas-deep transition-all duration-200 ${
                i === index ? "ring-2 ring-ink ring-offset-2 ring-offset-canvas" : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={src} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  );
}
