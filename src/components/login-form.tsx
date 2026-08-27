"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { sendLoginCode, verifyLoginCode } from "@/lib/account";
import { track } from "@/lib/analytics";

const FIELD =
  "w-full rounded-[12px] border border-line bg-surface px-4 py-3.5 text-[0.95rem] text-ink placeholder:text-ink-faint transition-colors focus:border-ink/50 focus:outline-none";

/**
 * Supabase lets the code be anywhere from 6 to 10 digits — it is a setting in
 * the dashboard, and this project's is 8. Hard-coding 6 here made the form
 * silently impossible to submit: the buyer types the whole code they were sent
 * and the button stays grey. Accept the whole range instead, so changing the
 * dashboard setting can never break the login again.
 */
const CODE_MIN = 6;
const CODE_MAX = 10;

/**
 * Must not be shorter than "Minimum interval per user" in
 * Supabase → Authentication → Emails → SMTP Settings, which is 60 seconds by
 * default. Offering a resend button before the server will honour it just earns
 * the buyer a rate-limit error for doing what we told them to do.
 */
const RESEND_AFTER = 60;

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const codeBox = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "code") codeBox.current?.focus();
  }, [step]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    const result = await sendLoginCode(email);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    track("login_code_sent");
    setStep("code");
    setCooldown(RESEND_AFTER);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await verifyLoginCode(email, code);
    if (!result.ok) {
      setBusy(false);
      setError(result.message);
      setCode("");
      codeBox.current?.focus();
      return;
    }
    track("login_succeeded");
    router.replace(next);
    router.refresh();
  }

  if (step === "email") {
    return (
      <form onSubmit={send} className="mt-8">
        <label className="block">
          <span className="text-[0.85rem] font-medium text-ink">Your email</span>
          <input
            required
            autoFocus
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`mt-2.5 ${FIELD}`}
          />
        </label>

        {error && <p className="mt-4 text-[0.85rem] text-ember-deep">{error}</p>}

        <button
          type="submit"
          disabled={busy || !email.trim()}
          className="mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-ink px-7 py-4 text-[0.95rem] text-canvas transition-colors hover:bg-ember disabled:opacity-40"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
          {busy ? "Sending…" : "Send me a code"}
        </button>

        <p className="mt-4 text-center text-[0.8rem] leading-relaxed text-ink-faint">
          No password to remember. We email you a code.
          <br />
          First time here? This makes your account too.
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={verify} className="mt-8">
      <button
        type="button"
        onClick={() => {
          setStep("email");
          setCode("");
          setError("");
        }}
        className="inline-flex items-center gap-2 text-[0.85rem] text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} />
        Change email
      </button>

      <p className="mt-5 text-[0.95rem] leading-relaxed text-ink-soft">
        We sent a code to <span className="text-ink">{email}</span>.
      </p>

      <label className="mt-5 block">
        <span className="text-[0.85rem] font-medium text-ink">Your code</span>
        <input
          ref={codeBox}
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={CODE_MAX}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_MAX))}
          placeholder="Code from the email"
          className={`mt-2.5 text-center text-[1.35rem] tracking-[0.3em] tabular-nums placeholder:text-[0.9rem] placeholder:tracking-normal ${FIELD}`}
        />
      </label>

      {error && <p className="mt-4 text-[0.85rem] text-ember-deep">{error}</p>}

      <button
        type="submit"
        disabled={busy || code.length < CODE_MIN}
        className="mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-ink px-7 py-4 text-[0.95rem] text-canvas transition-colors hover:bg-ember disabled:opacity-40"
      >
        {busy && <Loader2 size={16} className="animate-spin" />}
        {busy ? "Checking…" : "Sign in"}
      </button>

      <button
        type="button"
        onClick={() => send()}
        disabled={cooldown > 0 || busy}
        className="mt-3 w-full rounded-full px-7 py-3 text-[0.85rem] text-ink-soft transition-colors hover:text-ink disabled:opacity-50"
      >
        {cooldown > 0 ? `Send another in ${cooldown}s` : "Send another code"}
      </button>

      <p className="mt-4 text-center text-[0.8rem] leading-relaxed text-ink-faint">
        Check your spam folder if it has not arrived.
      </p>
    </form>
  );
}
