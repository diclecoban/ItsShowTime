export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      account_deletion_audit: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json
          request_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json
          request_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json
          request_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_deletion_audit_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "account_deletion_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      account_deletion_requests: {
        Row: {
          created_at: string
          id: string
          processed_at: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          processed_at?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          processed_at?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      activity_feed: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          payload: Json
          type: string
          user_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          payload?: Json
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          payload?: Json
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_feed_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_config: {
        Row: {
          created_at: string
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "app_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_import_jobs: {
        Row: {
          attempts: number
          created_at: string
          created_by: string | null
          error: string | null
          external_id: number
          finished_at: string | null
          id: string
          show_id: string
          source: string
          started_at: string | null
          status: Database["public"]["Enums"]["catalog_import_status"]
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          created_by?: string | null
          error?: string | null
          external_id: number
          finished_at?: string | null
          id?: string
          show_id: string
          source?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["catalog_import_status"]
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          created_by?: string | null
          error?: string | null
          external_id?: number
          finished_at?: string | null
          id?: string
          show_id?: string
          source?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["catalog_import_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_import_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_import_jobs_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_reports: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reason?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          body: string
          created_at: string
          episode_id: string | null
          id: string
          is_spoiler: boolean
          media_type: Database["public"]["Enums"]["media_type"]
          movie_id: string | null
          parent_comment_id: string | null
          report_count: number
          show_id: string | null
          spoiler_level: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          episode_id?: string | null
          id?: string
          is_spoiler?: boolean
          media_type: Database["public"]["Enums"]["media_type"]
          movie_id?: string | null
          parent_comment_id?: string | null
          report_count?: number
          show_id?: string | null
          spoiler_level?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          episode_id?: string | null
          id?: string
          is_spoiler?: boolean
          media_type?: Database["public"]["Enums"]["media_type"]
          movie_id?: string | null
          parent_comment_id?: string | null
          report_count?: number
          show_id?: string | null
          spoiler_level?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_push_tokens: {
        Row: {
          created_at: string
          device_name: string | null
          enabled: boolean
          expo_push_token: string
          id: string
          last_seen_at: string
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name?: string | null
          enabled?: boolean
          expo_push_token: string
          id?: string
          last_seen_at?: string
          platform?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string | null
          enabled?: boolean
          expo_push_token?: string
          id?: string
          last_seen_at?: string
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      edge_function_events: {
        Row: {
          created_at: string
          duration_ms: number | null
          event_type: string
          function_name: string
          id: string
          metadata: Json
          status_code: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          event_type: string
          function_name: string
          id?: string
          metadata?: Json
          status_code?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          event_type?: string
          function_name?: string
          id?: string
          metadata?: Json
          status_code?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edge_function_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      edge_rate_limits: {
        Row: {
          created_at: string
          function_name: string
          id: string
          request_count: number
          updated_at: string
          user_id: string | null
          window_start: string
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          request_count?: number
          updated_at?: string
          user_id?: string | null
          window_start: string
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          request_count?: number
          updated_at?: string
          user_id?: string | null
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "edge_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      episode_watch_progress: {
        Row: {
          episode_id: string
          favorite_character: string | null
          id: string
          note: string | null
          rating: number | null
          reaction_mood: string | null
          updated_at: string
          user_id: string
          watched: boolean
          watched_at: string | null
        }
        Insert: {
          episode_id: string
          favorite_character?: string | null
          id?: string
          note?: string | null
          rating?: number | null
          reaction_mood?: string | null
          updated_at?: string
          user_id: string
          watched?: boolean
          watched_at?: string | null
        }
        Update: {
          episode_id?: string
          favorite_character?: string | null
          id?: string
          note?: string | null
          rating?: number | null
          reaction_mood?: string | null
          updated_at?: string
          user_id?: string
          watched?: boolean
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "episode_watch_progress_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "episode_watch_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          air_date: string | null
          average_rating: number | null
          created_at: string
          episode_number: number
          id: string
          overview: string | null
          runtime_minutes: number | null
          season_id: string
          title: string
        }
        Insert: {
          air_date?: string | null
          average_rating?: number | null
          created_at?: string
          episode_number: number
          id?: string
          overview?: string | null
          runtime_minutes?: number | null
          season_id: string
          title: string
        }
        Update: {
          air_date?: string | null
          average_rating?: number | null
          created_at?: string
          episode_number?: number
          id?: string
          overview?: string | null
          runtime_minutes?: number | null
          season_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      genres: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      incident_logs: {
        Row: {
          action: string
          created_at: string
          created_by: string | null
          id: string
          message: string
          metadata: Json
          severity: string
        }
        Insert: {
          action: string
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          metadata?: Json
          severity?: string
        }
        Update: {
          action?: string
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          metadata?: Json
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      list_items: {
        Row: {
          added_at: string
          id: string
          list_id: string
          media_type: Database["public"]["Enums"]["media_type"]
          movie_id: string | null
          note: string | null
          show_id: string | null
          target_id: string | null
        }
        Insert: {
          added_at?: string
          id?: string
          list_id: string
          media_type: Database["public"]["Enums"]["media_type"]
          movie_id?: string | null
          note?: string | null
          show_id?: string | null
          target_id?: string | null
        }
        Update: {
          added_at?: string
          id?: string
          list_id?: string
          media_type?: Database["public"]["Enums"]["media_type"]
          movie_id?: string | null
          note?: string | null
          show_id?: string | null
          target_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_items_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_items_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          privacy: Database["public"]["Enums"]["list_privacy"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          privacy?: Database["public"]["Enums"]["list_privacy"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          privacy?: Database["public"]["Enums"]["list_privacy"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_genres: {
        Row: {
          genre_id: string
          id: string
          media_type: Database["public"]["Enums"]["media_type"]
          movie_id: string | null
          show_id: string | null
        }
        Insert: {
          genre_id: string
          id?: string
          media_type: Database["public"]["Enums"]["media_type"]
          movie_id?: string | null
          show_id?: string | null
        }
        Update: {
          genre_id?: string
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"]
          movie_id?: string | null
          show_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_genres_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_genres_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_genres_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      media_platforms: {
        Row: {
          id: string
          media_type: Database["public"]["Enums"]["media_type"]
          movie_id: string | null
          platform_id: string
          region: string
          show_id: string | null
        }
        Insert: {
          id?: string
          media_type: Database["public"]["Enums"]["media_type"]
          movie_id?: string | null
          platform_id: string
          region?: string
          show_id?: string | null
        }
        Update: {
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"]
          movie_id?: string | null
          platform_id?: string
          region?: string
          show_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_platforms_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_platforms_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_platforms_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      movie_watch_status: {
        Row: {
          id: string
          movie_id: string
          note: string | null
          rating: number | null
          reaction_mood: string | null
          status: Database["public"]["Enums"]["library_status"]
          updated_at: string
          user_id: string
          watched_at: string | null
        }
        Insert: {
          id?: string
          movie_id: string
          note?: string | null
          rating?: number | null
          reaction_mood?: string | null
          status?: Database["public"]["Enums"]["library_status"]
          updated_at?: string
          user_id: string
          watched_at?: string | null
        }
        Update: {
          id?: string
          movie_id?: string
          note?: string | null
          rating?: number | null
          reaction_mood?: string | null
          status?: Database["public"]["Enums"]["library_status"]
          updated_at?: string
          user_id?: string
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movie_watch_status_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movie_watch_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      movies: {
        Row: {
          average_rating: number | null
          backdrop_url: string | null
          created_at: string
          id: string
          overview: string | null
          poster_url: string | null
          release_date: string | null
          runtime_minutes: number | null
          title: string
          tmdb_id: number | null
          updated_at: string
        }
        Insert: {
          average_rating?: number | null
          backdrop_url?: string | null
          created_at?: string
          id?: string
          overview?: string | null
          poster_url?: string | null
          release_date?: string | null
          runtime_minutes?: number | null
          title: string
          tmdb_id?: number | null
          updated_at?: string
        }
        Update: {
          average_rating?: number | null
          backdrop_url?: string | null
          created_at?: string
          id?: string
          overview?: string | null
          poster_url?: string | null
          release_date?: string | null
          runtime_minutes?: number | null
          title?: string
          tmdb_id?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_deliveries: {
        Row: {
          attempts: number
          channel: string
          created_at: string
          error: string | null
          id: string
          last_attempt_at: string | null
          max_attempts: number
          next_attempt_at: string
          notification_id: string
          provider_message_id: string | null
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          channel: string
          created_at?: string
          error?: string | null
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number
          next_attempt_at?: string
          notification_id: string
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number
          next_attempt_at?: string
          notification_id?: string
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          list_activity: boolean
          product_updates: boolean
          reminders: boolean
          replies: boolean
          upcoming: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          list_activity?: boolean
          product_updates?: boolean
          reminders?: boolean
          replies?: boolean
          upcoming?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          list_activity?: boolean
          product_updates?: boolean
          reminders?: boolean
          replies?: boolean
          upcoming?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          dedupe_key: string | null
          deep_link: string | null
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          dedupe_key?: string | null
          deep_link?: string | null
          id?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          dedupe_key?: string | null
          deep_link?: string | null
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platforms: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          is_admin: boolean
          language: string
          region: string
          spoiler_mode: Database["public"]["Enums"]["spoiler_mode"]
          theme: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          is_admin?: boolean
          language?: string
          region?: string
          spoiler_mode?: Database["public"]["Enums"]["spoiler_mode"]
          theme?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_admin?: boolean
          language?: string
          region?: string
          spoiler_mode?: Database["public"]["Enums"]["spoiler_mode"]
          theme?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          enabled: boolean
          episode_id: string
          id: string
          remind_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          episode_id: string
          id?: string
          remind_at: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          episode_id?: string
          id?: string
          remind_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      search_cache: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          media_type: string
          payload: Json
          query: string
          result_count: number
          source: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          payload: Json
          query: string
          result_count?: number
          source?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          payload?: Json
          query?: string
          result_count?: number
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      seasons: {
        Row: {
          air_date: string | null
          id: string
          poster_url: string | null
          season_number: number
          show_id: string
          title: string | null
        }
        Insert: {
          air_date?: string | null
          id?: string
          poster_url?: string | null
          season_number: number
          show_id: string
          title?: string | null
        }
        Update: {
          air_date?: string | null
          id?: string
          poster_url?: string | null
          season_number?: number
          show_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seasons_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      shows: {
        Row: {
          average_rating: number | null
          backdrop_url: string | null
          created_at: string
          first_air_date: string | null
          id: string
          import_error: string | null
          import_status: Database["public"]["Enums"]["catalog_import_status"]
          last_imported_at: string | null
          overview: string | null
          poster_url: string | null
          status: string | null
          title: string
          tmdb_id: number | null
          updated_at: string
        }
        Insert: {
          average_rating?: number | null
          backdrop_url?: string | null
          created_at?: string
          first_air_date?: string | null
          id?: string
          import_error?: string | null
          import_status?: Database["public"]["Enums"]["catalog_import_status"]
          last_imported_at?: string | null
          overview?: string | null
          poster_url?: string | null
          status?: string | null
          title: string
          tmdb_id?: number | null
          updated_at?: string
        }
        Update: {
          average_rating?: number | null
          backdrop_url?: string | null
          created_at?: string
          first_air_date?: string | null
          id?: string
          import_error?: string | null
          import_status?: Database["public"]["Enums"]["catalog_import_status"]
          last_imported_at?: string | null
          overview?: string | null
          poster_url?: string | null
          status?: string | null
          title?: string
          tmdb_id?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      support_campaigns: {
        Row: {
          created_at: string
          currency: string
          current_amount_cents: number
          description: string | null
          external_url: string | null
          id: string
          slug: string
          status: string
          target_amount_cents: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          current_amount_cents?: number
          description?: string | null
          external_url?: string | null
          id?: string
          slug: string
          status?: string
          target_amount_cents?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          current_amount_cents?: number
          description?: string | null
          external_url?: string | null
          id?: string
          slug?: string
          status?: string
          target_amount_cents?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_intents: {
        Row: {
          amount_cents: number | null
          campaign_id: string | null
          created_at: string
          currency: string
          id: string
          metadata: Json
          source: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_cents?: number | null
          campaign_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          source?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number | null
          campaign_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          source?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_intents_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "support_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_intents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_genres: {
        Row: {
          created_at: string
          genre_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          genre_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          genre_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_genres_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_genres_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_library_items: {
        Row: {
          created_at: string
          id: string
          media_type: Database["public"]["Enums"]["media_type"]
          movie_id: string | null
          show_id: string | null
          status: Database["public"]["Enums"]["library_status"]
          target_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_type: Database["public"]["Enums"]["media_type"]
          movie_id?: string | null
          show_id?: string | null
          status?: Database["public"]["Enums"]["library_status"]
          target_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"]
          movie_id?: string | null
          show_id?: string | null
          status?: Database["public"]["Enums"]["library_status"]
          target_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_library_items_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_library_items_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_library_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_recommendation_signals: {
        Row: {
          completed_show_count: number
          top_moods: string[]
          updated_at: string
          user_id: string
          watched_episode_count: number
        }
        Insert: {
          completed_show_count?: number
          top_moods?: string[]
          updated_at?: string
          user_id: string
          watched_episode_count?: number
        }
        Update: {
          completed_show_count?: number
          top_moods?: string[]
          updated_at?: string
          user_id?: string
          watched_episode_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_recommendation_signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaming_services: {
        Row: {
          created_at: string
          platform_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          platform_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          platform_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_streaming_services_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_streaming_services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_sessions: {
        Row: {
          duration_minutes: number | null
          ended_at: string | null
          episode_id: string | null
          id: string
          media_type: Database["public"]["Enums"]["media_type"]
          movie_id: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          duration_minutes?: number | null
          ended_at?: string | null
          episode_id?: string | null
          id?: string
          media_type: Database["public"]["Enums"]["media_type"]
          movie_id?: string | null
          started_at?: string
          user_id: string
        }
        Update: {
          duration_minutes?: number | null
          ended_at?: string | null
          episode_id?: string | null
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"]
          movie_id?: string | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_sessions_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watch_sessions_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watch_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_own_account: {
        Args: { deletion_reason?: string }
        Returns: undefined
      }
      get_admin_summary: { Args: never; Returns: Json }
      get_app_config: { Args: never; Returns: Json }
      get_library_progress: { Args: { target_user_id: string }; Returns: Json }
      get_profile_stats: { Args: { target_user_id: string }; Returns: Json }
      get_watch_next_episodes: {
        Args: { target_user_id: string }
        Returns: Json
      }
      is_current_user_admin: { Args: never; Returns: boolean }
      log_system_incident: {
        Args: {
          incident_action: string
          incident_message: string
          incident_metadata?: Json
          incident_severity: string
        }
        Returns: string
      }
      refresh_user_recommendation_signals: {
        Args: { target_user_id: string }
        Returns: Json
      }
      run_growth_cleanup: { Args: never; Returns: Json }
      set_crisis_control: {
        Args: {
          incident_message?: string
          next_features: Json
          next_message: string
          next_mode: string
        }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      catalog_import_status: "pending" | "processing" | "ready" | "failed"
      library_status:
        | "watching"
        | "watchlist"
        | "paused"
        | "finished"
        | "dropped"
      list_privacy: "private" | "public" | "friends"
      media_type: "show" | "movie"
      spoiler_mode: "strict" | "moderate" | "off"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      catalog_import_status: ["pending", "processing", "ready", "failed"],
      library_status: [
        "watching",
        "watchlist",
        "paused",
        "finished",
        "dropped",
      ],
      list_privacy: ["private", "public", "friends"],
      media_type: ["show", "movie"],
      spoiler_mode: ["strict", "moderate", "off"],
    },
  },
} as const
