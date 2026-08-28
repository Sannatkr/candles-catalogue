import { Loader2 } from "lucide-react";

/** Shown the moment a storefront page is navigated to, until it is ready. */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-ink-faint" aria-label="Loading" />
    </div>
  );
}
