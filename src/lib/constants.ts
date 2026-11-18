export const APP_NAME = "LumiNest";
export const APP_TAGLINE = "Your little space for everything.";
/** Contact shown on the legal pages and Google consent screen. */
export const SUPPORT_EMAIL = "xenoz1346@gmail.com";
export const LEGAL_UPDATED = "November 12, 2026";
export const STORAGE_QUOTA_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_TEXT_EXTRACT_BYTES = 500_000;
export const MAX_PDF_PREVIEW_PAGES = 4;
export const LONG_PRESS_MS = 520;

export const FILE_TYPE_GROUPS = {
  document: ["pdf", "doc", "docx", "txt"],
  presentation: ["ppt", "pptx"],
  image: ["png", "jpg", "jpeg", "webp", "gif"],
} as const;

export const ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "txt",
  "ppt",
  "pptx",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
] as const;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

/** Accepted MIME types for every supported extension. */
export const MIME_BY_EXTENSION: Record<string, string[]> = {
  pdf: ["application/pdf"],
  doc: ["application/msword", "application/vnd.ms-word", "application/octet-stream"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
    "application/octet-stream",
  ],
  txt: ["text/plain", "text/csv", "application/octet-stream"],
  ppt: ["application/vnd.ms-powerpoint", "application/octet-stream"],
  pptx: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip",
    "application/octet-stream",
  ],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  webp: ["image/webp"],
  gif: ["image/gif"],
};

export const CATEGORY_LABELS = {
  document: "Documents",
  presentation: "Presentations",
  pdf: "PDFs",
  image: "Images",
  text: "Text files",
  other: "Other",
} as const;

export const FOLDER_COLORS = [
  "#B9A5EA",
  "#F3AFC8",
  "#9EC7EE",
  "#F3C677",
  "#8FD3B6",
  "#C6A8F5",
] as const;

// ---------------------------------------------------------------------------
// AI credits
// ---------------------------------------------------------------------------

/** Credits reset every 2 hours by default. */
export const AI_CREDIT_WINDOW_SECONDS = 2 * 60 * 60;

/**
 * Plan budgets. Only "free" ships today; add entries here (and set
 * profiles.plan) to introduce paid subscriptions later — no other code needs
 * to change because the credit service reads from this map.
 */
export const AI_PLANS = {
  free: {
    id: "free",
    label: "Free",
    creditsPerWindow: 10,
    windowSeconds: AI_CREDIT_WINDOW_SECONDS,
  },
} as const;

export type AIPlanId = keyof typeof AI_PLANS;

export function getAIPlan(planId?: string | null) {
  if (planId && planId in AI_PLANS) {
    return AI_PLANS[planId as AIPlanId];
  }
  return AI_PLANS.free;
}

/** Base credit cost per AI feature. Summary cost scales with document size. */
export const AI_CREDIT_COSTS = {
  summary: 1,
} as const;
