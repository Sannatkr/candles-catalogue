"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, MoreHorizontal } from "lucide-react";

/**
 * The ⋯ menu on a table row, rendered in a portal at fixed coordinates so the
 * sideways-scrolling table cannot clip it. Shared by orders and enquiries;
 * each hands in its own items.
 *
 * `busy` swaps the dots for a spinner — the row's own feedback that a press
 * landed, which the menu closing on its own would otherwise be the only sign of.
 */
export function RowMenu({
  label,
  busy = false,
  width = 220,
  onClose,
  children,
}: {
  label: string;
  busy?: boolean;
  width?: number;
  /** Runs whenever the menu shuts, so a half-finished confirm can be reset. */
  onClose?: () => void;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const close = () => {
    setOpen(false);
    onClose?.();
  };

  useLayoutEffect(() => {
    if (!open) return;

    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const left = Math.min(rect.right - width, window.innerWidth - width - 12);
      const below = rect.bottom + 8;
      const menuHeight = menuRef.current?.offsetHeight ?? 280;
      const flip = below + menuHeight > window.innerHeight - 12;
      setCoords({ top: flip ? Math.max(12, rect.top - menuHeight - 8) : below, left: Math.max(12, left) });
    };

    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, width]);

  useEffect(() => {
    if (!open) return;
    const shut = () => {
      setOpen(false);
      onClose?.();
    };
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) shut();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && shut();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const menu = open && coords && (
    <div
      ref={menuRef}
      style={{ top: coords.top, left: coords.left, width }}
      className="fixed z-[200] overflow-hidden rounded-[12px] border border-line bg-canvas shadow-[0_20px_48px_-14px_rgba(30,25,19,0.34)]"
    >
      {children(close)}
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        disabled={busy}
        aria-label={`Actions for ${label}`}
        aria-expanded={open}
        className={`rounded-full border p-1.5 transition-colors ${
          open ? "border-ink text-ink" : "border-line text-ink-soft hover:border-ink hover:text-ink"
        } ${busy ? "border-ink/30 text-ink" : ""}`}
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <MoreHorizontal size={16} />}
      </button>

      {typeof document !== "undefined" && menu ? createPortal(menu, document.body) : null}
    </>
  );
}

export const MENU_HEADING = "border-b border-line-soft px-3.5 py-2 text-[0.68rem] tracking-[0.12em] text-ink-faint uppercase";
export const MENU_ITEM =
  "flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[0.875rem] text-ink transition-colors hover:bg-canvas-deep disabled:opacity-40";
