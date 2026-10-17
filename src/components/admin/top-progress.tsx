"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * A hairline of progress along the top of the admin, the way GitHub and
 * YouTube show that a click landed. It starts the moment a link inside the
 * admin is pressed and finishes when the address changes. Between the two the
 * bar creeps towards 90% and waits — it never pretends to be done early.
 */
export function TopProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hide = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  const start = () => {
    if (hide.current) clearTimeout(hide.current);
    stop();
    setVisible(true);
    setProgress(8);
    timer.current = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.max(0.4, (90 - p) * 0.06) : p));
    }, 120);
  };

  const finish = () => {
    stop();
    setProgress(100);
    hide.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 320);
  };

  // Any click on an in-app link, or a form submit, starts the bar.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      start();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("admin:navigate", start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("admin:navigate", start);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The address changed: the new screen is here.
  const key = `${pathname}?${search.toString()}`;
  const last = useRef(key);
  useEffect(() => {
    if (last.current !== key) {
      last.current = key;
      if (timer.current) finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[400] h-[3px]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 220ms ease" }}
    >
      <div
        className="h-full rounded-r-full bg-ember shadow-[0_0_10px_rgba(180,95,43,0.7)]"
        style={{ width: `${progress}%`, transition: "width 160ms ease-out" }}
      />
    </div>
  );
}

/** Tell the bar a navigation is starting from code rather than a link click. */
export function signalNavigate() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("admin:navigate"));
}
