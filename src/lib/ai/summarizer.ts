import type { SupabaseClient } from "@supabase/supabase-js";
import { createAIProvider, composeSummaryText } from "@/lib/ai";
import { AIConfigurationError, type AIProvider } from "@/lib/ai/provider";
import { summarizeLocally } from "@/lib/ai/local-summarizer";
import type { FileRecord, SummaryContent, SummaryStatus } from "@/types";

interface SummarizeArgs {
  supabase: SupabaseClient;
  file: FileRecord;
  userId: string;
}

export interface SummarizeOutput {
  content: SummaryContent;
  summaryText: string;
  provider: string;
  model: string;
  generatedAt: string;
  usedLocal: boolean;
}

async function recordSummaryJob(
  supabase: SupabaseClient,
  fileId: string,
  userId: string,
  status: "processing" | "ready" | "failed",
  errorMessage: string | null
) {
  await supabase.from("processing_jobs").insert({
    file_id: fileId,
    user_id: userId,
    job_type: "summary",
    status,
    error_message: errorMessage,
    attempts: 1,
  });
}

export async function summarizeDocument({
  supabase,
  file,
  userId,
}: SummarizeArgs): Promise<SummarizeOutput> {
  const text = file.extracted_text?.trim() ?? "";
  if (text.length < 40) {
    throw new Error(
      "There is not enough extracted text to summarize. The document may be scanned, image-only, or still processing."
    );
  }

  // Resolve the AI provider up front. A missing provider is not an error: the
  // local extractive engine below takes over.
  let provider: AIProvider | null = null;
  try {
    provider = createAIProvider();
  } catch (error) {
    if (!(error instanceof AIConfigurationError)) throw error;
    provider = null;
  }

  await supabase
    .from("files")
    .update({ summary_status: "processing" satisfies SummaryStatus })
    .eq("id", file.id)
    .eq("user_id", userId);
  await recordSummaryJob(supabase, file.id, userId, "processing", null);

  try {
    let content: SummaryContent = {
      overview: "",
      mainIdeas: [],
      importantPoints: [],
      keyTerms: [],
      importantDates: [],
      conclusions: "",
      pageReferences: [],
    };
    let providerName = "local";
    let model = "extractive";
    let usedLocal = false;

    const runLocal = () => {
      const local = summarizeLocally({
        text,
        fileName: file.name,
        pageCount: file.page_count,
      });
      usedLocal = true;
      return local;
    };

    if (provider) {
      try {
        const result = await provider.generateSummary({
          text,
          fileName: file.name,
          pageCount: file.page_count,
        });
        content = result.content;
        providerName = provider.name;
        model = result.model;
      } catch {
        // Every AI key failed — fall back to the local engine instead of
        // failing the whole request.
        const local = runLocal();
        content = local.content;
        providerName = "local";
        model = local.model;
      }
    } else {
      const local = runLocal();
      content = local.content;
      providerName = "local";
      model = local.model;
    }

    const summaryText = composeSummaryText(content);
    const generatedAt = new Date().toISOString();

    const { error: summaryError } = await supabase
      .from("file_summaries")
      .upsert(
        {
          file_id: file.id,
          user_id: userId,
          summary: summaryText,
          key_points: content as unknown as never,
          provider: providerName,
          status: "ready",
          generated_at: generatedAt,
        },
        { onConflict: "file_id" }
      );
    if (summaryError) throw new Error(summaryError.message);

    await supabase
      .from("files")
      .update({
        summary_status: "ready" satisfies SummaryStatus,
        updated_at: generatedAt,
      })
      .eq("id", file.id)
      .eq("user_id", userId);

    await recordSummaryJob(supabase, file.id, userId, "ready", null);

    return {
      content,
      summaryText,
      provider: providerName,
      model,
      generatedAt,
      usedLocal,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The AI provider could not generate a summary.";

    await supabase
      .from("files")
      .update({ summary_status: "failed" satisfies SummaryStatus })
      .eq("id", file.id)
      .eq("user_id", userId);
    await recordSummaryJob(supabase, file.id, userId, "failed", message.slice(0, 500));

    throw new Error(message);
  }
}
