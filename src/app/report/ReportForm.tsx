"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

// Reports are stored in Supabase and reviewed in the operator panel, so they
// are no longer forwarded to a third-party form service.
const REPORT_ENDPOINT = "/api/report";

const CATEGORIES = [
  { value: "upload", label: "Upload or preview problem" },
  { value: "preview", label: "Something is broken" },
  { value: "summary", label: "AI summary problem" },
  { value: "sharing", label: "Share link problem" },
  { value: "account", label: "Account or sign-in problem" },
  { value: "performance", label: "Slow or laggy" },
  { value: "other", label: "Something else" },
];

export function ReportForm({ defaultEmail }: { defaultEmail: string }) {
  const [category, setCategory] = useState("preview");
  const [email, setEmail] = useState(defaultEmail);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [steps, setSteps] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError("Add a valid email so we can reply.");
      return;
    }
    if (title.trim().length < 4) {
      setError("Give your report a short title.");
      return;
    }
    if (details.trim().length < 15) {
      setError("Describe what happened — at least 15 characters.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(REPORT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category,
          title: title.trim(),
          details: details.trim(),
          steps: steps.trim(),
          email: email.trim(),
          pageUrl: typeof window !== "undefined" ? window.location.href : "",
        }),
      });

      if (!response.ok) {
        let message = "Your report could not be sent. Please try again.";
        try {
          const payload = (await response.json()) as { error?: string };
          if (payload.error) message = payload.error;
        } catch {
          // keep the generic message
        }
        throw new Error(message);
      }

      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Your report could not be sent."
      );
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <Card className="p-6 text-center sm:p-8">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#DDF3E8] text-[#2f7a5c]">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h2 className="mt-3 text-xl font-extrabold tracking-tight text-ink">
          Thanks — report received
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          We will take a look and reply to <strong className="text-ink">{email}</strong>{" "}
          if we need more details.
        </p>
        <Button
          variant="soft"
          className="mt-5"
          onClick={() => {
            setSent(false);
            setTitle("");
            setDetails("");
            setSteps("");
          }}
        >
          Send another report
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-6">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <span className="mb-1.5 block text-sm font-bold text-ink">
            What is this about?
          </span>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setCategory(option.value)}
                aria-pressed={category === option.value}
                className={cn(
                  "rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition",
                  category === option.value
                    ? "border-primary bg-primary text-primary-ink"
                    : "border-line bg-surface text-muted hover:border-primary/40 hover:text-ink"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-ink">
            Your email
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="you@example.com"
            className="w-full rounded-2xl border-2 border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/15"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-ink">
            Short title
          </span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            required
            placeholder="e.g. Upload fails on large PDFs"
            className="w-full rounded-2xl border-2 border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/15"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-ink">
            What happened?
          </span>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={5}
            maxLength={4000}
            required
            placeholder="Describe the problem and what you expected instead."
            className="w-full resize-y rounded-2xl border-2 border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/15"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-ink">
            Steps to reproduce{" "}
            <span className="font-normal text-muted">(optional)</span>
          </span>
          <textarea
            value={steps}
            onChange={(event) => setSteps(event.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={"1. Go to…\n2. Tap…\n3. See the error"}
            className="w-full resize-y rounded-2xl border-2 border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/15"
          />
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-2xl bg-[#E892A2]/15 px-3 py-2 text-xs font-medium text-[#a34b60] dark:text-[#f3b3c0]"
          >
            {error}
          </p>
        )}

        <Button type="submit" loading={busy} loadingLabel="Sending…" className="w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send report
        </Button>
        <p className="text-center text-[10px] leading-relaxed text-muted">
          Stored privately in LumiNest. We only use your email to reply about
          this report.
        </p>
      </form>
    </Card>
  );
}
