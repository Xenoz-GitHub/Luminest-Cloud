import type { SummaryContent } from "@/types";

export interface SummaryRequest {
  text: string;
  fileName: string;
  pageCount?: number | null;
  /** Per-attempt timeout assigned by the fallback provider. */
  timeoutMs?: number;
}

export interface SummaryResult {
  content: SummaryContent;
  model: string;
  raw: string;
}

export interface AIProvider {
  name: string;
  generateSummary(input: SummaryRequest): Promise<SummaryResult>;
}

export interface AIConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl: string;
}

export class AIConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIConfigurationError";
  }
}

/**
 * Parse a comma-separated AI_API_KEY value into an ordered, de-duplicated list.
 * Commas, newlines and surrounding whitespace are ignored so values copied
 * from Vercel or a .env file work without manual cleanup.
 */
export function parseApiKeys(raw: string | undefined | null): string[] {
  if (!raw) return [];

  const keys: string[] = [];
  const seen = new Set<string>();
  for (const part of raw.split(/[\s,]+/)) {
    const key = part.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    keys.push(key);
  }
  return keys;
}

const MAX_PROMPT_CHARS = 28_000;

export function buildSummaryPrompt(input: SummaryRequest): string {
  const text = input.text.slice(0, MAX_PROMPT_CHARS);
  const truncated = input.text.length > MAX_PROMPT_CHARS;
  return [
    "You are LumiNest's document librarian. Summarize the document below using ONLY facts that appear in it. Never invent names, dates, numbers or conclusions.",
    'Return STRICT JSON with exactly these keys: {"overview": string, "mainIdeas": string[], "importantPoints": string[], "keyTerms": string[], "importantDates": string[], "conclusions": string, "pageReferences": string[]}.',
    "Rules: overview is 2-4 friendly sentences. mainIdeas has 2-5 short items. importantPoints has 2-6 concrete items. keyTerms has up to 8 terms. importantDates has only dates literally present (empty array if none). conclusions is 1-3 sentences. pageReferences has up to 5 entries like 'Page 2: topic' only when page numbers are known; otherwise [].",
    `Document name: ${input.fileName}`,
    input.pageCount ? `Page/slide count: ${input.pageCount}` : "",
    truncated
      ? "Note: the document was truncated for this request; say so in the overview if it limits completeness."
      : "",
    "DOCUMENT TEXT:",
    text,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : String(item ?? "")))
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\n|;|•/)
      .map((item) => item.replace(/^[-*\d.\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 12);
  }
  return [];
}

function pick(value: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (value[key] !== undefined && value[key] !== null) return value[key];
  }
  return undefined;
}

export function parseSummaryResponse(raw: string): SummaryContent {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  let parsed: Record<string, unknown> | null = null;
  try {
    const candidate = JSON.parse(cleaned);
    if (candidate && typeof candidate === "object") {
      parsed = candidate as Record<string, unknown>;
    }
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        const candidate = JSON.parse(cleaned.slice(start, end + 1));
        if (candidate && typeof candidate === "object") {
          parsed = candidate as Record<string, unknown>;
        }
      } catch {
        parsed = null;
      }
    }
  }

  if (!parsed) {
    return {
      overview: cleaned.slice(0, 2_000) || "The summary could not be parsed.",
      mainIdeas: [],
      importantPoints: [],
      keyTerms: [],
      importantDates: [],
      conclusions: "",
      pageReferences: [],
    };
  }

  const overviewRaw = pick(parsed, ["overview", "summary", "short_overview"]);
  const conclusionsRaw = pick(parsed, ["conclusions", "conclusion"]);
  return {
    overview:
      typeof overviewRaw === "string" && overviewRaw.trim()
        ? overviewRaw.trim()
        : "No overview was returned.",
    mainIdeas: stringArray(pick(parsed, ["mainIdeas", "main_ideas", "ideas"])),
    importantPoints: stringArray(
      pick(parsed, ["importantPoints", "important_points", "points"])
    ),
    keyTerms: stringArray(pick(parsed, ["keyTerms", "key_terms", "terms"])),
    importantDates: stringArray(
      pick(parsed, ["importantDates", "important_dates", "dates"])
    ),
    conclusions:
      typeof conclusionsRaw === "string" ? conclusionsRaw.trim() : "",
    pageReferences: stringArray(
      pick(parsed, ["pageReferences", "page_references", "references"])
    ),
  };
}

export function composeSummaryText(content: SummaryContent): string {
  const sections: string[] = [content.overview];
  const list = (title: string, items: string[]) => {
    if (!items.length) return;
    sections.push(`${title}:\n${items.map((item) => `• ${item}`).join("\n")}`);
  };
  list("Main ideas", content.mainIdeas);
  list("Important points", content.importantPoints);
  list("Key terms", content.keyTerms);
  list("Important dates", content.importantDates);
  if (content.conclusions) sections.push(`Conclusions:\n${content.conclusions}`);
  list("Page references", content.pageReferences);
  return sections.filter(Boolean).join("\n\n");
}

export const SUMMARY_SYSTEM_PROMPT =
  "You summarize documents faithfully and return only valid JSON. You never invent facts that are not in the source text.";
