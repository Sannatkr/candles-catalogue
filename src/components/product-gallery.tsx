"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/** How long each photo holds before the next slides in. */
const AUTO_SLIDE_MS = 4000;
/** A finger has to travel this far sideways before it counts as a swipe. */
const SWIPE_PX = 40;

/**
 * One photo at a time, sliding. With more than one photo it moves on by itself
 * so a buyer who never touches it still sees every angle, and it can be swiped
 * on a phone, stepped with the arrows, or jumped with the thumbnails. Any touch
 * stops the auto-slide for good — once someone is looking closely, a photo
 * that moves away under them is the last thing they want.
 */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [hovering, setHovering] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const count = images.length;
  const many = count > 1;

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);
  const pick = (next: number) => {
    setStopped(true);
    go(next);
  };

  useEffect(() => {
    if (!many || stopped || hovering) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => go(index + 1), AUTO_SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [many, stopped, hovering, index, go]);

  return (
    <div>
      <div
        className="relative aspect-4/5 overflow-hidden rounded-[18px] bg-canvas-deep"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onTouchStart={(e) => {
          const t = e.touches[0];
          touchStart.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          const start = touchStart.current;
          touchStart.current = null;
          if (!start || !many) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - start.x;
          // Mostly sideways only — a vertical scroll that drifts is not a swipe.
          if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(t.clientY - start.y)) return;
          pick(dx < 0 ? index + 1 : index - 1);
        }}
      >
        <div
          className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {images.map((src, i) => (
            <div key={src + i} className="relative h-full w-full shrink-0" aria-hidden={i !== index}>
              <Image
                src={src}
                alt={i === 0 ? alt : `${alt}, view ${i + 1}`}
                fill
                priority={i === 0}
                sizes="(max-width: 1024px) 92vw, 52vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {many && (
          <>
            <button
              type="button"
              onClick={() => pick(index - 1)}
              aria-label="Previous photo"
              className="absolute top-1/2 left-3 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-canvas/80 text-ink shadow-sm backdrop-blur-sm transition-colors hover:bg-canvas"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => pick(index + 1)}
              aria-label="Next photo"
              className="absolute top-1/2 right-3 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-canvas/80 text-ink shadow-sm backdrop-blur-sm transition-colors hover:bg-canvas"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => pick(i)}
                  aria-label={`Show photo ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index ? "w-5 bg-canvas" : "w-1.5 bg-canvas/60"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {many && (
        <div className="mt-3 grid grid-cols-5 gap-3">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => pick(i)}
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
    </div>
  );
}
