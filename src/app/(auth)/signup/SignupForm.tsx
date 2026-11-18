"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, MailCheck, Sparkles, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Mascot } from "@/components/mascot/Mascot";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { ConsentCheckbox } from "@/components/auth/ConsentCheckbox";

const USERNAME_PATTERN = /^[a-zA-Z0-9._\- ]{2,40}$/;

export function SignupForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingEmail, setAwaitingEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!consent) {
      setConsentError(true);
      return;
    }
    setConsentError(false);

    const cleanUsername = username.trim();
    if (!USERNAME_PATTERN.test(cleanUsername)) {
      setError("Use 2–40 letters, numbers, spaces, dots, dashes or underscores.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don’t match yet.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { username: cleanUsername },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (signupError) throw new Error(signupError.message);

      if (data.session) {
        router.push("/home");
        router.refresh();
        return;
      }
      setAwaitingEmail(true);
      setLoading(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "We couldn’t create your account.";
      setError(
        /already registered|already been registered/i.test(message)
          ? "That email already has a nest. Try signing in instead."
          : message
      );
      setLoading(false);
    }
  }

  if (awaitingEmail) {
    return (
      <Card className="p-6 text-center sm:p-8">
        <Mascot expression="excited" size={150} glow className="mx-auto" />
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
          One tiny hop left
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          We sent a confirmation link to{" "}
          <span className="font-semibold text-ink">{email}</span>. Open it and
          Lumi will show you around.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full border-2 border-[#6d5b90]/30 bg-primary px-6 text-sm font-bold text-[#3d3153] shadow-toony-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep hover:text-white active:translate-y-0.5 active:shadow-[0_1px_0_0_#6b55a4]"
        >
          Back to sign in
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-deep dark:text-primary-soft">
            A fresh start
          </p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Make your little nest
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Free, private, and ready for your first file.
          </p>
        </div>
        <Mascot expression="excited" size={86} animation="float" className="shrink-0" />
      </div>

      <GoogleButton
        label="Sign up with Google"
        next="/onboarding"
        consentGiven={consent}
        onConsentRequired={() => setConsentError(true)}
      />
      <AuthDivider />

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="What should Lumi call you?"
          name="username"
          autoComplete="nickname"
          placeholder="e.g. Mia"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          maxLength={40}
          required
          hint="This is your display name, not your email."
        />
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
          <label htmlFor="password" className="text-sm font-bold text-ink">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
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
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Input
          label="Confirm password"
          type={showPassword ? "text" : "password"}
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Once more, just to be sure"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          required
        />

        {error && (
          <p
            role="alert"
            className="rounded-2xl border-2 border-[#E892A2]/30 bg-[#E892A2]/15 px-4 py-3 text-sm font-medium text-[#a34b60] dark:text-[#f3b3c0]"
          >
            {error}
          </p>
        )}

        <ConsentCheckbox
          id="signup-consent"
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
          loadingLabel="Building your nest…"
          className="w-full"
        >
          <UserPlus className="h-4 w-4" />
          Create my nest
        </Button>
        <p className="text-center text-[11px] leading-relaxed text-muted">
          <MailCheck className="mr-1 inline-block h-3.5 w-3.5 -translate-y-px align-middle" />
          Your files live in a private bucket. Only you can open them.
        </p>
      </form>

      <div className="mt-6 flex items-center justify-center gap-1 text-sm text-muted">
        Already have a nest?
        <Link
          href="/login"
          className="font-semibold text-primary-deep underline-offset-4 hover:underline dark:text-primary-soft"
        >
          Sign in
        </Link>
      </div>
      <p className="mt-4 flex items-center justify-center gap-1 text-[10px] text-muted/80">
        <Sparkles className="h-3 w-3" /> LumiNest · Your little space for everything
      </p>
    </Card>
  );
}
