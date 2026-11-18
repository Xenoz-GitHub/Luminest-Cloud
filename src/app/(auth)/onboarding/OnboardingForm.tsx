"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { Mascot } from "@/components/mascot/Mascot";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { initials } from "@/lib/format";

const USERNAME_PATTERN = /^[a-zA-Z0-9._\- ]{2,40}$/;

interface OnboardingFormProps {
  initialName: string;
  avatarUrl: string | null;
  email: string;
}

export function OnboardingForm({ initialName, avatarUrl, email }: OnboardingFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A broken avatar (expired Google URL, blocked host, offline) should degrade
  // to the user's initials rather than a broken-image icon.
  const [avatarFailed, setAvatarFailed] = useState(false);

  async function finish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const clean = name.trim();
    if (!USERNAME_PATTERN.test(clean)) {
      setError("Use 2–40 letters, numbers, spaces, dots, dashes or underscores.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: clean,
          ...(avatarUrl ? { avatarUrl } : {}),
          preferences: { onboarded: true },
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "We couldn’t save your name.");
      }
      router.push("/home");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-deep dark:text-primary-soft">
            One quick hello
          </p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Welcome to your nest
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Tell Lumi what to call you. You can change this later in Profile.
          </p>
        </div>
        <Mascot expression="excited" size={86} animation="float" className="shrink-0" />
      </div>

      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-line bg-surface2/50 p-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary/30 to-secondary/50 text-sm font-extrabold text-primary-deep ring-2 ring-primary/25 dark:text-primary-soft">
          {avatarUrl && !avatarFailed ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            initials(name || email || "LumiNest")
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">{name || "friend"}</p>
          <p className="truncate text-xs text-muted">{email || "Signed in with Google"}</p>
        </div>
      </div>

      <form onSubmit={finish} className="space-y-4" noValidate>
        <Input
          label="What should Lumi call you?"
          name="username"
          autoComplete="nickname"
          placeholder="e.g. Mia"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={40}
          required
          hint="2–40 letters, numbers, spaces, dots, dashes or underscores."
        />

        {error && (
          <p
            role="alert"
            className="rounded-2xl border-2 border-[#E892A2]/30 bg-[#E892A2]/15 px-4 py-3 text-sm font-medium text-[#a34b60] dark:text-[#f3b3c0]"
          >
            {error}
          </p>
        )}

        <Button type="submit" loading={saving} loadingLabel="Opening your nest…" className="w-full">
          Open my nest
          <ArrowRight className="h-4 w-4" />
        </Button>
        <p className="text-center text-[11px] leading-relaxed text-muted">
          <Sparkles className="mr-1 inline-block h-3.5 w-3.5 -translate-y-px align-middle" />
          Your files stay private in your own bucket.
        </p>
      </form>
    </Card>
  );
}
