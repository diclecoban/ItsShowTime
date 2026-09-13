import type { LucideIcon } from 'lucide-react';

export type Tab = 'shows' | 'movies' | 'discover' | 'calendar' | 'library' | 'profile';

export type Episode = {
  id: number;
  show: string;
  code: string;
  title: string;
  tag: string;
  progress: number;
  watchedEpisodes: number;
  totalEpisodes: number;
  averageRating: number;
  image: string;
  watched: boolean;
};

export type DetailEpisode = {
  code: string;
  title: string;
  watched: boolean;
  averageRating: number;
};

export type ShowSeason = {
  season: string;
  episodes: DetailEpisode[];
};

export type Movie = {
  id: number;
  title: string;
  year: string;
  runtime: string;
  platform: string;
  genre: string;
  status: 'Watched' | 'Watchlist';
  averageRating: number;
  body: string;
  image: string;
};

export type SearchResult = {
  title: string;
  meta: string;
  platform: string;
  status: 'Add' | 'In library';
  type: 'Shows' | 'Movies' | 'People';
  image: string;
  source?: 'local' | 'tmdb' | 'tvmaze';
  tmdbId?: number;
};

export type LibraryShow = {
  title: string;
  status: 'Watching' | 'Paused' | 'Finished' | 'Dropped';
  progress: number;
  watchedEpisodes: number;
  totalEpisodes: number;
  next: string;
  meta: string;
  image: string;
};

export type UpcomingGroup = {
  day: string;
  date: string;
  items: Array<{
    show: string;
    code: string;
    title: string;
    time: string;
    platform: string;
    tracked: boolean;
    image: string;
  }>;
};

export type CustomList = {
  title: string;
  count: string;
  privacy: string;
  images: string[];
  items?: Array<{
    title: string;
    meta: string;
    image: string;
  }>;
};

export type CommunityContext =
  | { kind: 'episode'; title: string; subtitle: string; image: string; watched: boolean }
  | { kind: 'movie'; title: string; subtitle: string; image: string; watched: boolean };

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  icon: LucideIcon;
  tone: string;
};

export type CommunityComment = {
  id: string;
  user: string;
  mood: string;
  text: string;
  likes: number;
};

export type RecentActivity = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
};
