import { afterEach, describe, expect, it, vi } from "vitest";
import { FallbackAIProvider } from "./fallback-provider";
import { createAIProvider, getAIConfigs, isAIConfigured } from "./index";
import { AIConfigurationError } from "./provider";

const PROVIDER_IDS = [
  "gemini",
  "groq",
  "openrouter",
  "mistral",
  "cerebras",
  "openai-compatible",
] as const;

const ENV_NAMES = [
  "AI_PROVIDER",
  "AI_API_KEY",
  "AI_MODEL",
  "AI_BASE_URL",
  ...PROVIDER_IDS.flatMap((provider) => {
    const suffix = provider.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
    return [
      `AI_API_KEY_${suffix}`,
      `AI_MODEL_${suffix}`,
      `AI_BASE_URL_${suffix}`,
    ];
  }),
];

function stubEnv(values: Record<string, string>) {
  for (const name of ENV_NAMES) {
    vi.stubEnv(name, values[name] ?? "");
  }
  for (const [name, value] of Object.entries(values)) {
    if (!ENV_NAMES.includes(name)) vi.stubEnv(name, value);
  }
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("AI key pool configuration", () => {
  it("creates one config per comma-separated key, preserving order", () => {
    stubEnv({
      AI_PROVIDER: "groq",
      AI_API_KEY: " key-one, key-two,key-one, ",
    });

    const configs = getAIConfigs();

    expect(configs).toHaveLength(2);
    expect(configs.map((config) => config.apiKey)).toEqual([
      "key-one",
      "key-two",
    ]);
    expect(configs.every((config) => config.provider === "groq")).toBe(true);
    expect(configs[0].baseUrl).toBe("https://api.groq.com/openai/v1");
    expect(configs[0].model).toBe("llama-3.3-70b-versatile");
    expect(isAIConfigured()).toBe(true);
  });

  it("merges numbered key variants (AI_API_KEY_1, _2, ...) with the base value", () => {
    stubEnv({
      AI_PROVIDER: "groq",
      AI_API_KEY: "base-one",
      AI_API_KEY_2: "numbered-two",
      AI_API_KEY_1: "numbered-one",
    });

    const configs = getAIConfigs();

    expect(configs.map((config) => config.apiKey)).toEqual([
      "base-one",
      "numbered-one",
      "numbered-two",
    ]);
    expect(configs.every((config) => config.provider === "groq")).toBe(true);
  });

  it("appends provider-specific pools after the primary keys", () => {
    stubEnv({
      AI_PROVIDER: "groq",
      AI_API_KEY: "groq-one,groq-two",
      AI_API_KEY_GEMINI: "gemini-one,gemini-two",
    });

    const configs = getAIConfigs();

    expect(configs.map((config) => `${config.provider}:${config.apiKey}`)).toEqual(
      [
        "groq:groq-one",
        "groq:groq-two",
        "gemini:gemini-one",
        "gemini:gemini-two",
      ]
    );
    expect(configs[2].baseUrl).toBe(
      "https://generativelanguage.googleapis.com/v1beta/openai"
    );
    expect(configs[2].model).toBe("gemini-3.8-flash");
  });

  it("scopes model and base URL overrides to their provider", () => {
    stubEnv({
      AI_PROVIDER: "groq",
      AI_API_KEY: "groq-one",
      AI_API_KEY_GEMINI: "gemini-one",
      AI_MODEL: "custom-primary-model",
      AI_MODEL_GEMINI: "custom-gemini-model",
      AI_BASE_URL_GEMINI: "https://gemini.example/v1",
    });

    const [primary, fallback] = getAIConfigs();

    expect(primary.model).toBe("custom-primary-model");
    expect(primary.baseUrl).toBe("https://api.groq.com/openai/v1");
    expect(fallback.model).toBe("custom-gemini-model");
    expect(fallback.baseUrl).toBe("https://gemini.example/v1");
  });

  it("uses the fallback provider when more than one key is configured", () => {
    stubEnv({
      AI_PROVIDER: "gemini",
      AI_API_KEY: "key-one,key-two",
      AI_API_KEY_GROQ: "groq-key",
    });

    expect(createAIProvider()).toBeInstanceOf(FallbackAIProvider);
  });

  it("counts provider-specific pools as configured", () => {
    stubEnv({
      AI_PROVIDER: "groq",
      AI_API_KEY_GEMINI: "gemini-only",
    });

    expect(isAIConfigured()).toBe(true);
    const configs = getAIConfigs();
    expect(configs).toHaveLength(1);
    expect(configs[0].provider).toBe("gemini");
  });

  it("stays unconfigured when every key list is empty", () => {
    stubEnv({});

    expect(isAIConfigured()).toBe(false);
    expect(() => getAIConfigs()).toThrow(AIConfigurationError);
  });

  it("rejects an unknown primary provider without a custom base URL", () => {
    stubEnv({
      AI_PROVIDER: "unknown-provider",
      AI_API_KEY: "key-one",
    });

    expect(() => getAIConfigs()).toThrow(/Unknown AI_PROVIDER/);
  });
});
