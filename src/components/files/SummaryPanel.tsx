"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  Copy,
  Download,
  Lightbulb,
  ListChecks,
  Loader2,
  RefreshCw,
  Sparkles,
  Tag,
} from "lucide-react";
import { Mascot } from "@/components/mascot/Mascot";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import { summarizeLocally } from "@/lib/ai/local-summarizer";
import type { AiCreditStatus, FileSummary, SummaryContent } from "@/types";

interface SummaryView {
  overview: string;
  mainIdeas: string[];
  importantPoints: string[];
  keyTerms: string[];
  importantDates: string[];
  conclusions: string;
  pageReferences: string[];
  summaryText: string;
  provider: string;
  generatedAt: string | null;
}

interface SummaryPanelProps {
  fileId: string;
  fileName: string;
  initialSummary: FileSummary | null;
  hasExtractedText: boolean;
  extractedCharacters: number;
  /** Extracted text, so an on-device summary can run without a connection. */
  extractedText?: string | null;
}

function localToView(
  local: ReturnType<typeof summarizeLocally>,
  summaryText: string
): SummaryView {
  return {
    overview: local.content.overview,
    mainIdeas: local.content.mainIdeas,
    importantPoints: local.content.importantPoints,
    keyTerms: local.content.keyTerms,
    importantDates: local.content.importantDates,
    conclusions: local.content.conclusions,
    pageReferences: local.content.pageReferences,
    summaryText,
    provider: "local",
    generatedAt: new Date().toISOString(),
  };
}

function fromRecord(summary: FileSummary | null): SummaryView | null {
  if (!summary) return null;
  const content = summary.key_points as SummaryContent | null;
  return {
    overview: content?.overview ?? "",
    mainIdeas: content?.mainIdeas ?? [],
    importantPoints: content?.importantPoints ?? [],
    keyTerms: content?.keyTerms ?? [],
    importantDates: content?.importantDates ?? [],
    conclusions: content?.conclusions ?? "",
    pageReferences: content?.pageReferences ?? [],
    summaryText: summary.summary,
    provider: summary.provider,
    generatedAt: summary.generated_at,
  };
}

function Section({
  title,
  items,
  icon: Icon,
}: {
  title: string;
  items: string[];
  icon: typeof ListChecks;
}) {
  if (!items.length) return null;
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary-deep dark:text-primary-soft">
        <Icon className="h-3.5 w-3.5" /> {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}`}
            className="flex gap-2 text-xs leading-relaxed text-ink"
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SummaryPanel({
  fileId,
  fileName,
  initialSummary,
  hasExtractedText,
  extractedCharacters,
  extractedText,
}: SummaryPanelProps) {
  const [summary, setSummary] = useState<SummaryView | null>(() =>
    fromRecord(initialSummary)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [credits, setCredits] = useState<AiCreditStatus | null>(null);
  const [aiAvailable, setAiAvailable] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setSummary(fromRecord(initialSummary));
  }, [initialSummary]);

  useEffect(() => {
    let active = true;
    fetch("/api/ai/credits", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { credits?: AiCreditStatus; aiAvailable?: boolean } | null) => {
        if (!active) return;
        if (payload?.credits) setCredits(payload.credits);
        if (payload?.aiAvailable === false) setAiAvailable(false);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  function summarizeOnDevice(): boolean {
    const text = (extractedText ?? "").trim();
    if (text.length < 40) return false;
    try {
      const local = summarizeLocally({ text, fileName });
      const summaryText = [
        local.content.overview,
        ...local.content.mainIdeas.map((item) => `• ${item}`),
      ]
        .filter(Boolean)
        .join("\n");
      setSummary(localToView(local, summaryText));
      setOffline(true);
      setError(null);
      return true;
    } catch {
      return false;
    }
  }

  async function generate() {
    setLoading(true);
    setError(null);

    // Offline: skip the network entirely and summarize on the device.
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      const ok = summarizeOnDevice();
      setLoading(false);
      if (!ok) setError("You’re offline and this document has no saved text to summarize.");
      return;
    }

    try {
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });
      const payload = (await response.json()) as {
        summary?: SummaryView;
        credits?: AiCreditStatus;
        offline?: boolean;
        error?: string;
      };
      if (payload.credits) setCredits(payload.credits);
      setOffline(Boolean(payload.offline));
      if (!response.ok || !payload.summary) {
        throw new Error(payload.error || "Lumi could not write the summary.");
      }
      setSummary(payload.summary);
    } catch (err) {
      // Network dropped mid-request: fall back to the on-device engine.
      const networkProblem =
        typeof navigator !== "undefined" && navigator.onLine === false;
      if (networkProblem && summarizeOnDevice()) {
        setError(null);
      } else {
        setError(
          err instanceof Error ? err.message : "Lumi could not write the summary."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary.summaryText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Clipboard access was blocked. The summary is still on screen.");
    }
  }

  function save() {
    if (!summary) return;
    const blob = new Blob(
      [`${fileName}\n\n${summary.summaryText}\n\n— Summarized with LumiNest\n`],
      { type: "text/plain;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${fileName.replace(/\.[^.]+$/, "")}-summary.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-primary/25 bg-primary/5 px-5 py-9 text-center">
        <Mascot state="generating-summary" size={150} glow />
        <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-ink">
          <Loader2 className="h-4 w-4 animate-spin" /> Lumi is reading…
        </p>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted">
          She is looking for the overview, main ideas, important points and key
          terms. Long documents can take a little while.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-deep dark:text-primary-soft">
            <Sparkles className="h-3.5 w-3.5" /> AI summary
          </p>
          <h2 className="mt-1 text-base font-bold text-ink">
            {summary ? "Lumi’s notes" : "Want the short version?"}
          </h2>
          {credits && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary-deep dark:text-primary-soft">
              <Sparkles className="h-3 w-3" /> {credits.remaining}/{credits.limit} credits · resets {
                new Date(credits.resetAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }
            </p>
          )}
        </div>
        {summary && (
          <span className="rounded-full bg-surface2 px-2.5 py-1 text-[10px] font-semibold capitalize text-muted">
            {summary.provider === "local" ? "offline" : summary.provider}
          </span>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-2xl bg-[#E892A2]/15 px-3 py-2 text-xs font-medium leading-relaxed text-[#a34b60] dark:text-[#f3b3c0]"
        >
          {error}
        </p>
      )}

      {!summary ? (
        <div className="rounded-3xl border border-dashed border-primary/30 bg-surface2/40 px-4 py-6 text-center">
          <Mascot expression="thinking" size={116} animation="float" />
          <p className="mt-1 text-sm font-bold text-ink">
            {hasExtractedText
              ? "Ready when you are"
              : "Lumi needs some text to read"}
          </p>
          <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted">
            {hasExtractedText
              ? `${extractedCharacters.toLocaleString()} characters are ready. Lumi will summarize only what is actually in the document.`
              : "Scanned PDFs, images and slides may not contain extractable text. Upload a text-based PDF, DOCX or TXT to use summaries."}
          </p>
          <Button
            onClick={generate}
            disabled={
              !hasExtractedText || (aiAvailable && (credits?.remaining ?? 1) <= 0)
            }
            className="mt-4"
            size="sm"
          >
            <Sparkles className="h-3.5 w-3.5" /> Generate summary
          </Button>
          {credits && credits.remaining <= 0 && (
            <p className="mt-2 text-[10px] font-medium text-muted">
              You’ve used all {credits.limit} AI credits this window. They reset at{" "}
              {new Date(credits.resetAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              .
            </p>
          )}
          {!hasExtractedText && (
            <p className="mt-2 text-[10px] text-muted">
              No extractable text was found. Text-based PDFs, DOCX and TXT work
              best with summaries.
            </p>
          )}
          {hasExtractedText && (extractedText?.trim().length ?? 0) >= 40 && (
            <p className="mt-2 text-[10px] text-muted">
              Works offline too — if you lose connection, Lumi summarizes on your
              device.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3 rounded-3xl border border-primary/20 bg-primary/5 p-4">
          {summary.overview ? (
            <p className="text-xs leading-relaxed text-ink">{summary.overview}</p>
          ) : (
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-ink">
              {summary.summaryText}
            </p>
          )}

          <Section title="Main ideas" items={summary.mainIdeas} icon={Lightbulb} />
          <Section
            title="Important points"
            items={summary.importantPoints}
            icon={ListChecks}
          />
          {summary.keyTerms.length > 0 && (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary-deep dark:text-primary-soft">
                <Tag className="h-3.5 w-3.5" /> Key terms
              </p>
              <div className="flex flex-wrap gap-1.5">
                {summary.keyTerms.map((term) => (
                  <span
                    key={term}
                    className="rounded-full bg-surface px-2.5 py-1 text-[10px] font-semibold text-ink shadow-sm ring-1 ring-line"
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>
          )}
          {summary.importantDates.length > 0 && (
            <Section
              title="Important dates"
              items={summary.importantDates}
              icon={CalendarDays}
            />
          )}
          {summary.conclusions && (
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary-deep dark:text-primary-soft">
                Conclusions
              </p>
              <p className="text-xs leading-relaxed text-ink">
                {summary.conclusions}
              </p>
            </div>
          )}
          <Section
            title="Page references"
            items={summary.pageReferences}
            icon={ListChecks}
          />

          <div className="border-t border-primary/15 pt-2.5">
            <p className="text-[10px] text-muted">
              {summary.generatedAt
                ? `Generated ${formatDate(summary.generatedAt)} · `
                : ""}
              {offline || summary.provider === "local"
                ? "Made with Lumi’s offline extractive engine. "
                : ""}
              Always check important details against the original document.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={generate}
                className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-[10px] font-semibold text-ink shadow-sm ring-1 ring-line transition hover:bg-surface2"
              >
                <RefreshCw className="h-3 w-3" /> Regenerate
              </button>
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-[10px] font-semibold text-ink shadow-sm ring-1 ring-line transition hover:bg-surface2"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                onClick={save}
                className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-[10px] font-semibold text-ink shadow-sm ring-1 ring-line transition hover:bg-surface2"
              >
                <Download className="h-3 w-3" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
