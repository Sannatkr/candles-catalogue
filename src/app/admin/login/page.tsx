"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Loader2 } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const { error: authError } = await getBrowserSupabase().auth.signInWithPassword({ email, password });

    if (authError) {
      setError("That email and password did not match. Try again.");
      setBusy(false);
      return;
    }

    router.replace(params.get("next") || "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-[380px]">
      <p className="eyebrow">Sugandha Candles</p>
      <h1 className="mt-3 font-display text-[2.1rem] leading-tight tracking-[-0.02em] text-ink">Admin</h1>
      <p className="mt-2 text-[0.9rem] text-ink-soft">Sign in to manage the catalogue.</p>

      <div className="mt-8 space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="username"
          required
          className="w-full rounded-[10px] border border-line bg-surface px-4 py-3 text-[0.925rem] text-ink placeholder:text-ink-faint focus:border-ink/40 focus:outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          required
          className="w-full rounded-[10px] border border-line bg-surface px-4 py-3 text-[0.925rem] text-ink placeholder:text-ink-faint focus:border-ink/40 focus:outline-none"
        />
      </div>

      {error && <p className="mt-3 text-[0.85rem] text-ember-deep">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[0.925rem] text-canvas transition-colors hover:bg-ember disabled:opacity-60"
      >
        {busy && <Loader2 size={16} className="animate-spin" />}
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
