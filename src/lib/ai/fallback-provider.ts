import {
  AIConfigurationError,
  type AIProvider,
  type SummaryRequest,
  type SummaryResult,
} from "./provider";

/**
 * Tries one provider per API key in order until a summary succeeds.
 * Keys are never logged or included in error messages.
 */
const TOTAL_BUDGET_MS = 105_000;
const MIN_ATTEMPT_MS = 12_000;
const MAX_ATTEMPT_MS = 75_000;

export class FallbackAIProvider implements AIProvider {
  private readonly providers: AIProvider[];
  private activeName: string;

  constructor(providers: AIProvider[]) {
    if (providers.length === 0) {
      throw new AIConfigurationError(
        "At least one AI provider key is required."
      );
    }
    this.providers = providers;
    this.activeName = providers[0].name;
  }

  get name(): string {
    return this.activeName;
  }

  async generateSummary(input: SummaryRequest): Promise<SummaryResult> {
    const failures: string[] = [];
    const deadline = Date.now() + TOTAL_BUDGET_MS;

    for (let index = 0; index < this.providers.length; index += 1) {
      const remaining = deadline - Date.now();
      if (remaining < 1_000) {
        failures.push(`key ${index + 1}: skipped (time budget exhausted)`);
        continue;
      }

      const attemptsAfter = this.providers.length - index - 1;
      const timeoutMs = Math.max(
        1_000,
        Math.min(
          MAX_ATTEMPT_MS,
          remaining - attemptsAfter * MIN_ATTEMPT_MS
        )
      );

      try {
        const result = await this.providers[index].generateSummary({
          ...input,
          timeoutMs,
        });
        this.activeName = this.providers[index].name;
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push(`key ${index + 1}: ${message}`);
      }
    }

    const lastFailure = failures[failures.length - 1] ?? "unknown error";
    throw new Error(
      `All ${this.providers.length} AI API keys failed — no credits were used. Last error: ${lastFailure}`
    );
  }
}
