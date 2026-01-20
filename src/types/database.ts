export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      folders: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          folder_id: string | null;
          title: string;
          content: Json;
          plain_text: string;
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          folder_id?: string | null;
          title?: string;
          content?: Json;
          plain_text?: string;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          folder_id?: string | null;
          title?: string;
          content?: Json;
          plain_text?: string;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      audio_recordings: {
        Row: {
          id: string;
          user_id: string;
          note_id: string;
          storage_path: string;
          transcription: string | null;
          status: "pending" | "processing" | "completed" | "failed";
          duration: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          note_id: string;
          storage_path: string;
          transcription?: string | null;
          status?: "pending" | "processing" | "completed" | "failed";
          duration?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          note_id?: string;
          storage_path?: string;
          transcription?: string | null;
          status?: "pending" | "processing" | "completed" | "failed";
          duration?: number | null;
          created_at?: string;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          note_id: string | null;
          mode: "quiz" | "explain" | "flashcard" | "general";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          note_id?: string | null;
          mode?: "quiz" | "explain" | "flashcard" | "general";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          note_id?: string | null;
          mode?: "quiz" | "explain" | "flashcard" | "general";
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          role: "user" | "assistant";
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: "user" | "assistant";
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          role?: "user" | "assistant";
          content?: string;
          created_at?: string;
        };
      };
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Folder = Database["public"]["Tables"]["folders"]["Row"];
export type Note = Database["public"]["Tables"]["notes"]["Row"];
export type AudioRecording = Database["public"]["Tables"]["audio_recordings"]["Row"];
export type ChatSession = Database["public"]["Tables"]["chat_sessions"]["Row"];
export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];

export type StudyMode = "quiz" | "explain" | "flashcard" | "general";
