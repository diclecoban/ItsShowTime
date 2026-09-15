import type { LucideIcon } from 'lucide-react';

export type Tab = 'shows' | 'movies' | 'discover' | 'calendar' | 'library' | 'profile';

export type Episode = {
  id: number;
  backendId?: string;
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
  id?: string;
  code: string;
  fullCode?: string;
  seasonNumber?: number;
  title: string;
  watched: boolean;
  averageRating: number;
};

export type ShowSeason = {
  season: string;
  seasonNumber?: number;
  episodes: DetailEpisode[];
};

export type ShowDetailInfo = {
  title: string;
  overview: string;
  status: string;
  importStatus?: 'pending' | 'processing' | 'ready' | 'failed';
  importError?: string | null;
  posterUrl: string;
  backdropUrl?: string | null;
  averageRating: number;
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

export type DiscoverItem = {
  title: string;
  meta: string;
  body: string;
  reason: string;
  match: string;
  fit: string[];
  image: string;
  source?: 'tvmaze';
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
    episodeId?: string;
    show: string;
    code: string;
    title: string;
    time: string;
    airDate?: string | null;
    remindAt?: string | null;
    platform: string;
    tracked: boolean;
    image: string;
  }>;
};

export type CustomList = {
  title: string;
  description?: string;
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

export type NotificationPreferences = {
  reminders: boolean;
  upcoming: boolean;
  replies: boolean;
  listActivity: boolean;
  productUpdates: boolean;
};

export type CommunityComment = {
  id: string;
  user: string;
  mood: string;
  text: string;
  likes: number;
  likedByMe?: boolean;
  canDelete?: boolean;
  canReport?: boolean;
  status?: 'visible' | 'reported' | 'hidden';
  reportCount?: number;
  createdAt?: string;
};

export type RecentActivity = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
};

export type ProfileStats = {
  episodes: number;
  totalTime: string;
  streak: string;
  libraryShows: number;
  completedShows: number;
  reactions: number;
  comments: number;
};

export type UserProfile = {
  displayName: string;
  username: string;
  theme: string;
  spoilerMode: 'strict' | 'moderate' | 'off';
  isAdmin: boolean;
};

export type AdminSummary = {
  operations?: {
    failedJobs: number;
    pendingJobs: number;
    processingJobs: number;
    cacheHits24h: number;
    cacheMisses24h: number;
    cacheHitRate24h: number;
    rateLimitedSearches24h: number;
    edgeErrors24h: number;
    slowEvents24h: number;
    avgSearchMs24h: number;
    avgImportMs24h: number;
  };
  edgeEvents?: Array<{
    id: string;
    functionName: string;
    eventType: string;
    statusCode?: number | null;
    durationMs?: number | null;
    createdAt: string;
    metadata?: Record<string, unknown>;
  }>;
  importJobs: Array<{
    id: string;
    title: string;
    status: 'pending' | 'processing' | 'ready' | 'failed';
    source: string;
    attempts: number;
    error?: string | null;
  }>;
  reportedComments: Array<{
    id: string;
    title: string;
    body: string;
    reportCount: number;
    status: 'visible' | 'reported' | 'hidden';
  }>;
  deletionRequests: Array<{
    id: string;
    reason?: string | null;
    processedAt?: string | null;
    createdAt: string;
  }>;
  cacheEntries: Array<{
    id: string;
    query: string;
    resultCount: number;
    expiresAt: string;
  }>;
  support?: {
    title: string;
    currentAmountCents: number;
    targetAmountCents: number;
    currency: string;
    openedIntents: number;
  };
};

export type EpisodeReaction = {
  rating: number;
  mood: string;
  favoriteCharacter: string;
  favoriteMoment?: string;
  quickReaction?: string;
  spoilerComfort?: string;
  note: string;
};
