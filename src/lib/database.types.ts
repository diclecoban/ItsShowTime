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
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          deep_link: string | null;
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
    };
  };
};
