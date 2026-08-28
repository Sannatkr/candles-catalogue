import { Loader2 } from "lucide-react";

/** Shown while an admin page loads, so a click never feels like it hung. */
export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-ink-faint" aria-label="Loading" />
    </div>
  );
}
