export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string;
          avatar_url?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string;
          avatar_url?: string | null;
          preferences?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      folders: {
        Row: Timestamps & {
          id: string;
          user_id: string;
          name: string;
          parent_id: string | null;
          color: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          parent_id?: string | null;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          parent_id?: string | null;
          color?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      files: {
        Row: Timestamps & {
          id: string;
          user_id: string;
          folder_id: string | null;
          name: string;
          original_filename: string;
          mime_type: string;
          extension: string;
          size_bytes: number;
          storage_path: string;
          preview_status: string;
          summary_status: string;
          extracted_text: string | null;
          extracted_text_path: string | null;
          page_count: number | null;
          is_favorite: boolean;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          folder_id?: string | null;
          name: string;
          original_filename: string;
          mime_type: string;
          extension: string;
          size_bytes: number;
          storage_path: string;
          preview_status?: string;
          summary_status?: string;
          extracted_text?: string | null;
          extracted_text_path?: string | null;
          page_count?: number | null;
          is_favorite?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          folder_id?: string | null;
          name?: string;
          preview_status?: string;
          summary_status?: string;
          extracted_text?: string | null;
          page_count?: number | null;
          is_favorite?: boolean;
          deleted_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      file_previews: {
        Row: {
          id: string;
          file_id: string;
          user_id: string;
          page_number: number;
          storage_path: string;
          preview_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          file_id: string;
          user_id: string;
          page_number?: number;
          storage_path: string;
          preview_type?: string;
          created_at?: string;
        };
        Update: {
          page_number?: number;
          storage_path?: string;
          preview_type?: string;
        };
        Relationships: [];
      };
      file_summaries: {
        Row: Timestamps & {
          id: string;
          file_id: string;
          user_id: string;
          summary: string;
          key_points: Json | null;
          provider: string;
          status: string;
          generated_at: string | null;
        };
        Insert: {
          id?: string;
          file_id: string;
          user_id: string;
          summary: string;
          key_points?: Json | null;
          provider?: string;
          status?: string;
          generated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          summary?: string;
          key_points?: Json | null;
          provider?: string;
          status?: string;
          generated_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      share_links: {
        Row: {
          id: string;
          file_id: string;
          user_id: string;
          token_hash: string;
          expires_at: string | null;
          password_hash: string | null;
          allow_download: boolean;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          file_id: string;
          user_id: string;
          token_hash: string;
          expires_at?: string | null;
          password_hash?: string | null;
          allow_download?: boolean;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: {
          token_hash?: string;
          expires_at?: string | null;
          password_hash?: string | null;
          allow_download?: boolean;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          color?: string;
        };
        Relationships: [];
      };
      file_tags: {
        Row: {
          file_id: string;
          tag_id: string;
        };
        Insert: {
          file_id: string;
          tag_id: string;
        };
        Update: {
          file_id?: string;
          tag_id?: string;
        };
        Relationships: [];
      };
      processing_jobs: {
        Row: Timestamps & {
          id: string;
          file_id: string;
          user_id: string;
          job_type: string;
          status: string;
          error_message: string | null;
          attempts: number;
        };
        Insert: {
          id?: string;
          file_id: string;
          user_id: string;
          job_type?: string;
          status?: string;
          error_message?: string | null;
          attempts?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: string;
          error_message?: string | null;
          attempts?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
