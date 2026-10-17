"use client";

import { useEffect, useLayoutEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

/**
 * A panel pinned under (or, when there is no room, above) an anchor, drawn in
 * a portal at fixed coordinates so no scrolling table or dialog can clip it.
 * Closes on a click outside or Escape. The date picker and the candle picker
 * both sit on this.
 */
export function AnchoredPopover({
  anchorRef,
  open,
  onClose,
  width,
  matchWidth = false,
  className = "",
  children,
}: {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  width?: number;
  /** Stretch to the anchor's width (the candle picker); otherwise `width`. */
  matchWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!open) return;

    const place = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      const w = Math.min(matchWidth ? Math.max(rect.width, 280) : (width ?? 300), window.innerWidth - 24);
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - w - 12));
      const height = panel?.offsetHeight ?? 360;
      const below = rect.bottom + 8;
      const flip = below + height > window.innerHeight - 12 && rect.top - height - 8 > 12;
      setCoords({ top: flip ? rect.top - height - 8 : below, left, width: w });
    };

    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, anchorRef, width, matchWidth, panel]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!panel?.contains(target) && !anchorRef.current?.contains(target)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open, onClose, panel, anchorRef]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={setPanel}
      style={coords ? { top: coords.top, left: coords.left, width: coords.width } : { visibility: "hidden" }}
      className={`fixed z-[260] overflow-hidden rounded-[14px] border border-line bg-canvas shadow-[0_24px_56px_-16px_rgba(30,25,19,0.38)] ${className}`}
    >
      {children}
    </div>,
    document.body,
  );
}
