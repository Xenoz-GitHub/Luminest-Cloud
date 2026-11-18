import type { SummaryResult } from "./provider";

/**
 * Offline extractive summarizer. Uses no external API and no model weights, so
 * it works when every AI provider is unavailable, rate-limited, or unconfigured.
 *
 * Pipeline:
 *  1. Split into pages (from "Page N:" markers) and sentences.
 *  2. Score sentences with a blend of TextRank (cosine sentence graph),
 *     term frequency, position, cue phrases and file-name overlap.
 *  3. Pick the top distinct sentences (Jaccard de-duplication), keep them in
 *     reading order, then assemble overview / ideas / points / terms / dates.
 */

const STOPWORDS = new Set(
  `a an the and or but if then else of to in on at by for with as is are was were be been being this that these those it its into from than so such not no nor can could should would may might will shall do does did have has had i you he she they we me my your our their his her them us who whom which what when where why how all any both each few more most other some only own same very just about above after again against below between during before under over out off up down once here there while also however therefore thus`.split(
    /\s+/
  )
);

const CONCLUSION_CUES = [
  "in conclusion",
  "to conclude",
  "in summary",
  "to sum up",
  "overall",
  "therefore",
  "thus",
  "as a result",
  "finally",
  "ultimately",
];

const IMPORTANT_CUES = [
  "must",
  "should",
  "required",
  "require",
  "important",
  "key",
  "note",
  "ensure",
  "critical",
  "essential",
  "goal",
  "objective",
  "deadline",
];

interface Sentence {
  text: string;
  page: number | null;
  tokens: string[];
}

interface LocalInput {
  text: string;
  fileName: string;
  pageCount?: number | null;
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function splitSentences(block: string): string[] {
  return block
    .split(/\n+/)
    .flatMap((paragraph) =>
      paragraph.split(/(?<=[.!?])\s+(?=[A-Z0-9"“('\[])/)
    )
    .map(normalize)
    .filter((sentence) => sentence.length > 0);
}

function parsePages(text: string): { page: number | null; text: string }[] {
  const regex = /Page\s+(\d+)\s*:\s*/gi;
  const hits: { page: number; start: number; head: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text))) {
    hits.push({ page: Number(match[1]), start: match.index + match[0].length, head: match.index });
  }
  if (!hits.length) return [{ page: null, text }];

  const pages: { page: number | null; text: string }[] = [];
  if (hits[0].head > 0) pages.push({ page: null, text: text.slice(0, hits[0].head) });
  for (let i = 0; i < hits.length; i += 1) {
    const end = i + 1 < hits.length ? hits[i + 1].head : text.length;
    pages.push({ page: hits[i].page, text: text.slice(hits[i].start, end) });
  }
  return pages;
}

function collectSentences(text: string): Sentence[] {
  const sentences: Sentence[] = [];
  for (const page of parsePages(text)) {
    for (const sentence of splitSentences(page.text)) {
      if (sentence.length < 8) continue;
      const tokens = tokenize(sentence);
      if (!tokens.length) continue;
      sentences.push({ text: sentence, page: page.page, tokens });
    }
  }
  return sentences;
}

function termFrequency(sentences: Sentence[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const sentence of sentences) {
    for (const token of new Set(sentence.tokens)) {
      freq.set(token, (freq.get(token) ?? 0) + 1);
    }
  }
  return freq;
}

function vector(tokens: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);
  return counts;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [key, value] of a) {
    normA += value * value;
    const other = b.get(key);
    if (other) dot += value * other;
  }
  for (const value of b.values()) normB += value * value;
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function textRank(vectors: Map<string, number>[]): number[] {
  const n = vectors.length;
  if (n === 0) return [];
  const sim: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const rowSum = new Array(n).fill(0);
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const score = cosine(vectors[i], vectors[j]);
      sim[i][j] = score;
      sim[j][i] = score;
      rowSum[i] += score;
      rowSum[j] += score;
    }
  }
  const damping = 0.85;
  let scores = new Array(n).fill(1);
  for (let iter = 0; iter < 30; iter += 1) {
    const next = new Array(n).fill((1 - damping) / n);
    for (let i = 0; i < n; i += 1) {
      let sum = 0;
      for (let j = 0; j < n; j += 1) {
        if (rowSum[j] > 0) sum += (sim[j][i] / rowSum[j]) * scores[j];
      }
      next[i] += damping * sum;
    }
    scores = next;
  }
  return scores;
}

function jaccard(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  let inter = 0;
  for (const token of setA) if (setB.has(token)) inter += 1;
  const union = setA.size + setB.size - inter;
  return union ? inter / union : 0;
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function extractDates(text: string): string[] {
  const patterns = [
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:,\s*\d{4})?\b/gi,
    /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g,
    /\b(?:19|20)\d{2}\b/g,
  ];
  const seen = new Set<string>();
  const dates: string[] = [];
  for (const pattern of patterns) {
    for (const match of text.match(pattern) ?? []) {
      const value = normalize(match);
      const key = value.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      dates.push(value);
      if (dates.length >= 6) return dates;
    }
  }
  return dates;
}

function emptyContent() {
  return {
    overview: "",
    mainIdeas: [] as string[],
    importantPoints: [] as string[],
    keyTerms: [] as string[],
    importantDates: [] as string[],
    conclusions: "",
    pageReferences: [] as string[],
  };
}

export function summarizeLocally(input: LocalInput): SummaryResult {
  const text = normalize(input.text);
  const fallback = emptyContent();
  fallback.importantDates = extractDates(text);

  if (text.length < 40) {
    fallback.overview = clip(text, 400) || "This document is too short to summarize.";
    return { content: fallback, model: "extractive", raw: JSON.stringify(fallback) };
  }

  let sentences = collectSentences(text);
  if (sentences.length > 400) sentences = sentences.slice(0, 400);
  if (!sentences.length) {
    fallback.overview = clip(text, 400);
    return { content: fallback, model: "extractive", raw: JSON.stringify(fallback) };
  }

  const freq = termFrequency(sentences);
  let maxFreq = 1;
  for (const value of freq.values()) maxFreq = Math.max(maxFreq, value);

  const fileTokens = new Set(tokenize(input.fileName.replace(/\.[^.]+$/, "")));
  const vectors = sentences.map((sentence) => vector(sentence.tokens));
  const ranks = textRank(vectors);
  const maxRank = Math.max(...ranks, 0.0001);

  const scores = sentences.map((sentence, index) => {
    const tfScore =
      sentence.tokens.reduce((sum, token) => sum + (freq.get(token) ?? 0) / maxFreq, 0) /
      Math.sqrt(sentence.tokens.length || 1);
    const rank = ranks[index] / maxRank;
    const positionBonus = index === 0 ? 0.15 : index < 2 ? 0.08 : 0;
    const lower = sentence.text.toLowerCase();
    const cueBonus = CONCLUSION_CUES.some((cue) => lower.includes(cue)) ? 0.1 : 0;
    let titleHit = 0;
    for (const token of sentence.tokens) if (fileTokens.has(token)) titleHit += 1;
    const titleBonus = fileTokens.size ? (titleHit / sentence.tokens.length) * 0.1 : 0;
    return 0.55 * rank + 0.3 * tfScore + positionBonus + cueBonus + titleBonus + (sentence.page !== null ? 0.02 : 0);
  });

  const totalWords = sentences.reduce((sum, sentence) => sum + sentence.tokens.length, 0);
  const target = totalWords < 120 ? 3 : totalWords < 400 ? 4 : totalWords < 900 ? 5 : 6;

  const order = [...sentences.keys()].sort((a, b) => scores[b] - scores[a]);
  const selected: number[] = [];
  for (const index of order) {
    if (selected.length >= target) break;
    if (selected.some((chosen) => jaccard(sentences[chosen].tokens, sentences[index].tokens) > 0.8)) continue;
    selected.push(index);
  }
  selected.sort((a, b) => a - b);

  const overviewIdx = selected.slice(0, 2);
  let overview = overviewIdx.map((index) => sentences[index].text).join(" ");
  if (!overview) overview = sentences[0].text;
  overview = clip(overview, 420);

  const ideaIdx = selected.slice(2);
  if (ideaIdx.length < 2) {
    for (const index of order) {
      if (ideaIdx.length >= 2) break;
      if (overviewIdx.includes(index) || ideaIdx.includes(index)) continue;
      ideaIdx.push(index);
    }
  }
  const mainIdeas = ideaIdx
    .sort((a, b) => a - b)
    .slice(0, 5)
    .map((index) => clip(sentences[index].text, 180));
  if (!mainIdeas.length) mainIdeas.push(clip(overview, 180));

  const pointIdx = sentences
    .map((sentence, index) => ({ sentence, index }))
    .filter(({ sentence }) => {
      const lower = sentence.text.toLowerCase();
      return /\d|%|\$|€|£/.test(sentence.text) || IMPORTANT_CUES.some((cue) => lower.includes(cue));
    })
    .sort((a, b) => scores[b.index] - scores[a.index])
    .map((entry) => entry.index);
  const importantPoints: string[] = [];
  for (const index of pointIdx) {
    const line = clip(sentences[index].text, 180);
    if (!mainIdeas.includes(line) && !importantPoints.includes(line)) importantPoints.push(line);
    if (importantPoints.length >= 5) break;
  }

  const concIdx = sentences
    .map((sentence, index) => ({ sentence, index }))
    .filter(({ sentence }) => CONCLUSION_CUES.some((cue) => sentence.text.toLowerCase().includes(cue)))
    .sort((a, b) => scores[b.index] - scores[a.index])
    .map((entry) => entry.index);
  let conclusions = concIdx.slice(0, 2).map((index) => sentences[index].text).join(" ");
  if (!conclusions && selected.length) conclusions = sentences[selected[selected.length - 1]].text;
  conclusions = clip(conclusions, 300);

  const displayByTerm = new Map<string, string>();
  for (const word of text.match(/[A-Za-z][A-Za-z'-]{3,}/g) ?? []) {
    const key = word.toLowerCase();
    if (STOPWORDS.has(key) || displayByTerm.has(key)) continue;
    displayByTerm.set(key, word);
  }
  const counts = new Map<string, number>();
  for (const sentence of sentences) {
    for (const token of new Set(sentence.tokens)) {
      if (token.length >= 4) counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }
  const keyTerms = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, 8)
    .map(([token]) => capitalize(displayByTerm.get(token) ?? token));

  const pageReferences: string[] = [];
  const seenPages = new Set<number>();
  for (const index of selected) {
    const sentence = sentences[index];
    if (sentence.page !== null && !seenPages.has(sentence.page)) {
      seenPages.add(sentence.page);
      pageReferences.push(`Page ${sentence.page}: ${clip(sentence.text, 90)}`);
    }
  }

  const content = {
    overview,
    mainIdeas,
    importantPoints,
    keyTerms,
    importantDates: fallback.importantDates,
    conclusions,
    pageReferences,
  };

  return { content, model: "extractive", raw: JSON.stringify(content) };
}
