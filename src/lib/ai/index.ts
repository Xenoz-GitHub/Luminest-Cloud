import { FallbackAIProvider } from "./fallback-provider";
import { OpenAICompatibleProvider } from "./openai-provider";
import {
  AIConfigurationError,
  parseApiKeys,
  type AIConfig,
  type AIProvider,
} from "./provider";

export * from "./provider";
export { FallbackAIProvider } from "./fallback-provider";

export interface AIProviderPreset {
  id: string;
  label: string;
  baseUrl: string;
  defaultModel: string;
  signupUrl: string;
  note: string;
}

/**
 * Free-tier providers that expose an OpenAI-compatible chat completions API.
 * Model names change over time, so AI_MODEL can always override the default.
 */
export const AI_PROVIDER_PRESETS: Record<string, AIProviderPreset> = {
  gemini: {
    id: "gemini",
    label: "Google AI Studio (Gemini)",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-3.8-flash",
    signupUrl: "https://aistudio.google.com/app/apikey",
    note: "Generous free tier. Free-tier prompts may be used to improve Google products, so avoid highly sensitive documents.",
  },
  groq: {
    id: "groq",
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    signupUrl: "https://console.groq.com/keys",
    note: "Very fast free tier with per-minute and per-day limits.",
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter (free models)",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "meta-llama/llama-3.3-70b-instruct:free",
    signupUrl: "https://openrouter.ai/settings/keys",
    note: "Use any model whose ID ends in :free. Free model availability and limits change often.",
  },
  mistral: {
    id: "mistral",
    label: "Mistral AI",
    baseUrl: "https://api.mistral.ai/v1",
    defaultModel: "mistral-small-latest",
    signupUrl: "https://console.mistral.ai/api-keys",
    note: "Free experiment tier is rate-limited. Check the current plan limits in the console.",
  },
  cerebras: {
    id: "cerebras",
    label: "Cerebras",
    baseUrl: "https://api.cerebras.ai/v1",
    defaultModel: "llama-3.3-70b",
    signupUrl: "https://cloud.cerebras.ai/",
    note: "Free tier with daily token limits; good for long documents within the quota.",
  },
  "openai-compatible": {
    id: "openai-compatible",
    label: "Any OpenAI-compatible endpoint",
    baseUrl: "",
    defaultModel: "",
    signupUrl: "",
    note: "Set AI_BASE_URL and AI_MODEL to any other compatible free endpoint.",
  },
};

const DEFAULT_PROVIDER = "gemini";

function providerEnvSuffix(provider: string): string {
  return provider.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

/**
 * Collect API keys for a base env var. Supports both a comma-separated value
 * (e.g. AI_API_KEY="k1,k2") and arbitrarily many numbered variants
 * (AI_API_KEY_1, AI_API_KEY_2, ...). New keys can be added later as extra
 * Vercel env vars without editing the original value. Order: base first, then
 * numbered variants in ascending numeric order.
 */
function collectApiKeys(baseName: string): string[] {
  const values: string[] = [];
  const base = process.env[baseName];
  if (base) values.push(base);

  const pattern = new RegExp(`^${baseName}_\\d+$`);
  const numbered = Object.keys(process.env)
    .filter((name) => pattern.test(name))
    .sort((a, b) => {
      const na = Number(a.slice(baseName.length + 1));
      const nb = Number(b.slice(baseName.length + 1));
      return na - nb;
    });
  for (const name of numbered) {
    const value = process.env[name];
    if (value) values.push(value);
  }

  return parseApiKeys(values.join(","));
}

function mergeKeys(...groups: string[][]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const group of groups) {
    for (const key of group) {
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(key);
    }
  }
  return merged;
}

function resolveProviderConfig(
  provider: string,
  apiKey: string,
  primary: boolean
): AIConfig {
  const preset = AI_PROVIDER_PRESETS[provider];
  const suffix = providerEnvSuffix(provider);

  const baseUrl =
    (primary ? process.env.AI_BASE_URL : undefined) ||
    process.env[`AI_BASE_URL_${suffix}`] ||
    preset?.baseUrl ||
    "";
  if (!baseUrl) {
    throw new AIConfigurationError(
      `AI_BASE_URL is required for the ${provider} provider.`
    );
  }

  const model =
    (primary ? process.env.AI_MODEL : undefined) ||
    process.env[`AI_MODEL_${suffix}`] ||
    preset?.defaultModel ||
    "";
  if (!model) {
    throw new AIConfigurationError(
      `AI_MODEL is required for the ${provider} provider.`
    );
  }

  return { provider, apiKey, model, baseUrl };
}

export function isAIConfigured(): boolean {
  if (collectApiKeys("AI_API_KEY").length > 0) return true;
  return Object.keys(AI_PROVIDER_PRESETS).some(
    (provider) =>
      collectApiKeys(`AI_API_KEY_${providerEnvSuffix(provider)}`).length > 0
  );
}

/**
 * Build one config per key, preserving order. The primary provider is read
 * from AI_API_KEY, then any AI_API_KEY_<PROVIDER> pools are appended as
 * fallbacks. Adding another key later only requires changing an env var.
 */
export function getAIConfigs(): AIConfig[] {
  const primary = (process.env.AI_PROVIDER || DEFAULT_PROVIDER).toLowerCase();
  const primaryPreset = AI_PROVIDER_PRESETS[primary];
  if (!primaryPreset && !process.env.AI_BASE_URL) {
    throw new AIConfigurationError(
      `Unknown AI_PROVIDER "${primary}". Use gemini, groq, openrouter, mistral, cerebras or openai-compatible.`
    );
  }

  const configs: AIConfig[] = [];
  const primaryKeys = mergeKeys(
    collectApiKeys("AI_API_KEY"),
    collectApiKeys(`AI_API_KEY_${providerEnvSuffix(primary)}`)
  );
  for (const apiKey of primaryKeys) {
    configs.push(resolveProviderConfig(primary, apiKey, true));
  }

  for (const provider of Object.keys(AI_PROVIDER_PRESETS)) {
    if (provider === primary) continue;
    const keys = collectApiKeys(`AI_API_KEY_${providerEnvSuffix(provider)}`);
    for (const apiKey of keys) {
      configs.push(resolveProviderConfig(provider, apiKey, false));
    }
  }

  if (configs.length === 0) {
    throw new AIConfigurationError(
      "AI summarization needs a free provider key. Set AI_API_KEY (separate multiple keys with commas, or add AI_API_KEY_1, AI_API_KEY_2, ...) or a provider-specific pool such as AI_API_KEY_GEMINI in the server environment."
    );
  }

  return configs;
}

export function getAIConfig(): AIConfig {
  return getAIConfigs()[0];
}

export function createAIProvider(): AIProvider {
  const providers = getAIConfigs().map(
    (config) => new OpenAICompatibleProvider(config)
  );
  return providers.length === 1
    ? providers[0]
    : new FallbackAIProvider(providers);
}
