"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";

/** PIN entry. The PIN is only ever sent to the server for comparison. */
export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/blank-page/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "That PIN is not correct.");
      }
      setPin("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-[28px] border-2 border-line bg-surface/90 p-6 shadow-toony sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary-deep dark:text-primary-soft">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">
          Restricted area
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Enter the operator PIN to continue. Sessions last 8 hours and every
          access is logged.
        </p>

        {!configured && (
          <p className="mt-4 rounded-2xl bg-[#E892A2]/15 px-4 py-3 text-xs font-medium leading-relaxed text-[#a34b60] dark:text-[#f3b3c0]">
            This deployment has no admin PIN configured, so the panel cannot be
            unlocked. Set <code>ADMIN_PIN_HASH</code> on the server.
          </p>
        )}

        <form onSubmit={submit} className="mt-5 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-ink">
              Operator PIN
            </span>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="password"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                autoComplete="current-password"
                autoFocus
                disabled={!configured || busy}
                aria-label="Operator PIN"
                className="h-12 w-full rounded-2xl border-2 border-line bg-surface pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:opacity-60"
              />
            </div>
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-2xl bg-[#E892A2]/15 px-4 py-2.5 text-xs font-medium text-[#a34b60] dark:text-[#f3b3c0]"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!configured || busy || !pin}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-[#6d5b90]/30 bg-primary text-sm font-bold text-[#3d3153] shadow-toony-primary transition hover:-translate-y-0.5 hover:bg-primary-deep hover:text-white active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}
