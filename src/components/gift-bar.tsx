"use client";

import { useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { Gift, Sparkles, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";
import { amountToGift, giftUnlocked } from "@/lib/gift";
import { useGiftConfig } from "@/lib/gift-context";

/**
 * One thin strip under the header, doing two jobs that would otherwise want two
 * elements: announcing the offer to someone who has not started, and tracking
 * progress for someone who has.
 *
 * Deliberately the ONLY persistent thing on the page. NN/g's work on stacked
 * overlays is unambiguous that competing sticky elements eat a phone screen
 * alive, and at 375px there is room for exactly one. This shop has no cookie
 * banner, no newsletter pop-up and no sticky add-to-cart, so that budget is
 * spent here.
 *
 * No sheen here, unlike the card. A shimmer that repeats forever on a strip
 * that never leaves the screen stops reading as gold and starts reading as a
 * flashing advert; the card can afford the flourish because you scroll past it.
 *
 * It is dismissible, and the dismissal is remembered for the session. Under
 * India's dark-pattern rules "nagging" — re-showing something the user has
 * already waved away — is a notified violation, so a closed bar stays closed
 * until they come back another day.
 */

const DISMISS_KEY = "sugandha.giftbar.dismissed.v1";

/**
 * sessionStorage is an external store, so it is read through
 * useSyncExternalStore rather than copied into state inside an effect — the
 * same approach the cart uses. That keeps the server render and the first
 * client render in agreement without a set-state-on-mount round trip.
 */
const dismissListeners = new Set<() => void>();
let dismissedSnapshot: boolean | undefined;

function isDismissed() {
  if (dismissedSnapshot === undefined) {
    try {
      dismissedSnapshot = window.sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      dismissedSnapshot = false;
    }
  }
  return dismissedSnapshot;
}

function subscribeDismissed(onChange: () => void) {
  dismissListeners.add(onChange);
  return () => {
    dismissListeners.delete(onChange);
  };
}

function dismiss() {
  dismissedSnapshot = true;
  try {
    window.sessionStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // Session-only dismissal is fine.
  }
  dismissListeners.forEach((listener) => listener());
}

export function GiftBar() {
  const { subtotal, giftSlug, ready } = useCart();
  const config = useGiftConfig();
  // Hidden during the server render and the hydration pass, so a bar someone
  // already closed never flashes up before disappearing again.
  const dismissed = useSyncExternalStore(subscribeDismissed, isDismissed, () => true);
  const close = useCallback(() => dismiss(), []);

  if (!config.enabled || config.threshold <= 0 || dismissed) return null;

  const unlocked = giftUnlocked(config, subtotal);
  const missing = amountToGift(config, subtotal);
  const pct = ready && subtotal > 0 ? Math.min(100, (subtotal / config.threshold) * 100) : 0;

  // Once the candle is chosen the bar has nothing left to say; it would just be
  // a strip of screen repeating something already settled in the bag.
  if (unlocked && giftSlug) return null;

  return (
    <div
      className={`relative overflow-hidden border-b ${
        unlocked
          ? "border-[#c9a227]/40 bg-[linear-gradient(100deg,#fbf1d9,#f6e7c4)]"
          : "border-line-soft bg-[linear-gradient(100deg,#fdf9f0,#faf3e4)]"
      }`}
    >
      <div className="relative mx-auto flex max-w-[1240px] items-center gap-2.5 px-4 py-2.5 sm:gap-3 sm:px-8">
        <span className="shrink-0 text-[#b8860b]">
          {unlocked ? <Sparkles size={15} /> : <Gift size={15} />}
        </span>

        <p className="min-w-0 flex-1 truncate text-[0.8rem] leading-snug text-ink sm:text-[0.86rem]">
          {unlocked ? (
            <>
              <b>Free candle unlocked.</b>{" "}
              <Link href="/cart" className="underline underline-offset-2">
                Pick yours
              </Link>
            </>
          ) : pct > 0 ? (
            <>
              <b className="tabular-nums">{money(missing)}</b> more for a free candle
              {config.surpriseEnabled && <span className="hidden sm:inline"> + a surprise gift</span>}
            </>
          ) : (
            <>
              Free candle{config.surpriseEnabled && <> + a surprise gift</>} on orders over{" "}
              <b className="tabular-nums">{money(config.threshold)}</b>
            </>
          )}
        </p>

        <button
          type="button"
          onClick={close}
          aria-label="Hide the free candle offer"
          className="-mr-1.5 shrink-0 rounded-full p-1.5 text-ink-faint transition-colors hover:bg-canvas-deep hover:text-ink"
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress as a hairline along the bottom edge — it costs no height, and
          scaleX keeps it off the layout path. */}
      {pct > 0 && !unlocked && (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 block h-[2px] origin-left bg-[linear-gradient(90deg,#d98b4a,#e5c07b)] transition-transform duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `scaleX(${pct / 100})` }}
        />
      )}
    </div>
  );
}
