"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { lookupPincode } from "@/lib/pincode";

/**
 * Watches a pincode and, once it is six digits, looks up the district and
 * state so the "City or state" box fills itself. It only overwrites what it
 * wrote earlier — a city typed by hand is left alone.
 */
export function usePincodeFill(pincode: string, place: string, setPlace: (v: string) => void) {
  const [found, setFound] = useState<{ pincode: string; label: string } | null>(null);
  const [auto, setAuto] = useState("");

  const ok = /^\d{6}$/.test(pincode);
  // A six-digit pincode with no answer yet is one being looked up.
  const looking = ok && found?.pincode !== pincode;

  useEffect(() => {
    if (!ok) return;
    if (found?.pincode === pincode) return;
    const controller = new AbortController();
    lookupPincode(pincode, controller.signal).then((hit) => {
      if (controller.signal.aborted) return;
      if (!hit) {
        setFound({ pincode, label: "" });
        return;
      }
      const label = [hit.district, hit.state].filter(Boolean).join(", ");
      setFound({ pincode, label });
      // Fill the box when it is empty or still holds our last suggestion.
      if (!place.trim() || place === auto) {
        setPlace(label);
        setAuto(label);
      }
    });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincode, ok]);

  const hint = looking
    ? "Looking up the pincode…"
    : found?.pincode === pincode && ok
      ? found.label
        ? `Serviceable: ${found.label}`
        : "Pincode not found — type the city yourself."
      : "";

  return { hint, looking, matched: Boolean(found?.label) && found?.pincode === pincode };
}

export function PincodeHint({ hint, looking }: { hint: string; looking: boolean }) {
  if (!hint) return null;
  return (
    <span className="mt-1.5 flex items-center gap-1.5 text-[0.75rem] text-ink-faint">
      {looking ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
      {hint}
    </span>
  );
}
