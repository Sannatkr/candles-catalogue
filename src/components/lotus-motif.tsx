/**
 * The engraved lotus rosette behind the offer banner.
 *
 * Drawn rather than photographed. A darkened, blurred photograph reads as a
 * photograph someone has hidden; fine gold linework on a dark ground reads as
 * something made — which is the claim the whole shop rests on. It is also a few
 * hundred bytes of vector instead of a hero JPEG, stays crisp at any width, and
 * needs no image request on a phone.
 *
 * The geometry is the shop's own: concentric rings and radiating petals, the
 * layout of the brass urlis and diya plates the range is built from.
 */

const PETALS = 16;
const INNER_PETALS = 8;

export function LotusMotif({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      aria-hidden
      focusable="false"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="0.9"
      vectorEffect="non-scaling-stroke"
    >
      {/* The rings the petals sit between. */}
      {[186, 158, 128, 74, 52, 26].map((r) => (
        <circle
          key={r}
          cx="200"
          cy="200"
          r={r}
          opacity={r > 120 ? 0.5 : 0.75}
        />
      ))}

      {/* Outer petals — long, narrow, the way a lotus reads from above. */}
      {Array.from({ length: PETALS }, (_, i) => (
        <ellipse
          key={`o${i}`}
          cx="200"
          cy="115"
          rx="15"
          ry="43"
          opacity="0.62"
          transform={`rotate(${(360 / PETALS) * i} 200 200)`}
        />
      ))}

      {/* Inner petals, offset half a step so the two rings interlock. */}
      {Array.from({ length: INNER_PETALS }, (_, i) => (
        <ellipse
          key={`i${i}`}
          cx="200"
          cy="163"
          rx="11"
          ry="24"
          opacity="0.85"
          transform={`rotate(${(360 / INNER_PETALS) * i + 360 / (INNER_PETALS * 2)} 200 200)`}
        />
      ))}

      {/* The ticks around the rim — the beaded edge of a brass plate. */}
      {Array.from({ length: 48 }, (_, i) => (
        <line
          key={`t${i}`}
          x1="200"
          y1="192"
          x2="200"
          y2="199"
          opacity="0.5"
          transform={`rotate(${(360 / 48) * i} 200 200) translate(0 -1)`}
        />
      ))}
    </svg>
  );
}
