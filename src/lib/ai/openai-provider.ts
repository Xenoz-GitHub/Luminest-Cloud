import {
  buildSummaryPrompt,
  parseSummaryResponse,
  SUMMARY_SYSTEM_PROMPT,
  type AIProvider,
  type AIConfig,
  type SummaryRequest,
  type SummaryResult,
} from "./provider";

function endpoint(config: AIConfig): string {
  return `${config.baseUrl.replace(/\/$/, "")}/chat/completions`;
}

/** Pull a human-readable message out of a provider error body. */
function extractErrorDetail(raw: string): string {
  const text = raw.trim();
  if (!text) return "";
  try {
    const parsed = JSON.parse(text) as unknown;
    if (Array.isArray(parsed)) {
      const first = parsed[0] as { error?: { message?: string } } | undefined;
      if (first?.error?.message) return first.error.message;
    }
    if (typeof parsed === "object" && parsed) {
      const obj = parsed as { error?: { message?: string } | string; message?: string };
      if (typeof obj.error === "string") return obj.error;
      if (obj.error?.message) return obj.error.message;
      if (typeof obj.message === "string") return obj.message;
    }
  } catch {
    // Not JSON; fall through to the raw text.
  }
  return text;
}

/** Turn an HTTP failure into a short, friendly, actionable message. */
function describeFailure(
  provider: string,
  model: string,
  status: number,
  raw: string
): string {
  const detail = extractErrorDetail(raw).replace(/\s+/g, " ").slice(0, 220);
  const lower = detail.toLowerCase();

  if (status === 401 || status === 403) {
    return `${provider}: the API key was rejected (${status}). Check the key in your environment.`;
  }
  if (status === 429) {
    return `${provider}: rate limited (429). Lumi will try the next key.`;
  }
  if (status === 404 || lower.includes("no longer available") || lower.includes("not found")) {
    const modelHint = lower.includes("model")
      ? ` The model "${model}" may be retired — set AI_MODEL_${provider
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, "_")} to a current one.`
      : "";
    return `${provider}: the model could not be found (404).${modelHint}`;
  }
  if (status >= 500) {
    return `${provider}: the provider had a server error (${status}).`;
  }
  return `${provider}: request failed (${status})${detail ? ` — ${detail}` : ""}`;
}

export class OpenAICompatibleProvider implements AIProvider {
  constructor(private config: AIConfig) {}

  get name(): string {
    return this.config.provider;
  }

  async generateSummary(input: SummaryRequest): Promise<SummaryResult> {
    const body: Record<string, unknown> = {
      model: this.config.model,
      temperature: 0.2,
      max_tokens: 1600,
      messages: [
        { role: "system", content: SUMMARY_SYSTEM_PROMPT },
        { role: "user", content: buildSummaryPrompt(input) },
      ],
      response_format: { type: "json_object" },
    };

    const signal = AbortSignal.timeout(input.timeoutMs ?? 75_000);
    let response = await fetch(endpoint(this.config), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });

    // Some OpenAI-compatible endpoints don't support response_format.
    if (response.status === 400) {
      delete body.response_format;
      response = await fetch(endpoint(this.config), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal,
      });
    }

    if (!response.ok) {
      const raw = await response.text().catch(() => "");
      throw new Error(
        describeFailure(this.config.provider, this.config.model, response.status, raw)
      );
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
      model?: string;
    };
    const raw = payload.choices?.[0]?.message?.content;
    if (!raw) {
      throw new Error(`${this.config.provider} returned an empty summary.`);
    }
    return {
      content: parseSummaryResponse(raw),
      model: payload.model || this.config.model,
      raw,
    };
  }
}
