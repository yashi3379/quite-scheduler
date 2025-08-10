// Supabase Database Types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      session_data: {
        Row: {
          id: string
          session_id: string
          timezone: string
          language: string
          created_at: string
          updated_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          session_id: string
          timezone?: string
          language?: string
          created_at?: string
          updated_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          timezone?: string
          language?: string
          created_at?: string
          updated_at?: string
          expires_at?: string
        }
        Relationships: []
      }
      imported_content: {
        Row: {
          id: string
          session_id: string
          original_filename: string | null
          content: Json
          content_id: string
          title: string | null
          tags: string[] | null
          is_favorite: boolean
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          original_filename?: string | null
          content: Json
          content_id: string
          title?: string | null
          tags?: string[] | null
          is_favorite?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          original_filename?: string | null
          content?: Json
          content_id?: string
          title?: string | null
          tags?: string[] | null
          is_favorite?: boolean
          created_at?: string
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          id: string
          session_id: string
          content_id: string | null
          imported_content: Json
          selected_language: string
          selected_platforms: string[]
          scheduled_time: string
          status: string
          calendar_event_id: string | null
          access_token: string
          copy_status: Json
          notifications_sent: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          content_id?: string | null
          imported_content: Json
          selected_language: string
          selected_platforms: string[]
          scheduled_time: string
          status?: string
          calendar_event_id?: string | null
          access_token?: string
          copy_status?: Json
          notifications_sent?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          content_id?: string | null
          imported_content?: Json
          selected_language?: string
          selected_platforms?: string[]
          scheduled_time?: string
          status?: string
          calendar_event_id?: string | null
          access_token?: string
          copy_status?: Json
          notifications_sent?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "imported_content"
            referencedColumns: ["id"]
          }
        ]
      }
      app_settings: {
        Row: {
          session_id: string
          notification_settings: Json
          calendar_integration: boolean
          language_preference: string
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          session_id: string
          notification_settings?: Json
          calendar_integration?: boolean
          language_preference?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          session_id?: string
          notification_settings?: Json
          calendar_integration?: boolean
          language_preference?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}