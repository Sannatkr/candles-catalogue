/**
 * Placeholder shapes shown while an admin screen is still on its way.
 *
 * A spinner says "wait"; a skeleton says "here is what is coming, and where".
 * Each shape sits exactly where the real thing will land — same heights, same
 * columns — so nothing jumps when the data arrives. The shimmer is a slow
 * sweep of light rather than a pulse, which reads as loading without
 * flashing.
 */

export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <span aria-hidden style={style} className={`skeleton block rounded-[8px] ${className}`} />;
}

/** The title block every admin page opens with. */
export function HeadingSkeleton({ action = true }: { action?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-4 h-9 w-44 rounded-[10px]" />
        <Skeleton className="mt-3.5 h-3.5 w-72 max-w-full" />
      </div>
      {action && <Skeleton className="h-11 w-36 rounded-full" />}
    </div>
  );
}

/** A row of filter pills. */
export function ChipsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-9 shrink-0 rounded-full" style={{ width: 72 + ((i * 29) % 48) }} />
      ))}
    </div>
  );
}

/** A table: a header strip, then rows of cells with a thumbnail on the left. */
export function TableSkeleton({ rows = 7, thumb = true }: { rows?: number; thumb?: boolean }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-canvas">
      <div className="flex items-center gap-6 border-b border-line bg-canvas-deep/35 px-5 py-3.5">
        {[88, 36, 64, 72, 56, 64].map((w, i) => (
          <Skeleton key={i} className="h-2.5" style={{ width: w }} />
        ))}
      </div>
      <ul>
        {Array.from({ length: rows }, (_, i) => (
          <li
            key={i}
            className="flex items-center gap-4 border-b border-line-soft px-5 py-3.5 last:border-0"
            style={{ opacity: 1 - i * 0.09 }}
          >
            {thumb && <Skeleton className="h-11 w-11 shrink-0 rounded-[8px]" />}
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5" style={{ width: `${34 + ((i * 17) % 30)}%` }} />
              <Skeleton className="mt-2 h-2.5 w-24" />
            </div>
            <Skeleton className="hidden h-3.5 w-10 sm:block" />
            <Skeleton className="hidden h-3.5 w-16 md:block" />
            <Skeleton className="hidden h-3.5 w-20 md:block" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Orders, Enquiries, Products — a heading, filter pills and a table. */
export function ListPageSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      <HeadingSkeleton />
      <div className="mt-7">
        <ChipsSkeleton />
      </div>
      <div className="mt-6">
        <TableSkeleton rows={rows} />
      </div>
    </div>
  );
}

/** The revenue screen: a big number, a chart, two panels. */
export function RevenueSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="rounded-[16px] border border-line bg-canvas p-6 sm:p-7">
        <Skeleton className="h-2.5 w-40" />
        <Skeleton className="mt-4 h-12 w-56 rounded-[10px]" />
        <div className="mt-7 grid grid-cols-3 gap-4 border-t border-line pt-5">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="mt-2.5 h-5 w-20" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-[16px] border border-line bg-canvas p-6 sm:p-7">
        <Skeleton className="h-4 w-36" />
        <div className="mt-8 flex h-44 items-end gap-2">
          {[38, 62, 48, 80, 55, 92, 66, 44, 71, 58, 84, 50, 37, 69].map((h, i) => (
            <Skeleton key={i} className="w-full rounded-[6px]" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {[0, 1].map((panel) => (
          <div key={panel} className="rounded-[16px] border border-line bg-canvas p-6 sm:p-7">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2.5 h-2.5 w-48" />
            <div className="mt-7 space-y-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2.5 flex-1" style={{ width: `${70 - i * 14}%` }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The dashboard: three counters and three cards. */
export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-4 h-9 w-72 max-w-full rounded-[10px]" />
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-[14px] border border-line bg-canvas p-5">
            <Skeleton className="h-8 w-14 rounded-[8px]" />
            <Skeleton className="mt-3 h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-[14px] border border-line bg-canvas p-5">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="mt-5 h-4 w-32" />
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
