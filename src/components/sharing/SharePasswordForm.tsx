"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Lock } from "lucide-react";
import { inputStyles } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface SharePasswordFormProps {
  token: string;
}

export function SharePasswordForm({ token }: SharePasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function unlock(event: React.FormEvent) {
    event.preventDefault();
    if (!password.trim()) {
      setError("Enter the password for this link.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/share/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "That password isn’t right.");
      }
      setPassword("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That password isn’t right.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={unlock} className="space-y-3">
      <div className="rounded-2xl border border-line bg-surface2/50 p-4">
        <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
          <Lock className="h-4 w-4 text-primary-deep dark:text-primary-soft" />
          This link is protected
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Ask the person who shared it for the password. It is checked on the
          server and never stored in this browser.
        </p>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink">
          Link password
        </span>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError(null);
            }}
            autoComplete="current-password"
            autoFocus
            maxLength={100}
            placeholder="Enter the password"
            aria-invalid={error ? true : undefined}
            className={cn(inputStyles, "pl-10")}
          />
        </div>
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-2xl bg-[#E892A2]/15 px-3 py-2 text-xs font-medium text-[#a34b60] dark:text-[#f3b3c0]"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-[#3d3153] shadow-soft transition hover:bg-primary-deep hover:text-white disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Lock className="h-4 w-4" />
        )}
        {busy ? "Checking…" : "Open this file"}
      </button>
    </form>
  );
}
