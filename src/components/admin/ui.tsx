"use client";

import { useFormStatus } from "react-dom";

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[0.8rem] font-medium text-ink">{label}</span>
      {hint && <span className="mt-0.5 block text-[0.75rem] text-ink-faint">{hint}</span>}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

const base =
  "w-full rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-[0.9rem] text-ink placeholder:text-ink-faint focus:border-ink/40 focus:outline-none";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${base} ${props.className ?? ""}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${base} min-h-[110px] leading-relaxed ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${base} ${props.className ?? ""}`} />;
}

export function Toggle({
  name,
  defaultChecked,
  label,
  hint,
}: {
  name: string;
  defaultChecked?: boolean;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-line bg-surface px-3.5 py-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 accent-[#b45f2b]"
      />
      <span>
        <span className="block text-[0.875rem] text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-[0.75rem] text-ink-faint">{hint}</span>}
      </span>
    </label>
  );
}

export function SubmitButton({ children = "Save" }: { children?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-ink px-7 py-3 text-[0.9rem] text-canvas transition-colors hover:bg-ember disabled:opacity-50"
    >
      {pending ? "Saving…" : children}
    </button>
  );
}

export function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[16px] border border-line bg-canvas p-6 sm:p-7">
      <h2 className="font-display text-[1.2rem] text-ink">{title}</h2>
      {hint && <p className="mt-1 text-[0.825rem] text-ink-soft">{hint}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function Notice({ ok, message }: { ok: boolean; message: string }) {
  if (!message) return null;
  return (
    <p
      className={`rounded-[10px] px-4 py-3 text-[0.875rem] ${
        ok ? "bg-[#eaf0e6] text-[#41552f]" : "bg-ember-wash text-ember-deep"
      }`}
    >
      {message}
    </p>
  );
}
