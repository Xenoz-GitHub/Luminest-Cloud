"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Mascot } from "@/components/mascot/Mascot";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { ConsentCheckbox } from "@/components/auth/ConsentCheckbox";

function friendlyAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) {
    return "That email and password don’t match. Try again or reset your password.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Please confirm your email first, then come back to sign in.";
  }
  if (/rate limit|too many/i.test(message)) {
    return "Too many attempts. Give it a minute and try again.";
  }
  return message;
}

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);

  const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/home";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (!consent) {
      setConsentError(true);
      return;
    }
    setConsentError(false);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw new Error(signInError.message);
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(
        friendlyAuthError(
          err instanceof Error ? err.message : "We couldn’t sign you in."
        )
      );
      setLoading(false);
    }
  }

  async function sendReset() {
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError("Add your email first, then tap “Forgot password”.");
      return;
    }
    setResetting(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/auth/callback?next=/profile` }
      );
      if (resetError) throw new Error(resetError.message);
      setNotice("A reset link is on its way to your inbox.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "We couldn’t send the reset email."
      );
    } finally {
      setResetting(false);
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-deep dark:text-primary-soft">
            Welcome back
          </p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Sign in to your nest
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Lumi kept everything exactly where you left it.
          </p>
        </div>
        <Mascot expression="happy" size={86} animation="float" className="shrink-0" />
      </div>

      <GoogleButton
        label="Continue with Google"
        next="/onboarding"
        consentGiven={consent}
        onConsentRequired={() => setConsentError(true)}
      />
      <AuthDivider />

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-bold text-ink">
              Password
            </label>
            <button
              type="button"
              onClick={sendReset}
              disabled={resetting}
              className="text-xs font-semibold text-primary-deep underline-offset-4 hover:underline disabled:opacity-50 dark:text-primary-soft"
            >
              {resetting ? "Sending…" : "Forgot password?"}
            </button>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-2xl border-2 border-line bg-surface px-4 py-3 pr-12 text-sm text-ink shadow-toony-sm outline-none transition placeholder:text-muted/70 focus:border-primary focus:shadow-none focus:ring-4 focus:ring-primary/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border-2 border-transparent text-muted transition hover:border-line hover:bg-surface2 hover:text-ink"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-2xl border-2 border-[#E892A2]/30 bg-[#E892A2]/15 px-4 py-3 text-sm font-medium text-[#a34b60] dark:text-[#f3b3c0]"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="flex items-center gap-2 rounded-2xl border-2 border-[#7FC8A9]/30 bg-[#7FC8A9]/15 px-4 py-3 text-sm font-medium text-[#2f7a5c] dark:text-[#a7e6cb]"
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            {notice}
          </p>
        )}

        <ConsentCheckbox
          id="login-consent"
          checked={consent}
          onChange={(value) => {
            setConsent(value);
            if (value) setConsentError(false);
          }}
          invalid={consentError}
        />
        {consentError && (
          <p className="text-xs font-medium text-[#a34b60] dark:text-[#f3b3c0]">
            Please accept the Terms and Privacy Policy to continue.
          </p>
        )}

        <Button
          type="submit"
          loading={loading}
          loadingLabel="Opening your nest…"
          className="w-full"
        >
          <LogIn className="h-4 w-4" />
          Sign in
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-center gap-1 text-sm text-muted">
        New here?
        <Link
          href="/signup"
          className="font-semibold text-primary-deep underline-offset-4 hover:underline dark:text-primary-soft"
        >
          Make your nest
        </Link>
      </div>
    </Card>
  );
}
