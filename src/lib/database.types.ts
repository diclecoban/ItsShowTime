export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string;
          avatar_url: string | null;
          region: string;
          language: string;
          theme: string;
          spoiler_mode: 'strict' | 'moderate' | 'off';
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name: string;
          avatar_url?: string | null;
          region?: string;
          language?: string;
          theme?: string;
          spoiler_mode?: 'strict' | 'moderate' | 'off';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      shows: {
        Row: {
          id: string;
          tmdb_id: number | null;
          title: string;
          overview: string | null;
          poster_url: string | null;
          backdrop_url: string | null;
          status: string | null;
          first_air_date: string | null;
          average_rating: number | null;
          import_status: 'pending' | 'processing' | 'ready' | 'failed';
          import_error: string | null;
          last_imported_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['shows']['Row']> & { title: string };
        Update: Partial<Database['public']['Tables']['shows']['Insert']>;
      };
      seasons: {
        Row: {
          id: string;
          show_id: string;
          season_number: number;
          title: string | null;
          poster_url: string | null;
          air_date: string | null;
        };
        Insert: Partial<Database['public']['Tables']['seasons']['Row']> & { show_id: string; season_number: number };
        Update: Partial<Database['public']['Tables']['seasons']['Insert']>;
      };
      episodes: {
        Row: {
          id: string;
          season_id: string;
          episode_number: number;
          title: string;
          overview: string | null;
          air_date: string | null;
          runtime_minutes: number | null;
          average_rating: number | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['episodes']['Row']> & {
          season_id: string;
          episode_number: number;
          title: string;
        };
        Update: Partial<Database['public']['Tables']['episodes']['Insert']>;
      };
      movies: {
        Row: {
          id: string;
          tmdb_id: number | null;
          title: string;
          overview: string | null;
          poster_url: string | null;
          backdrop_url: string | null;
          release_date: string | null;
          runtime_minutes: number | null;
          average_rating: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['movies']['Row']> & { title: string };
        Update: Partial<Database['public']['Tables']['movies']['Insert']>;
      };
      genres: {
        Row: {
          id: string;
          name: string;
        };
        Insert: Partial<Database['public']['Tables']['genres']['Row']> & { name: string };
        Update: Partial<Database['public']['Tables']['genres']['Insert']>;
      };
      platforms: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['platforms']['Row']> & { name: string };
        Update: Partial<Database['public']['Tables']['platforms']['Insert']>;
      };
      user_library_items: {
        Row: {
          id: string;
          user_id: string;
          media_type: 'show' | 'movie';
          show_id: string | null;
          movie_id: string | null;
          target_id: string;
          status: 'watching' | 'watchlist' | 'paused' | 'finished' | 'dropped';
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['user_library_items']['Row']> & {
          user_id: string;
          media_type: 'show' | 'movie';
        };
        Update: Partial<Database['public']['Tables']['user_library_items']['Insert']>;
      };
      episode_watch_progress: {
        Row: {
          id: string;
          user_id: string;
          episode_id: string;
          watched: boolean;
          watched_at: string | null;
          rating: number | null;
          reaction_mood: string | null;
          favorite_character: string | null;
          note: string | null;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['episode_watch_progress']['Row']> & {
          user_id: string;
          episode_id: string;
        };
        Update: Partial<Database['public']['Tables']['episode_watch_progress']['Insert']>;
      };
      movie_watch_status: {
        Row: {
          id: string;
          user_id: string;
          movie_id: string;
          status: 'watching' | 'watchlist' | 'paused' | 'finished' | 'dropped';
          watched_at: string | null;
          rating: number | null;
          reaction_mood: string | null;
          note: string | null;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['movie_watch_status']['Row']> & {
          user_id: string;
          movie_id: string;
        };
        Update: Partial<Database['public']['Tables']['movie_watch_status']['Insert']>;
      };
      watch_sessions: {
        Row: {
          id: string;
          user_id: string;
          media_type: 'show' | 'movie';
          episode_id: string | null;
          movie_id: string | null;
          started_at: string;
          ended_at: string | null;
          duration_minutes: number | null;
        };
        Insert: Partial<Database['public']['Tables']['watch_sessions']['Row']> & {
          user_id: string;
          media_type: 'show' | 'movie';
        };
        Update: Partial<Database['public']['Tables']['watch_sessions']['Insert']>;
      };
      lists: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          privacy: 'private' | 'public' | 'friends';
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['lists']['Row']> & { user_id: string; title: string };
        Update: Partial<Database['public']['Tables']['lists']['Insert']>;
      };
      list_items: {
        Row: {
          id: string;
          list_id: string;
          media_type: 'show' | 'movie';
          show_id: string | null;
          movie_id: string | null;
          target_id: string;
          note: string | null;
          added_at: string;
        };
        Insert: Partial<Database['public']['Tables']['list_items']['Row']> & {
          list_id: string;
          media_type: 'show' | 'movie';
        };
        Update: Partial<Database['public']['Tables']['list_items']['Insert']>;
      };
      comments: {
        Row: {
          id: string;
          user_id: string;
          media_type: 'show' | 'movie';
          show_id: string | null;
          movie_id: string | null;
          episode_id: string | null;
          body: string;
          spoiler_level: string;
          status: 'visible' | 'reported' | 'hidden';
          report_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['comments']['Row']> & {
          user_id: string;
          media_type: 'show' | 'movie';
          body: string;
        };
        Update: Partial<Database['public']['Tables']['comments']['Insert']>;
      };
      comment_reports: {
        Row: {
          id: string;
          comment_id: string;
          user_id: string;
          reason: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['comment_reports']['Row']> & {
          comment_id: string;
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['comment_reports']['Insert']>;
      };
      comment_likes: {
        Row: {
          comment_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['comment_likes']['Row']> & {
          comment_id: string;
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['comment_likes']['Insert']>;
      };
      notification_preferences: {
        Row: {
          user_id: string;
          reminders: boolean;
          upcoming: boolean;
          replies: boolean;
          list_activity: boolean;
          product_updates: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['notification_preferences']['Row']> & {
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['notification_preferences']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          deep_link: string | null;
          dedupe_key?: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['notifications']['Row']> & {
          user_id: string;
          type: string;
          title: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      search_cache: {
        Row: {
          id: string;
          query: string;
          media_type: string;
          source: string;
          payload: Json;
          result_count: number;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['search_cache']['Row']> & {
          query: string;
          media_type: string;
          source: string;
          payload: Json;
        };
        Update: Partial<Database['public']['Tables']['search_cache']['Insert']>;
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          episode_id: string;
          remind_at: string;
          enabled: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['reminders']['Row']> & {
          user_id: string;
          episode_id: string;
          remind_at: string;
        };
        Update: Partial<Database['public']['Tables']['reminders']['Insert']>;
      };
      catalog_import_jobs: {
        Row: {
          id: string;
          show_id: string;
          source: string;
          external_id: number;
          status: 'pending' | 'processing' | 'ready' | 'failed';
          error: string | null;
          attempts: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          started_at: string | null;
          finished_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['catalog_import_jobs']['Row']> & {
          show_id: string;
          external_id: number;
        };
        Update: Partial<Database['public']['Tables']['catalog_import_jobs']['Insert']>;
      };
      account_deletion_requests: {
        Row: {
          id: string;
          user_id: string;
          reason: string | null;
          processed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['account_deletion_requests']['Row']> & {
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['account_deletion_requests']['Insert']>;
      };
      user_genres: {
        Row: {
          user_id: string;
          genre_id: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['user_genres']['Row']> & {
          user_id: string;
          genre_id: string;
        };
        Update: Partial<Database['public']['Tables']['user_genres']['Insert']>;
      };
      user_streaming_services: {
        Row: {
          user_id: string;
          platform_id: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['user_streaming_services']['Row']> & {
          user_id: string;
          platform_id: string;
        };
        Update: Partial<Database['public']['Tables']['user_streaming_services']['Insert']>;
      };
    };
  };
};
