export type PreviewStatus =
  | "pending"
  | "queued"
  | "processing"
  | "ready"
  | "failed"
  | "unsupported";

export type SummaryStatus =
  | "none"
  | "queued"
  | "processing"
  | "ready"
  | "failed";

export type FileCategory =
  | "document"
  | "presentation"
  | "pdf"
  | "image"
  | "text"
  | "other";

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  preferences: ProfilePreferences;
  plan?: string;
  created_at: string;
  updated_at: string;
}

/** A public app review. One per user, editable by its author. */
export interface Review {
  id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface AiCreditStatus {
  plan: string;
  limit: number;
  used: number;
  remaining: number;
  resetAt: string;
  windowSeconds: number;
}

export interface ProfilePreferences {
  notifications?: boolean;
  autoSummary?: boolean;
  reduceMotion?: boolean;
  onboarded?: boolean;
  accent?: string;
}

export interface FolderRecord {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface FileRecord {
  id: string;
  user_id: string;
  folder_id: string | null;
  name: string;
  original_filename: string;
  mime_type: string;
  extension: string;
  size_bytes: number;
  storage_path: string;
  preview_status: PreviewStatus;
  summary_status: SummaryStatus;
  extracted_text: string | null;
  extracted_text_path: string | null;
  page_count: number | null;
  is_favorite: boolean;
  /** Where the original file lives: Supabase storage or ImageKit. */
  storage_provider?: "supabase" | "imagekit";
  /** ImageKit file id, used to sign private URLs and to delete. */
  imagekit_file_id?: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FilePreview {
  id: string;
  file_id: string;
  user_id: string;
  page_number: number;
  storage_path: string;
  preview_type: string;
  created_at: string;
}

export interface SummaryContent {
  overview: string;
  mainIdeas: string[];
  importantPoints: string[];
  keyTerms: string[];
  importantDates: string[];
  conclusions: string;
  pageReferences: string[];
}

export interface FileSummary {
  id: string;
  file_id: string;
  user_id: string;
  summary: string;
  key_points: SummaryContent | null;
  provider: string;
  status: SummaryStatus;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShareLink {
  id: string;
  file_id: string;
  user_id: string;
  token_hash: string;
  expires_at: string | null;
  password_hash: string | null;
  allow_download: boolean;
  revoked_at: string | null;
  created_at: string;
}

/** Safe share shape sent to the browser (never includes token/password hashes). */
export interface ShareDto {
  id: string;
  url: string;
  expiresAt: string | null;
  allowDownload: boolean;
  hasPassword: boolean;
  createdAt: string;
  isExpired: boolean;
}

export interface TagRecord {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface ProcessingJob {
  id: string;
  file_id: string;
  user_id: string;
  job_type: "preview" | "summary" | "text" | string;
  status: "queued" | "processing" | "ready" | "failed" | string;
  error_message: string | null;
  attempts: number;
  created_at: string;
  updated_at: string;
}

/** Serializable file shape passed from server components to client components. */
export interface FileListItem extends FileRecord {
  previewUrl?: string | null;
  tags?: TagRecord[];
  hasSummary?: boolean;
  activeShareUrl?: string | null;
}

export interface SharedFileItem {
  share: ShareLink;
  file: FileRecord;
  url: string;
  isExpired: boolean;
}

export interface StorageSummary {
  usedBytes: number;
  quotaBytes: number;
  fileCount: number;
  folderCount: number;
  byCategory: Record<FileCategory, { count: number; bytes: number }>;
  largestFiles: Pick<FileRecord, "id" | "name" | "size_bytes" | "extension">[];
}
