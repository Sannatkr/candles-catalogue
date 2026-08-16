export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[18px] border border-dashed border-line bg-surface px-8 py-20 text-center">
      <p className="font-display text-[1.5rem] text-ink">{title}</p>
      <p className="mx-auto mt-3 max-w-[46ch] text-[0.95rem] leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}
