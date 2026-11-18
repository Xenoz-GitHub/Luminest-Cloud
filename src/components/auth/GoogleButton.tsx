"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type GoogleButtonProps = {
  label?: string;
  /** Where to send the user after the OAuth callback. Defaults to onboarding. */
  next?: string;
  /** When false, tapping shows a consent prompt instead of starting OAuth. */
  consentGiven?: boolean;
  /** Called when tapped without consent, so the parent can highlight the box. */
  onConsentRequired?: () => void;
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="h-4 w-4">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.2 5.2C36.9 40.3 44 35 44 24c0-1.3-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

export function GoogleButton({
  label = "Continue with Google",
  next,
  consentGiven = true,
  onConsentRequired,
}: GoogleButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    if (loading) return;
    if (!consentGiven) {
      setError("Please tick the agreement box below before continuing with Google.");
      onConsentRequired?.();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const destination = next ?? "/onboarding";
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        destination
      )}`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account" },
        },
      });
      if (oauthError) throw new Error(oauthError.message);
      // On success the browser is redirected to Google; keep the spinner on.
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Google sign-in couldn’t start. Please try again."
      );
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={loading}
        aria-busy={loading || undefined}
        className="inline-flex h-11 w-full select-none items-center justify-center gap-2.5 rounded-full border-2 border-line bg-surface text-sm font-bold text-ink shadow-toony-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-surface2 active:translate-y-0.5 active:shadow-none disabled:pointer-events-none disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
        {loading ? "Connecting to Google…" : label}
      </button>
      {error && (
        <p
          role="alert"
          className="mt-2 rounded-2xl bg-[#E892A2]/15 px-3 py-2 text-xs font-medium text-[#a34b60] dark:text-[#f3b3c0]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
