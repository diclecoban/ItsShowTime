import { StatusBar } from 'expo-status-bar';
import { Bell, CalendarDays, Clapperboard, Compass, Home, Library, RefreshCw, Tv, UserRound } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';

import { EpisodeCard, NavItem, ScreenHeader } from './src/components';
import { usePreferences } from './src/hooks/usePreferences';
import { useResponsive } from './src/hooks/useResponsive';
import { triggerSelectionFeedback, triggerSuccessFeedback } from './src/lib/feedback';
import {
  getCurrentSession,
  defaultCrisisControl,
  addShowToLibrary,
  addMovieTitleToList,
  addShowTitleToList,
  clearSearchCache,
  createCommunityComment,
  createCommunityReply,
  createNotification,
  createSupportIntent,
  deleteCommunityComment,
  createList as saveCustomList,
  getAdminSummary,
  getAppConfig,
  findEpisodeByShowAndCode,
  findMovieByTitle,
  findShowByTitle,
  getHydratedLists,
  getCommentReplies,
  getCommunityComments,
  getProfile,
  getProfileStats,
  getRecentActivity,
  getUserPreferences,
  getLibraryShows,
  getNotifications,
  getNotificationPreferences,
  getDiscoverShows,
  getUpcomingGroups,
  getWatchNextEpisodes,
  getShowDetailByTitle,
  markAllNotificationsRead,
  setNotificationRead,
  markEpisodeWatched as saveEpisodeWatched,
  markMovieWatched as saveMovieWatched,
  requestAccountDeletion,
  registerDevicePushToken,
  hideReportedComment,
  reportCommunityComment,
  retryCatalogImport,
  runDatabaseMaintenance,
  saveOnboardingPreferences,
  saveEpisodeReaction,
  saveNotificationPreferences,
  saveProfileSettings,
  saveProfileTheme,
  searchCatalog,
  searchExternalCatalog,
  importExternalShow,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  toggleListPrivacy,
  toggleCommentLike,
  toggleReminderForEpisode,
  updateCrisisControl,
} from './src/lib/itsShowTimeApi';
import { requestExpoPushToken } from './src/lib/pushNotifications';
import { isSupabaseConfigured, supabase } from './src/lib/supabase';
import { styles } from './src/styles';
import { bg, gold, themes } from './src/theme';
import type {
  CommunityContext,
  CustomList,
  DiscoverItem,
  Episode,
  LibraryShow,
  Movie,
  NotificationItem,
  NotificationPreferences,
  AdminSummary,
  CrisisControl,
  ProfileStats,
  UserProfile,
  CommunityComment,
  RecentActivity,
  SearchResult,
  ShowDetailInfo,
  ShowSeason,
  Tab,
  UpcomingGroup,
} from './src/types';

const mainTabs: Tab[] = ['today', 'shows', 'movies', 'discover', 'calendar', 'library', 'profile'];
type ShowSyncState = 'syncing' | 'ready' | 'failed';

const AuthPage = lazy(() => import('./src/screens/AuthPage').then((module) => ({ default: module.AuthPage })));
const AdminPage = lazy(() => import('./src/screens/AdminPage').then((module) => ({ default: module.AdminPage })));
const CommunityPage = lazy(() => import('./src/screens/CommunityPage').then((module) => ({ default: module.CommunityPage })));
const DiscoverQueue = lazy(() => import('./src/screens/DiscoverQueue').then((module) => ({ default: module.DiscoverQueue })));
const EpisodeReactionPage = lazy(() =>
  import('./src/screens/EpisodeReactionPage').then((module) => ({ default: module.EpisodeReactionPage }))
);
const LibraryPage = lazy(() => import('./src/screens/LibraryPage').then((module) => ({ default: module.LibraryPage })));
const LegalPage = lazy(() => import('./src/screens/LegalPage').then((module) => ({ default: module.LegalPage })));
const ListsPage = lazy(() => import('./src/screens/ListsPage').then((module) => ({ default: module.ListsPage })));
const MovieDetailPage = lazy(() => import('./src/screens/MovieDetailPage').then((module) => ({ default: module.MovieDetailPage })));
const MoviesPage = lazy(() => import('./src/screens/MoviesPage').then((module) => ({ default: module.MoviesPage })));
const NotificationsPage = lazy(() =>
  import('./src/screens/NotificationsPage').then((module) => ({ default: module.NotificationsPage }))
);
const OnboardingPage = lazy(() => import('./src/screens/OnboardingPage').then((module) => ({ default: module.OnboardingPage })));
const ProfileDashboard = lazy(() =>
  import('./src/screens/ProfileDashboard').then((module) => ({ default: module.ProfileDashboard }))
);
const SearchPage = lazy(() => import('./src/screens/SearchPage').then((module) => ({ default: module.SearchPage })));
const SettingsPage = lazy(() => import('./src/screens/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const ShowDetail = lazy(() => import('./src/screens/ShowDetail').then((module) => ({ default: module.ShowDetail })));
const TodayPage = lazy(() => import('./src/screens/TodayPage').then((module) => ({ default: module.TodayPage })));
const UpcomingPage = lazy(() => import('./src/screens/UpcomingPage').then((module) => ({ default: module.UpcomingPage })));

function toSlug(value: string) {
  return encodeURIComponent(value);
}

function fromSlug(value = '') {
  return decodeURIComponent(value);
}

export default function App() {
  const { isCompact, isTablet, isDesktop } = useResponsive();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthed, setIsAuthed] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(isSupabaseConfigured);
  const [isSplashSettled, setIsSplashSettled] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [spoilerMode, setSpoilerMode] = useState<'strict' | 'moderate' | 'off'>('strict');
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    reminders: true,
    upcoming: true,
    replies: true,
    listActivity: true,
    productUpdates: true,
  });
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(true);
  const [selected, setSelected] = useState<Episode | null>(null);
  const [communityContext, setCommunityContext] = useState<CommunityContext | null>(null);
  const [queueIndex, setQueueIndex] = useState(0);
  const [showsQueueTab, setShowsQueueTab] = useState<'watchNext' | 'upcoming'>('watchNext');
  const {
    activeTheme,
    selectedGenres,
    selectedServices,
    setActiveTheme,
    setSelectedGenres,
    setSelectedServices,
    toggleGenre,
    toggleService,
  } = usePreferences();
  const [trackedEpisodes, setTrackedEpisodes] = useState<Episode[]>([]);
  const [trackedSearchResults, setTrackedSearchResults] = useState<SearchResult[]>([]);
  const [trackedLibraryShows, setTrackedLibraryShows] = useState<LibraryShow[]>([]);
  const [trackedMovies, setTrackedMovies] = useState<Movie[]>([]);
  const [trackedUpcomingGroups, setTrackedUpcomingGroups] = useState<UpcomingGroup[]>([]);
  const [trackedNotifications, setTrackedNotifications] = useState<NotificationItem[]>([]);
  const [notificationsPage, setNotificationsPage] = useState(0);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(false);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const [trackedLists, setTrackedLists] = useState<CustomList[]>([]);
  const [discoverItems, setDiscoverItems] = useState<DiscoverItem[]>([]);
  const [libraryTitles, setLibraryTitles] = useState<string[]>([]);
  const [dynamicShowSeasons, setDynamicShowSeasons] = useState<Record<string, ShowSeason[]>>({});
  const [dynamicShowDetails, setDynamicShowDetails] = useState<Record<string, ShowDetailInfo>>({});
  const [showDetailLoading, setShowDetailLoading] = useState<Record<string, boolean>>({});
  const [showDetailErrors, setShowDetailErrors] = useState<Record<string, string>>({});
  const [showSyncStatus, setShowSyncStatus] = useState<Record<string, ShowSyncState>>({});
  const [showDetailRetry, setShowDetailRetry] = useState<Record<string, number>>({});
  const [watchedEpisodeKeys, setWatchedEpisodeKeys] = useState<Record<string, boolean>>({});
  const [backendProfileStats, setBackendProfileStats] = useState<ProfileStats | null>(null);
  const [communityComments, setCommunityComments] = useState<CommunityComment[]>([]);
  const [communityCommentsPage, setCommunityCommentsPage] = useState(0);
  const [hasMoreCommunityComments, setHasMoreCommunityComments] = useState(false);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [movieReactions, setMovieReactions] = useState<Record<number, string>>({});
  const [adminSummary, setAdminSummary] = useState<AdminSummary | null>(null);
  const [isAdminSummaryLoading, setIsAdminSummaryLoading] = useState(false);
  const [adminSummaryError, setAdminSummaryError] = useState('');
  const [crisisControl, setCrisisControl] = useState<CrisisControl>(defaultCrisisControl);
  const realtimeTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const isAppActive = useRef(true);

  const fallbackProfileStats = useMemo(() => {
    const watchedEpisodes = trackedLibraryShows.reduce((total, show) => total + show.watchedEpisodes, 0);
    const watchedMovies = trackedMovies.filter((movie) => movie.status === 'Watched').length;
    const totalMinutes = watchedEpisodes * 44 + watchedMovies * 112;
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.round((totalMinutes % 1440) / 60);

    return {
      episodes: watchedEpisodes,
      totalTime: `${days}d ${hours}h`,
      streak: `${Math.max(1, trackedUpcomingGroups.filter((group) => group.items.some((item) => item.tracked)).length * 4)}d`,
      libraryShows: trackedLibraryShows.length,
      completedShows: trackedLibraryShows.filter((show) => show.totalEpisodes > 0 && show.watchedEpisodes >= show.totalEpisodes).length,
      reactions: 0,
      comments: communityComments.length,
    };
  }, [communityComments.length, trackedLibraryShows, trackedMovies, trackedUpcomingGroups]);
  const profileStats = backendProfileStats ?? fallbackProfileStats;
  const showsUpcomingItems = useMemo(
    () => trackedUpcomingGroups.flatMap((group) => group.items.map((item) => ({ ...item, group }))).slice(0, 8),
    [trackedUpcomingGroups]
  );

  const activeDiscovery = discoverItems.length ? discoverItems[queueIndex % discoverItems.length] : undefined;
  const nextDiscoveries = discoverItems.filter((_, index) => index !== queueIndex % Math.max(discoverItems.length, 1)).slice(0, 3);
  const activeTab = mainTabs.find((tab) => location.pathname === `/${tab}`) ?? 'today';
  const shouldShowNav = mainTabs.some((tab) => location.pathname === `/${tab}`);
  const isSyncingBackend =
    Object.values(showDetailLoading).some(Boolean) ||
    Object.values(showSyncStatus).some((status) => status === 'syncing');
  const isLegalPath = location.pathname === '/privacy' || location.pathname === '/terms';
  const isWriteLimited = crisisControl.mode === 'maintenance' || crisisControl.mode === 'readonly';
  const crisisMessage =
    crisisControl.message ||
    (crisisControl.mode === 'maintenance'
      ? 'It’s Showtime is in maintenance mode. Your watch data is safe.'
      : crisisControl.mode === 'readonly'
        ? 'Read-only mode is active. Writes are temporarily paused.'
        : crisisControl.mode === 'degraded'
        ? 'Some features are temporarily limited while we stabilize the app.'
        : '');
  const shouldShowSplash = isAuthLoading || !isSplashSettled;

  useEffect(() => {
    const timer = setTimeout(() => setIsSplashSettled(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const mapCatalogToSearchResults = (
    catalog: Awaited<ReturnType<typeof searchCatalog>>,
    existingResults: SearchResult[]
  ): SearchResult[] => [
    ...catalog.shows.map((show) => ({
      title: show.title,
      meta: `${show.status ?? 'Series'} - ${show.average_rating?.toFixed(1) ?? 'New'} rating`,
      platform: existingResults.find((result) => result.title === show.title)?.platform ?? '',
      status: libraryTitles.includes(show.title)
        ? 'In library'
        : existingResults.find((result) => result.title === show.title)?.status ?? 'Add',
      type: 'Shows' as const,
      image:
        show.poster_url ??
        existingResults.find((result) => result.title === show.title)?.image ??
        'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop',
    })),
    ...catalog.movies.map((movie) => ({
      title: movie.title,
      meta: `Movie - ${movie.runtime_minutes ?? 110} min - ${movie.average_rating?.toFixed(1) ?? 'New'} rating`,
      platform: existingResults.find((result) => result.title === movie.title)?.platform ?? '',
      status: libraryTitles.includes(movie.title)
        ? 'In library'
        : existingResults.find((result) => result.title === movie.title)?.status ?? 'Add',
      type: 'Movies' as const,
      image:
        movie.poster_url ??
        existingResults.find((result) => result.title === movie.title)?.image ??
        'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop',
    })),
  ];

  const mapTvmazeToSearchResults = (items: Awaited<ReturnType<typeof searchExternalCatalog>>): SearchResult[] =>
    items.slice(0, 12).map((item) => ({
      title: item.name,
      meta: `Series - ${item.premiered?.slice(0, 4) ?? 'Upcoming'} - ${
        item.rating.average ? (item.rating.average / 2).toFixed(1) : 'New'
      } rating`,
      platform: '',
      status: libraryTitles.includes(item.name) ? 'In library' : 'Add',
      type: 'Shows',
      image:
        item.image?.original ??
        item.image?.medium ??
        'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop',
      source: 'tvmaze',
      tmdbId: item.id,
    }));

  const mapDiscoverToSearchResult = (item: DiscoverItem): SearchResult => ({
    title: item.title,
    meta: item.meta,
    platform: item.fit[2] === 'TVmaze' ? '' : item.fit[2] ?? '',
    status: libraryTitles.includes(item.title) ? 'In library' : 'Add',
    type: 'Shows',
    image: item.image,
    source: item.source,
    tmdbId: item.tmdbId,
  });

  const mapNotifications = useCallback(
    (notifications: Awaited<ReturnType<typeof getNotifications>>) =>
      notifications.map((notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body ?? '',
        time: new Date(notification.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        unread: !notification.read_at,
        icon: Bell,
        tone: notification.read_at ? '#34392e' : gold,
      })),
    []
  );

  const refreshNotifications = useCallback(
    async (userId: string, generate = false) => {
      setIsNotificationsLoading(true);
      setNotificationsError('');
      try {
        const notifications = await getNotifications(userId, { limit: 20, offset: 0, generate });
        setTrackedNotifications(mapNotifications(notifications));
        setNotificationsPage(0);
        setHasMoreNotifications(notifications.length === 20);
      } catch {
        setNotificationsError('Notifications could not be loaded.');
      } finally {
        setIsNotificationsLoading(false);
      }
    },
    [mapNotifications]
  );

  const loadMoreNotifications = useCallback(async () => {
    if (!currentUser || isNotificationsLoading || !hasMoreNotifications) return;
    setIsNotificationsLoading(true);
    setNotificationsError('');
    try {
      const nextPage = notificationsPage + 1;
      const notifications = await getNotifications(currentUser.id, { limit: 20, offset: nextPage * 20 });
      setTrackedNotifications((current) => [...current, ...mapNotifications(notifications)]);
      setNotificationsPage(nextPage);
      setHasMoreNotifications(notifications.length === 20);
    } catch {
      setNotificationsError('More notifications could not be loaded.');
    } finally {
      setIsNotificationsLoading(false);
    }
  }, [currentUser, hasMoreNotifications, isNotificationsLoading, mapNotifications, notificationsPage]);

  const refreshUpcoming = useCallback(async (userId: string) => {
    const groups = await getUpcomingGroups(userId);
    setTrackedUpcomingGroups(groups);
  }, []);

  const refreshWatchNext = useCallback(async (userId: string) => {
    const episodes = await getWatchNextEpisodes(userId);
    setTrackedEpisodes(episodes);
  }, []);

  const refreshLists = useCallback(async (userId: string) => {
    const lists = await getHydratedLists(userId);
    setTrackedLists(lists);
  }, []);

  const refreshLibrary = useCallback(async (userId: string) => {
    const backendShows = await getLibraryShows(userId);
    setLibraryTitles(backendShows.map((show) => show.title));
    setTrackedLibraryShows(backendShows);
    setShowSyncStatus((current) => {
      const next = { ...current };
      backendShows.forEach((show) => {
        if (show.totalEpisodes > 0) next[show.title] = 'ready';
      });
      return next;
    });
    return backendShows;
  }, []);

  const refreshUserData = useCallback(
    async (userId: string) => {
      const [libraryShows] = await Promise.all([
        refreshLibrary(userId),
        refreshWatchNext(userId),
        refreshUpcoming(userId),
        refreshNotifications(userId, true),
        refreshLists(userId),
        getRecentActivity(userId).then(setRecentActivity),
        getProfileStats(userId).then(setBackendProfileStats),
      ]);

      return libraryShows;
    },
    [refreshLibrary, refreshLists, refreshNotifications, refreshUpcoming, refreshWatchNext]
  );

  const refreshProfileStats = useCallback(async (userId: string) => {
    await getProfileStats(userId).then(setBackendProfileStats);
  }, []);

  const refreshLibrarySurface = useCallback(
    async (userId: string) => {
      await Promise.all([refreshLibrary(userId), refreshWatchNext(userId)]);
    },
    [refreshLibrary, refreshWatchNext]
  );

  const refreshShowDetailSurface = useCallback(async (showTitle: string, userId?: string) => {
    const detail = await getShowDetailByTitle(showTitle, userId);
    if (!detail) return;

    setDynamicShowDetails((current) => ({ ...current, [showTitle]: detail.show }));
    setDynamicShowSeasons((current) => ({ ...current, [showTitle]: detail.seasons }));
  }, []);

  const scheduleRealtimeRefresh = useCallback((key: string, task: () => Promise<unknown> | void, delay = 450) => {
    if (!isAppActive.current) return;

    const existingTimer = realtimeTimers.current[key];
    if (existingTimer) clearTimeout(existingTimer);

    realtimeTimers.current[key] = setTimeout(() => {
      delete realtimeTimers.current[key];
      Promise.resolve(task()).catch(() => undefined);
    }, delay);
  }, []);

  useEffect(
    () => () => {
      Object.values(realtimeTimers.current).forEach(clearTimeout);
      realtimeTimers.current = {};
    },
    []
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      isAppActive.current = nextState === 'active';
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!supabase) {
      setIsAuthLoading(false);
      return undefined;
    }

    let isMounted = true;

    getCurrentSession()
      .then((session) => {
        if (!isMounted) return;
        setIsAuthed(Boolean(session));
        setCurrentUser(session?.user ? { id: session.user.id, email: session.user.email ?? '' } : null);
        setIsOnboardingOpen(!session);
      })
      .catch(() => {
        if (!isMounted) return;
        setIsAuthed(false);
      })
      .finally(() => {
        if (isMounted) setIsAuthLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session));
      setCurrentUser(session?.user ? { id: session.user.id, email: session.user.email ?? '' } : null);
      if (session) setIsOnboardingOpen(false);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;

    let isMounted = true;
    const refreshConfig = () => {
      getAppConfig()
        .then((config) => {
          if (isMounted) setCrisisControl(config);
        })
        .catch(() => undefined);
    };

    refreshConfig();
    const timer = setInterval(refreshConfig, 60_000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setProfile(null);
      setTrackedEpisodes([]);
      setTrackedLibraryShows([]);
      setTrackedUpcomingGroups([]);
      setTrackedNotifications([]);
      setTrackedLists([]);
      setLibraryTitles([]);
      setBackendProfileStats(null);
      setRecentActivity([]);
      return;
    }

    getProfile(currentUser.id)
      .then((profileRow) => {
        setProfile({
          displayName: profileRow.display_name,
          username: profileRow.username ?? currentUser.email.split('@')[0],
          theme: profileRow.theme,
          spoilerMode: profileRow.spoiler_mode,
          isAdmin: profileRow.is_admin,
        });
        if (profileRow.theme in themes) setActiveTheme(profileRow.theme as keyof typeof themes);
        setSpoilerMode(profileRow.spoiler_mode);
      })
      .catch(() => {
        setProfile({
          displayName: currentUser.email.split('@')[0] || 'Watcher',
          username: currentUser.email.split('@')[0] || 'watcher',
          theme: 'Pantone 1',
          spoilerMode: 'strict',
          isAdmin: false,
        });
      });

    getUserPreferences(currentUser.id)
      .then((preferences) => {
        if (preferences.genres.length) setSelectedGenres(preferences.genres);
        if (preferences.services.length) setSelectedServices(preferences.services);
      })
      .catch(() => undefined);

    getNotificationPreferences(currentUser.id)
      .then(setNotificationPreferences)
      .catch(() => undefined);

    requestExpoPushToken()
      .then((token) => {
        if (!token) return;
        return registerDevicePushToken({
          userId: currentUser.id,
          expoPushToken: token,
          platform: Platform.OS,
        });
      })
      .catch(() => undefined);

    if (crisisControl.features.externalSearch && crisisControl.mode !== 'maintenance') {
      getDiscoverShows(selectedGenres, selectedServices, currentUser.id)
        .then((items) => {
          setDiscoverItems(items);
          setQueueIndex(0);
        })
        .catch(() => setDiscoverItems([]));
    }

    refreshUserData(currentUser.id).catch(() => undefined);
  }, [crisisControl.features.externalSearch, crisisControl.mode, currentUser, refreshUserData, selectedGenres, selectedServices, setActiveTheme, setSelectedGenres, setSelectedServices]);

  useEffect(() => {
    if (!currentUser || !crisisControl.features.externalSearch || crisisControl.mode === 'maintenance') return;

    getDiscoverShows(selectedGenres, selectedServices, currentUser.id)
      .then((items) => {
        setDiscoverItems(items);
        setQueueIndex(0);
      })
      .catch(() => setDiscoverItems([]));
  }, [crisisControl.features.externalSearch, crisisControl.mode, currentUser, selectedGenres, selectedServices]);

  useEffect(() => {
    if (!currentUser || !supabase || !crisisControl.features.realtime || crisisControl.mode === 'maintenance') return undefined;

    const userChannel = supabase
      .channel(`itsshowtime-user-${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` },
        () => scheduleRealtimeRefresh('notifications', () => refreshNotifications(currentUser.id), 350)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_library_items', filter: `user_id=eq.${currentUser.id}` },
        () => scheduleRealtimeRefresh('library', () => refreshLibrarySurface(currentUser.id))
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'episode_watch_progress', filter: `user_id=eq.${currentUser.id}` },
        () =>
          scheduleRealtimeRefresh('watch-progress', () =>
            Promise.all([refreshLibrarySurface(currentUser.id), refreshProfileStats(currentUser.id)])
          )
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'catalog_import_jobs', filter: `created_by=eq.${currentUser.id}` },
        () => scheduleRealtimeRefresh('catalog-import', () => refreshLibrarySurface(currentUser.id), 500)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
    };
  }, [crisisControl.features.realtime, crisisControl.mode, currentUser, refreshLibrarySurface, refreshNotifications, refreshProfileStats, scheduleRealtimeRefresh]);

  const handleAuth = async (
    mode: 'signin' | 'signup',
    email: string,
    password: string,
    profile: { displayName: string; username: string }
  ) => {
    if (mode === 'signup' && !crisisControl.features.newSignups) {
      throw new Error('New account creation is temporarily paused. Please try again soon.');
    }

    const authResult =
      mode === 'signin'
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password, profile);

    if (!authResult.session) {
      throw new Error('Check your email to confirm your account, then sign in.');
    }

    setIsAuthed(true);
    setIsOnboardingOpen(mode === 'signup');
    navigate(mode === 'signup' ? '/' : '/shows');
  };

  const finishOnboarding = async () => {
    if (currentUser) {
      await saveOnboardingPreferences({
        userId: currentUser.id,
        genres: selectedGenres,
        services: selectedServices,
        starterShows: [],
      });
    }

    setIsOnboardingOpen(false);
    navigate('/shows');
  };

  const handleCatalogSearch = async (query: string, type: 'All' | 'Shows' | 'Movies' | 'People') => {
    if (type === 'People') {
      setTrackedSearchResults([]);
      return;
    }

    if (!query.trim()) {
      setTrackedSearchResults([]);
      return;
    }

    if (query.trim().length < 2) {
      return;
    }

    try {
      const catalog = await searchCatalog(query, type);
      const mappedResults = mapCatalogToSearchResults(catalog, trackedSearchResults);
      if (mappedResults.length) {
        setTrackedSearchResults(mappedResults);
        return;
      }

      if (!crisisControl.features.externalSearch || crisisControl.mode === 'maintenance') {
        setTrackedSearchResults([]);
        return;
      }

      const tmdbResults = await searchExternalCatalog(query);
      const allowedResults = type === 'Movies' ? [] : mapTvmazeToSearchResults(tmdbResults);
      setTrackedSearchResults(allowedResults);
    } catch {
      setTrackedSearchResults([]);
    }
  };

  const persistCurrentPreferences = (nextGenres = selectedGenres, nextServices = selectedServices) => {
    if (!currentUser) return;
    saveOnboardingPreferences({
      userId: currentUser.id,
      genres: nextGenres,
      services: nextServices,
      starterShows: [],
    }).catch(() => undefined);
  };

  const handleToggleGenre = (genre: string) => {
    const nextGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter((item) => item !== genre)
      : [...selectedGenres, genre];
    toggleGenre(genre);
    persistCurrentPreferences(nextGenres, selectedServices);
  };

  const handleToggleService = (service: string) => {
    const nextServices = selectedServices.includes(service)
      ? selectedServices.filter((item) => item !== service)
      : [...selectedServices, service];
    toggleService(service);
    persistCurrentPreferences(selectedGenres, nextServices);
  };

  const handleChangeTheme = (theme: keyof typeof themes) => {
    setActiveTheme(theme);
    if (currentUser) saveProfileTheme(currentUser.id, theme).catch(() => undefined);
  };

  const handleChangeSpoilerMode = (mode: 'strict' | 'moderate' | 'off') => {
    setSpoilerMode(mode);
    setProfile((current) => (current ? { ...current, spoilerMode: mode } : current));
    if (currentUser) saveProfileSettings(currentUser.id, { spoilerMode: mode }).catch(() => undefined);
  };

  const handleToggleNotificationPreference = (key: keyof NotificationPreferences) => {
    const nextPreferences = {
      ...notificationPreferences,
      [key]: !notificationPreferences[key],
    };
    setNotificationPreferences(nextPreferences);
    if (currentUser) saveNotificationPreferences(currentUser.id, nextPreferences).catch(() => undefined);
  };

  const refreshAdminSummary = async () => {
    setIsAdminSummaryLoading(true);
    setAdminSummaryError('');
    try {
      const summary = await getAdminSummary();
      setAdminSummary(summary);
      if (summary.crisisControl) setCrisisControl(summary.crisisControl);
    } catch {
      setAdminSummaryError('Admin metrics could not be loaded.');
    } finally {
      setIsAdminSummaryLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setIsAuthed(false);
    setIsOnboardingOpen(true);
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    await requestAccountDeletion('Requested from Settings');
    setIsAuthed(false);
    setIsOnboardingOpen(true);
    navigate('/');
  };

  const markEpisodeWatched = async (episodeToWatch: Episode, backendEpisodeId?: string) => {
    if (isWriteLimited) return;

    triggerSuccessFeedback();
    const episodeWatchKey = backendEpisodeId ?? episodeToWatch.backendId ?? `${episodeToWatch.show}:${episodeToWatch.code}`;
    const wasAlreadyWatched = watchedEpisodeKeys[episodeWatchKey];

    if (wasAlreadyWatched) return;

    setWatchedEpisodeKeys((keys) => ({ ...keys, [episodeWatchKey]: true }));

    setTrackedEpisodes((currentEpisodes) =>
      currentEpisodes.map((episode) =>
        episode.id === episodeToWatch.id
          ? (() => {
              const totalEpisodes = Math.max(episode.totalEpisodes, 1);
              const watchedEpisodes = Math.min(totalEpisodes, episode.watchedEpisodes + 1);

              return {
                ...episode,
                watched: true,
                watchedEpisodes,
                totalEpisodes,
                progress: Math.min(100, Math.round((watchedEpisodes / totalEpisodes) * 100)),
              };
            })()
          : episode
      )
    );

    if (currentUser) {
      const backendEpisode =
        backendEpisodeId || episodeToWatch.backendId
          ? { id: backendEpisodeId ?? episodeToWatch.backendId ?? '' }
          : await findEpisodeByShowAndCode(episodeToWatch.show, episodeToWatch.code);
      if (backendEpisode) {
        await saveEpisodeWatched(currentUser.id, backendEpisode.id, episodeToWatch.averageRating);
        await createNotification({
          userId: currentUser.id,
          type: 'Progress',
          title: `${episodeToWatch.code} watched`,
          body: `${episodeToWatch.show} moved forward in your library.`,
          deepLink: `/shows/${toSlug(episodeToWatch.show)}`,
        });
        await Promise.all([
          refreshLibrarySurface(currentUser.id),
          refreshProfileStats(currentUser.id),
          refreshShowDetailSurface(episodeToWatch.show, currentUser.id),
        ]);
      }
    }

    setTrackedLibraryShows((shows) =>
      shows.map((show) =>
        show.title === episodeToWatch.show
          ? (() => {
              const totalEpisodes = Math.max(show.totalEpisodes, 1);
              const watchedEpisodes = Math.min(totalEpisodes, show.watchedEpisodes + 1);

              return {
                ...show,
                watchedEpisodes,
                totalEpisodes,
                progress: Math.min(100, Math.round((watchedEpisodes / totalEpisodes) * 100)),
                meta: `${watchedEpisodes} of ${totalEpisodes} watched`,
                status: watchedEpisodes === totalEpisodes ? 'Finished' : show.status,
              };
            })()
          : show
      )
    );
  };

  const addShowResultToLibrary = async (resultToAdd: SearchResult) => {
    if (isWriteLimited || !crisisControl.features.catalogImport) {
      throw new Error('Adding shows is temporarily paused.');
    }

    if (resultToAdd.type !== 'Shows') return;
    triggerSelectionFeedback();

    setShowSyncStatus((current) => ({ ...current, [resultToAdd.title]: 'syncing' }));
    setLibraryTitles((titles) => (titles.includes(resultToAdd.title) ? titles : [...titles, resultToAdd.title]));

    if (!currentUser) return;

    try {
      if (resultToAdd.source === 'tvmaze' && resultToAdd.tmdbId) {
        const externalShow = (await searchExternalCatalog(resultToAdd.title)).find((show) => show.id === resultToAdd.tmdbId);
        if (externalShow) await importExternalShow(externalShow, currentUser.id);
      }

      const show = await findShowByTitle(resultToAdd.title);
      if (!show) throw new Error('Show could not be imported from the live catalog.');
      await addShowToLibrary(currentUser.id, show.id);
      await createNotification({
        userId: currentUser.id,
        type: 'Library',
        title: `${resultToAdd.title} added`,
        body: 'This show is now in your library and ready to track.',
        deepLink: `/shows/${toSlug(resultToAdd.title)}`,
      });
      await refreshLibrarySurface(currentUser.id);
      triggerSuccessFeedback();
      setShowSyncStatus((current) => ({ ...current, [resultToAdd.title]: 'ready' }));
    } catch (error) {
      setShowSyncStatus((current) => ({ ...current, [resultToAdd.title]: 'failed' }));
      setLibraryTitles((titles) => titles.filter((title) => title !== resultToAdd.title));
      throw error;
    }
  };

  const toggleSearchResult = async (title: string) => {
    const resultToToggle = trackedSearchResults.find((result) => result.title === title);

    setTrackedSearchResults((results) =>
      results.map((result) =>
        result.title === title ? { ...result, status: result.status === 'In library' ? 'Add' : 'In library' } : result
      )
    );

    if (!resultToToggle || resultToToggle.status === 'In library' || resultToToggle.type === 'Movies') return;

    try {
      await addShowResultToLibrary(resultToToggle);
    } catch {
      setTrackedSearchResults((results) =>
        results.map((result) => (result.title === title ? { ...result, status: 'Add' } : result))
      );
      throw new Error('Show could not be added. Try again in a moment.');
    }
  };

  const openSearchResult = async (result: SearchResult) => {
    if (result.type === 'Movies' || result.type === 'People') return;

    if (!isWriteLimited && crisisControl.features.catalogImport) {
      try {
        await addShowResultToLibrary(result);
      } catch {
        // The detail route can still hydrate the show from TVmaze.
      }
    }

    setTrackedSearchResults((results) =>
      results.map((item) => (item.title === result.title ? { ...item, status: 'In library' } : item))
    );
    navigate(`/shows/${toSlug(result.title)}`);
  };

  const markMovieWatched = async (movieId: number, reaction: string) => {
    const movieToWatch = trackedMovies.find((movie) => movie.id === movieId);

    setTrackedMovies((movies) =>
      movies.map((movie) => (movie.id === movieId ? { ...movie, status: 'Watched' } : movie))
    );
    setMovieReactions((reactions) => ({ ...reactions, [movieId]: reaction }));

    if (currentUser && movieToWatch) {
      const backendMovie = await findMovieByTitle(movieToWatch.title);
      if (backendMovie) await saveMovieWatched(currentUser.id, backendMovie.id, movieToWatch.averageRating);
    }
  };

  const toggleReminder = (target: UpcomingGroup['items'][number]) => {
    const nextEnabled = !trackedUpcomingGroups.some((group) =>
      group.items.some((item) => item.show === target.show && item.code === target.code && item.tracked)
    );

    setTrackedUpcomingGroups((groups) =>
      groups.map((group) => ({
        ...group,
        items: group.items.map((item) =>
          item.show === target.show && item.code === target.code ? { ...item, tracked: !item.tracked } : item
        ),
      }))
    );

    if (currentUser) {
      toggleReminderForEpisode({
        userId: currentUser.id,
        showTitle: target.show,
        code: target.code,
        episodeId: target.episodeId,
        airDate: target.airDate,
        enabled: nextEnabled,
      })
        .then(() =>
          createNotification({
            userId: currentUser.id,
            type: 'Reminder',
            title: nextEnabled ? 'Reminder enabled' : 'Reminder paused',
            body: `${target.show} ${target.code}`,
            deepLink: '/calendar',
          })
        )
        .then(() => refreshUpcoming(currentUser.id))
        .catch(() => {
          setTrackedUpcomingGroups((groups) =>
            groups.map((group) => ({
              ...group,
              items: group.items.map((item) =>
                item.show === target.show && item.code === target.code ? { ...item, tracked: !item.tracked } : item
              ),
            }))
          );
        });
    }
  };

  const openCommunity = (context: CommunityContext) => {
    setCommunityContext(context);
    setCommunityCommentsPage(0);
    getCommunityComments({ kind: context.kind, title: context.title, userId: currentUser?.id, limit: 20, offset: 0 })
      .then((comments) => {
        setCommunityComments(comments);
        setHasMoreCommunityComments(comments.length === 20);
      })
      .catch(() => setCommunityComments([]));
    navigate('/community');
  };

  const titleForPath = () => {
    if (location.pathname === '/search') return 'Search';
    if (location.pathname === '/admin') return 'Admin';
    if (location.pathname === '/notifications') return 'Notifications';
    if (location.pathname === '/community') return 'Community';
    if (location.pathname === '/settings') return 'Settings';
    if (location.pathname === '/lists') return 'Lists';
    if (location.pathname.startsWith('/episodes')) return 'Episode Reaction';
    if (location.pathname.startsWith('/shows/')) return fromSlug(location.pathname.split('/')[2]);
    if (location.pathname.startsWith('/movies/')) return fromSlug(location.pathname.split('/')[2]);

    return titleFor(activeTab);
  };

  const ShowDetailRoute = () => {
    const { title } = useParams();
    const showTitle = fromSlug(title);
    const libraryShow = trackedLibraryShows.find((item) => item.title === showTitle);
    const episode =
      trackedEpisodes.find((item) => item.show === showTitle) ??
      (libraryShow
        ? {
            id: Math.abs(showTitle.split('').reduce((total, char) => total + char.charCodeAt(0), 0)),
            show: libraryShow.title,
            code: libraryShow.next === 'Finished' || libraryShow.next === 'Importing episodes' ? 'S01 | E01' : libraryShow.next,
            title: libraryShow.next === 'Finished' ? 'Finished' : 'Next episode',
            tag: libraryShow.status.toUpperCase(),
            progress: libraryShow.progress,
            watchedEpisodes: libraryShow.watchedEpisodes,
            totalEpisodes: libraryShow.totalEpisodes,
            averageRating: 0,
            image: libraryShow.image,
            watched: libraryShow.status === 'Finished',
          }
        : undefined);

    useEffect(() => {
      if (!episode || dynamicShowSeasons[showTitle]?.length) return;

      const loadShowDetail = async () => {
        setShowDetailLoading((current) => ({ ...current, [showTitle]: true }));
        setShowDetailErrors((current) => ({ ...current, [showTitle]: '' }));
        setShowSyncStatus((current) => ({ ...current, [showTitle]: 'syncing' }));
        const detail = await getShowDetailByTitle(showTitle, currentUser?.id);
        if (detail) {
          setDynamicShowDetails((current) => ({ ...current, [showTitle]: detail.show }));
          if (detail.seasons.length) {
            setDynamicShowSeasons((current) => ({ ...current, [showTitle]: detail.seasons }));
            setShowSyncStatus((current) => ({ ...current, [showTitle]: 'ready' }));
            return;
          }
        }

        const externalMatches = await searchExternalCatalog(showTitle);
        const exactMatch = externalMatches.find((item) => item.name.toLowerCase() === showTitle.toLowerCase());
        if (!exactMatch) throw new Error('This show is not ready in the live catalog yet.');

        await importExternalShow(exactMatch, currentUser?.id);
        const refreshedDetail = await getShowDetailByTitle(showTitle, currentUser?.id);
        if (refreshedDetail) {
          setDynamicShowDetails((current) => ({ ...current, [showTitle]: refreshedDetail.show }));
          if (refreshedDetail.seasons.length) {
            setDynamicShowSeasons((current) => ({ ...current, [showTitle]: refreshedDetail.seasons }));
            setShowSyncStatus((current) => ({ ...current, [showTitle]: 'ready' }));
            if (currentUser) await refreshLibrarySurface(currentUser.id);
            return;
          }
        }
        throw new Error('Episode import finished without episode data. Try syncing again.');
      };

      loadShowDetail()
        .catch((error) => {
          setShowSyncStatus((current) => ({ ...current, [showTitle]: 'failed' }));
          setShowDetailErrors((current) => ({
            ...current,
            [showTitle]: error instanceof Error ? error.message : 'Could not load this show.',
          }));
        })
        .finally(() => {
          setShowDetailLoading((current) => ({ ...current, [showTitle]: false }));
        });
    }, [episode, showTitle, currentUser?.id, refreshLibrarySurface, showDetailRetry[showTitle]]);

    if (!episode) return <Navigate to="/shows" replace />;

    return (
      <ShowDetail
        episode={episode}
        showInfo={dynamicShowDetails[episode.show]}
        seasons={dynamicShowSeasons[episode.show] ?? []}
        isLoading={Boolean(showDetailLoading[episode.show])}
        error={showDetailErrors[episode.show]}
        syncStatus={dynamicShowDetails[episode.show]?.importStatus ?? showSyncStatus[episode.show]}
        lists={trackedLists}
        onRetry={() => {
          setDynamicShowSeasons((current) => {
            const next = { ...current };
            delete next[episode.show];
            return next;
          });
          setShowDetailErrors((current) => ({ ...current, [episode.show]: '' }));
          setShowDetailRetry((current) => ({ ...current, [episode.show]: (current[episode.show] ?? 0) + 1 }));
        }}
        onBack={() => navigate('/shows')}
        onOpenCommunity={() =>
          openCommunity({
            kind: 'episode',
            title: episode.show,
            subtitle: `${episode.code} - ${episode.title}`,
            image: episode.image,
            watched: episode.watched,
          })
        }
        onWatch={(detailEpisode) => {
          const episodeToWatch = {
            ...episode,
            backendId: detailEpisode?.id ?? episode.backendId,
            code: detailEpisode?.fullCode ?? episode.code,
            title: detailEpisode?.title ?? episode.title,
            averageRating: detailEpisode?.averageRating ?? episode.averageRating,
            watched: true,
          };
          if (!detailEpisode?.watched) {
            markEpisodeWatched(episodeToWatch, detailEpisode?.id).catch(() => undefined);
          }
          if (detailEpisode && !detailEpisode.watched) {
            setDynamicShowSeasons((current) => ({
              ...current,
              [episode.show]: (current[episode.show] ?? []).map((season) => ({
                ...season,
                episodes: season.episodes.map((item) =>
                  item.id === detailEpisode.id || item.fullCode === detailEpisode.fullCode ? { ...item, watched: true } : item
                ),
              })),
            }));
          }
          setSelected({
            ...episodeToWatch,
          });
          navigate(`/episodes/${toSlug(episode.show)}/${toSlug(detailEpisode?.fullCode ?? episode.code)}`);
        }}
        onAddToList={(listTitle) => {
          if (!currentUser) return;
          addShowTitleToList(currentUser.id, listTitle, episode.show)
            .then(() =>
              createNotification({
                userId: currentUser.id,
                type: 'List',
                title: `${episode.show} saved`,
                body: `Added to ${listTitle}.`,
                deepLink: '/lists',
              })
            )
            .then(() => refreshLists(currentUser.id))
            .catch(() => undefined);
        }}
      />
    );
  };

  const EpisodeReactionRoute = () => {
    const { title, code } = useParams();
    const episode =
      selected ??
      trackedEpisodes.find((item) => item.show === fromSlug(title)) ??
      trackedEpisodes.find((item) => item.code === fromSlug(code));

    if (!episode) return <Navigate to="/shows" replace />;

    return (
      <EpisodeReactionPage
        episode={episode}
        onBack={() => navigate(`/shows/${toSlug(episode.show)}`)}
        onSave={async (reaction) => {
          if (!currentUser) return;
          await saveEpisodeReaction({
            userId: currentUser.id,
            showTitle: episode.show,
            code: episode.code,
            reaction,
          });
          await createNotification({
            userId: currentUser.id,
            type: 'Progress',
            title: `${episode.code} reaction saved`,
            body: `${reaction.mood} saved for ${episode.show}.`,
            deepLink: `/episodes/${toSlug(episode.show)}/${toSlug(episode.code)}`,
          });
          await Promise.all([
            refreshProfileStats(currentUser.id),
            refreshShowDetailSurface(episode.show, currentUser.id),
          ]);
        }}
        onOpenCommunity={() =>
          openCommunity({
            kind: 'episode',
            title: episode.show,
            subtitle: `${episode.code} - ${episode.title}`,
            image: episode.image,
            watched: true,
          })
        }
      />
    );
  };

  const MovieDetailRoute = () => {
    const { title } = useParams();
    const movie = trackedMovies.find((item) => item.title === fromSlug(title));

    if (!movie) return <Navigate to="/movies" replace />;

    return (
      <MovieDetailPage
        movie={movie}
        lists={trackedLists}
        reaction={movieReactions[movie.id]}
        onBack={() => navigate('/movies')}
        onSaveReaction={(reaction) => {
          markMovieWatched(movie.id, reaction).catch(() => undefined);
        }}
        onAddToList={(listTitle) => {
          setTrackedLists((lists) =>
            lists.map((list) =>
              list.title === listTitle
                ? {
                    ...list,
                    count: `${Number.parseInt(list.count, 10) + 1} titles`,
                    images: [movie.image, ...list.images].slice(0, 3),
                    items: [
                      { title: movie.title, meta: `Movie - ${movie.platform}`, image: movie.image },
                      ...(list.items ?? []),
                    ],
                  }
                : list
            )
          );

          if (currentUser) {
            addMovieTitleToList(currentUser.id, listTitle, movie.title)
              .then(() =>
                createNotification({
                  userId: currentUser.id,
                  type: 'List',
                  title: `${movie.title} saved`,
                  body: `Added to ${listTitle}.`,
                  deepLink: '/lists',
                })
              )
              .then(() => refreshLists(currentUser.id))
              .catch(() => undefined);
          }
        }}
        onOpenCommunity={() =>
          openCommunity({
            kind: 'movie',
            title: movie.title,
            subtitle: `${movie.year} - ${movie.genre}`,
            image: movie.image,
            watched: movie.status === 'Watched',
          })
        }
      />
    );
  };

  return (
    <SafeAreaView style={[styles.safe, themes[activeTheme]]}>
      <StatusBar style="light" />
      {shouldShowSplash ? (
        <View style={styles.splashPage}>
          <View style={styles.splashMark}>
            <Tv color={bg} size={34} />
          </View>
          <Text style={styles.splashBrand}>It’s Showtime</Text>
          <Text style={styles.splashTitle}>Your shows are almost ready</Text>
          <Text style={styles.splashTribute}>For the TV Time era we loved.</Text>
          <View style={styles.splashDots}>
            <View style={styles.splashDot} />
            <View style={[styles.splashDot, styles.splashDotSoft]} />
            <View style={[styles.splashDot, styles.splashDotSoft]} />
          </View>
        </View>
      ) : !isAuthed && isLegalPath ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Suspense fallback={<View style={styles.authPage}><Text style={styles.authTitle}>Loading...</Text></View>}>
            <Routes>
              <Route path="/privacy" element={<LegalPage kind="privacy" onBack={() => navigate('/')} />} />
              <Route path="/terms" element={<LegalPage kind="terms" onBack={() => navigate('/')} />} />
            </Routes>
          </Suspense>
        </ScrollView>
      ) : !isAuthed ? (
        <Suspense fallback={<View style={styles.authPage}><Text style={styles.authTitle}>Loading...</Text></View>}>
          <AuthPage
            onContinue={handleAuth}
            onOpenPrivacy={() => navigate('/privacy')}
            onOpenTerms={() => navigate('/terms')}
          />
        </Suspense>
      ) : isOnboardingOpen ? (
        <Suspense fallback={<View style={styles.authPage}><Text style={styles.authTitle}>Loading...</Text></View>}>
          <OnboardingPage
            selectedGenres={selectedGenres}
            selectedServices={selectedServices}
            onToggleGenre={handleToggleGenre}
            onToggleService={handleToggleService}
            onFinish={finishOnboarding}
          />
        </Suspense>
      ) : (
        <View style={[styles.app, isCompact && styles.appCompact, isTablet && styles.appTablet, isDesktop && styles.appDesktop]}>
          <ScreenHeader
            title={titleForPath()}
            onOpenSearch={() => navigate('/search')}
            onOpenNotifications={() => navigate('/notifications')}
          />
          {isSyncingBackend ? (
            <View style={styles.syncBanner}>
              <RefreshCw color={gold} size={15} />
              <Text style={styles.syncBannerText}>Syncing latest data...</Text>
            </View>
          ) : null}
          {crisisControl.mode !== 'normal' ? (
            <View style={styles.crisisBanner}>
              <RefreshCw color={gold} size={15} />
              <Text style={styles.crisisBannerText}>{crisisMessage}</Text>
            </View>
          ) : null}

          <ScrollView
            contentContainerStyle={[
              styles.content,
              isCompact && styles.contentCompact,
              isDesktop && styles.contentDesktop,
            ]}
            showsVerticalScrollIndicator={false}
          >
            <Suspense fallback={<View style={styles.routeFallback}><Text style={styles.routeFallbackText}>Loading...</Text></View>}>
              <View key={location.pathname} style={styles.routeTransition}>
                <Routes>
                <Route path="/" element={<Navigate to="/today" replace />} />
                <Route path="/privacy" element={<LegalPage kind="privacy" onBack={() => navigate(-1)} />} />
                <Route path="/terms" element={<LegalPage kind="terms" onBack={() => navigate(-1)} />} />
                <Route
                  path="/today"
                  element={
                    <TodayPage
                      displayName={profile?.displayName ?? 'Watcher'}
                      episodes={trackedEpisodes}
                      upcomingGroups={trackedUpcomingGroups}
                      libraryShows={trackedLibraryShows}
                      notifications={trackedNotifications}
                      discovery={activeDiscovery}
                      stats={profileStats}
                      isSyncing={isSyncingBackend}
                      onOpenEpisode={(episode) => navigate(`/shows/${toSlug(episode.show)}`)}
                      onMarkWatched={(episode) => {
                        return markEpisodeWatched(episode);
                      }}
                      onOpenDiscover={() => navigate('/discover')}
                      onOpenSearch={() => navigate('/search')}
                      onOpenCalendar={() => navigate('/calendar')}
                    />
                  }
                />
                <Route
                  path="/search"
                  element={
                    <SearchPage
                      onBack={() => navigate(-1)}
                      results={trackedSearchResults}
                      selectedGenres={selectedGenres}
                      selectedServices={selectedServices}
                      onToggleResult={toggleSearchResult}
                      onSelectResult={openSearchResult}
                      onSearch={handleCatalogSearch}
                    />
                  }
                />
              <Route
                path="/notifications"
                element={
                  <NotificationsPage
                    notifications={trackedNotifications}
                    onBack={() => navigate(-1)}
                    onLoadMore={loadMoreNotifications}
                    hasMore={hasMoreNotifications}
                    isLoading={isNotificationsLoading}
                    error={notificationsError}
                    onMarkAllRead={() =>
                    {
                      setTrackedNotifications((notifications) =>
                        notifications.map((notification) => ({ ...notification, unread: false }))
                      );
                      if (currentUser) markAllNotificationsRead(currentUser.id).catch(() => undefined);
                    }}
                    onToggleRead={(id) =>
                    {
                      setTrackedNotifications((notifications) =>
                        notifications.map((notification) =>
                          notification.id === id ? { ...notification, unread: !notification.unread } : notification
                        )
                      );
                      const wasUnread = trackedNotifications.find((notification) => notification.id === id)?.unread;
                      setNotificationRead(id, Boolean(wasUnread)).catch(() => undefined);
                    }}
                  />
                }
              />
              <Route
                path="/community"
                element={
                  communityContext ? (
                    <CommunityPage
                      context={communityContext}
                      communityComments={communityComments}
                      onBack={() => navigate(-1)}
                      hasMoreComments={hasMoreCommunityComments}
                      onLoadMore={async () => {
                        if (!currentUser || !communityContext) return;
                        const nextPage = communityCommentsPage + 1;
                        const comments = await getCommunityComments({
                          kind: communityContext.kind,
                          title: communityContext.title,
                          userId: currentUser.id,
                          limit: 20,
                          offset: nextPage * 20,
                        });
                        setCommunityComments((current) => [...current, ...comments]);
                        setCommunityCommentsPage(nextPage);
                        setHasMoreCommunityComments(comments.length === 20);
                      }}
                      onSubmitComment={async (body, mood) => {
                        if (!currentUser || !communityContext) return;
                        if (isWriteLimited || !crisisControl.features.communityWrites) return;
                        await createCommunityComment({
                          userId: currentUser.id,
                          context: { kind: communityContext.kind, title: communityContext.title },
                          body,
                          mood,
                        });
                        const refreshedComments = await getCommunityComments({
                          kind: communityContext.kind,
                          title: communityContext.title,
                          userId: currentUser.id,
                          limit: 20,
                          offset: 0,
                        });
                        setCommunityComments(refreshedComments);
                        setCommunityCommentsPage(0);
                        setHasMoreCommunityComments(refreshedComments.length === 20);
                        await createNotification({
                          userId: currentUser.id,
                          type: 'Reply',
                          title: 'Comment posted',
                          body: `Your reaction is now live on ${communityContext.title}.`,
                          deepLink: '/community',
                        });
                        await refreshNotifications(currentUser.id);
                        await getProfileStats(currentUser.id).then(setBackendProfileStats);
                      }}
                      onToggleLike={async (comment) => {
                        if (!currentUser || !communityContext) return;
                        await toggleCommentLike(currentUser.id, comment.id, Boolean(comment.likedByMe));
                        const refreshedComments = await getCommunityComments({
                          kind: communityContext.kind,
                          title: communityContext.title,
                          userId: currentUser.id,
                          limit: Math.max((communityCommentsPage + 1) * 20, 20),
                          offset: 0,
                        });
                        setCommunityComments(refreshedComments);
                        setHasMoreCommunityComments(refreshedComments.length === (communityCommentsPage + 1) * 20);
                      }}
                      onDeleteComment={async (commentId) => {
                        if (!currentUser || !communityContext) return;
                        await deleteCommunityComment(currentUser.id, commentId);
                        const refreshedComments = await getCommunityComments({
                          kind: communityContext.kind,
                          title: communityContext.title,
                          userId: currentUser.id,
                          limit: Math.max((communityCommentsPage + 1) * 20, 20),
                          offset: 0,
                        });
                        setCommunityComments(refreshedComments);
                        setHasMoreCommunityComments(refreshedComments.length === (communityCommentsPage + 1) * 20);
                        await getProfileStats(currentUser.id).then(setBackendProfileStats);
                      }}
                      onReportComment={async (commentId) => {
                        if (!currentUser || !communityContext) return;
                        await reportCommunityComment(currentUser.id, commentId);
                        const refreshedComments = await getCommunityComments({
                          kind: communityContext.kind,
                          title: communityContext.title,
                          userId: currentUser.id,
                          limit: Math.max((communityCommentsPage + 1) * 20, 20),
                          offset: 0,
                        });
                        setCommunityComments(refreshedComments);
                        setHasMoreCommunityComments(refreshedComments.length === (communityCommentsPage + 1) * 20);
                        await createNotification({
                          userId: currentUser.id,
                          type: 'Moderation',
                          title: 'Comment reported',
                          body: 'Thanks. We will keep this space spoiler-safe.',
                          deepLink: '/community',
                        });
                      }}
                      onLoadReplies={(commentId) => getCommentReplies(commentId, currentUser?.id)}
                      onSubmitReply={async (comment, body, mood) => {
                        if (!currentUser) return;
                        if (isWriteLimited || !crisisControl.features.communityWrites) return;
                        await createCommunityReply({ userId: currentUser.id, parentComment: comment, body, mood });
                        await createNotification({
                          userId: comment.userId ?? currentUser.id,
                          type: 'Reply',
                          title: 'New reply',
                          body: `${profile?.displayName ?? 'A watcher'} replied to your comment.`,
                          deepLink: '/community',
                        });
                      }}
                    />
                  ) : (
                    <Navigate to="/shows" replace />
                  )
                }
              />
              <Route
                path="/settings"
                element={
                  <SettingsPage
                    onBack={() => navigate('/profile')}
                    onSignOut={handleSignOut}
                    onDeleteAccount={handleDeleteAccount}
                    displayName={profile?.displayName ?? 'Watcher'}
                    email={currentUser?.email ?? ''}
                    selectedGenres={selectedGenres}
                    selectedServices={selectedServices}
                    notificationPreferences={notificationPreferences}
                    isAdmin={Boolean(profile?.isAdmin)}
                    activeTheme={activeTheme}
                    spoilerMode={spoilerMode}
                    onChangeTheme={handleChangeTheme}
                    onChangeSpoilerMode={handleChangeSpoilerMode}
                    onToggleNotificationPreference={handleToggleNotificationPreference}
                    onToggleGenre={handleToggleGenre}
                    onToggleService={handleToggleService}
                    onOpenAdmin={() => {
                      refreshAdminSummary().catch(() => undefined);
                      navigate('/admin');
                    }}
                    onOpenPrivacy={() => navigate('/privacy')}
                    onOpenTerms={() => navigate('/terms')}
                  />
                }
              />
              <Route
                path="/admin"
                element={
                  profile?.isAdmin ? (
                    <AdminPage
                      summary={adminSummary}
                      onBack={() => navigate('/settings')}
                      onRefresh={() => refreshAdminSummary()}
                      isLoading={isAdminSummaryLoading}
                      error={adminSummaryError}
                      onRetryImport={(jobId) =>
                        retryCatalogImport(jobId)
                          .then(refreshAdminSummary)
                          .catch(() => undefined)
                      }
                      onHideComment={(commentId) =>
                        hideReportedComment(commentId)
                          .then(refreshAdminSummary)
                          .catch(() => undefined)
                      }
                      onClearCache={(cacheId) =>
                        clearSearchCache(cacheId)
                          .then(refreshAdminSummary)
                          .catch(() => undefined)
                      }
                      onRunMaintenance={() =>
                        runDatabaseMaintenance()
                          .then(refreshAdminSummary)
                          .catch(() => undefined)
                      }
                      onSetCrisisControl={(config, incidentMessage) =>
                        updateCrisisControl(config, incidentMessage)
                          .then((nextConfig) => {
                            setCrisisControl(nextConfig);
                            return refreshAdminSummary();
                          })
                          .catch(() => undefined)
                      }
                    />
                  ) : (
                    <Navigate to="/settings" replace />
                  )
                }
              />
              <Route
                path="/lists"
                element={
                  <ListsPage
                    lists={trackedLists}
                    onBack={() => navigate('/library')}
                    onCreateList={(list) => {
                      setTrackedLists((lists) => [list, ...lists]);
                      if (currentUser) {
                        saveCustomList(currentUser.id, list.title, list.description)
                          .then(() =>
                            createNotification({
                              userId: currentUser.id,
                              type: 'List',
                              title: `${list.title} created`,
                              body: 'Your new list is ready for titles.',
                              deepLink: '/lists',
                            })
                          )
                          .then(() => refreshLists(currentUser.id))
                          .catch(() => undefined);
                      }
                    }}
                    onTogglePrivacy={(title) =>
                    {
                      const currentList = trackedLists.find((list) => list.title === title);
                      const nextPrivacy = currentList?.privacy === 'Private' ? 'public' : 'private';

                      setTrackedLists((lists) =>
                        lists.map((list) =>
                          list.title === title
                            ? { ...list, privacy: list.privacy === 'Private' ? 'Public' : 'Private' }
                            : list
                        )
                      );

                      if (currentUser) toggleListPrivacy(currentUser.id, title, nextPrivacy).catch(() => undefined);
                    }}
                  />
                }
              />
              <Route path="/episodes/:title/:code" element={<EpisodeReactionRoute />} />
              <Route path="/shows/:title" element={<ShowDetailRoute />} />
              <Route
                path="/shows"
                element={
                  <View style={styles.showsQueuePanel}>
                    <View style={styles.segment}>
                      <Pressable
                        style={({ pressed }) => [styles.segmentButton, showsQueueTab === 'watchNext' && styles.segmentButtonActive, pressed && styles.pressablePressed]}
                        onPress={() => setShowsQueueTab('watchNext')}
                      >
                        <Text style={[styles.segmentButtonText, showsQueueTab === 'watchNext' && styles.segmentButtonTextActive]}>Watch Next</Text>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [styles.segmentButton, showsQueueTab === 'upcoming' && styles.segmentButtonActive, pressed && styles.pressablePressed]}
                        onPress={() => setShowsQueueTab('upcoming')}
                      >
                        <Text style={[styles.segmentButtonText, showsQueueTab === 'upcoming' && styles.segmentButtonTextActive]}>Upcoming</Text>
                      </Pressable>
                    </View>
                    {showsQueueTab === 'watchNext' && trackedEpisodes.length === 0 ? (
                      <Pressable style={({ pressed }) => [styles.showsQueueEmpty, pressed && styles.pressablePressed]} onPress={() => navigate('/search')}>
                        <View style={styles.todayNextEmptyIcon}>
                          <Tv color={gold} size={24} />
                        </View>
                        <View style={styles.todayNextEmptyCopy}>
                          <Text style={styles.libraryShowTitle}>No current shows tracked</Text>
                          <Text style={styles.libraryNext}>Add a series to start your queue.</Text>
                        </View>
                        <View style={styles.todayNextEmptyAction}>
                          <Compass color={bg} size={17} />
                          <Text style={styles.continueText}>Explore</Text>
                        </View>
                      </Pressable>
                    ) : showsQueueTab === 'watchNext' ? (
                      trackedEpisodes.map((episode) => (
                        <EpisodeCard
                          key={episode.id}
                          episode={episode}
                          onPress={() => navigate(`/shows/${toSlug(episode.show)}`)}
                        />
                      ))
                    ) : showsUpcomingItems.length === 0 ? (
                      <Pressable style={({ pressed }) => [styles.showsQueueEmpty, pressed && styles.pressablePressed]} onPress={() => navigate('/search')}>
                        <View style={styles.todayNextEmptyIcon}>
                          <CalendarDays color={gold} size={24} />
                        </View>
                        <View style={styles.todayNextEmptyCopy}>
                          <Text style={styles.libraryShowTitle}>No upcoming episodes yet</Text>
                          <Text style={styles.libraryNext}>New dates will land here.</Text>
                        </View>
                        <View style={styles.todayNextEmptyAction}>
                          <Compass color={bg} size={17} />
                          <Text style={styles.continueText}>Explore</Text>
                        </View>
                      </Pressable>
                    ) : (
                      showsUpcomingItems.map((item) => (
                        <Pressable
                          key={`${item.show}-${item.code}`}
                          style={({ pressed }) => [styles.showsUpcomingCard, pressed && styles.pressablePressed]}
                          onPress={() => navigate(`/shows/${toSlug(item.show)}`)}
                        >
                          <View style={styles.showsUpcomingDate}>
                            <Text style={styles.libraryMiniMeta}>{item.group.day}</Text>
                            <Text style={styles.libraryMiniTitle}>{item.group.date}</Text>
                          </View>
                          <View style={styles.todayNextEmptyCopy}>
                            <Text style={styles.libraryShowTitle}>{item.show}</Text>
                            <Text style={styles.libraryNext}>{item.code} - {item.title}</Text>
                          </View>
                        </Pressable>
                      ))
                    )}
                  </View>
                }
              />
              <Route path="/movies/:title" element={<MovieDetailRoute />} />
              <Route
                path="/movies"
                element={
                  <MoviesPage
                    movies={trackedMovies}
                    onSelectMovie={(movie) => navigate(`/movies/${toSlug(movie.title)}`)}
                    onSupport={() =>
                      createSupportIntent(currentUser?.id)
                        .then((intent) => window.open(intent.redirectUrl, '_blank', 'noopener,noreferrer'))
                        .catch(() => window.open('https://buymeacoffee.com/diclesara', '_blank', 'noopener,noreferrer'))
                    }
                  />
                }
              />
              <Route
                path="/discover"
                element={
                  <DiscoverQueue
                    item={activeDiscovery}
                    nextItems={nextDiscoveries}
                    onAdvance={() => setQueueIndex((index) => index + 1)}
                    onAdd={(item) => addShowResultToLibrary(mapDiscoverToSearchResult(item))}
                    onOpen={(item) => openSearchResult(mapDiscoverToSearchResult(item))}
                  />
                }
              />
              <Route path="/calendar" element={<UpcomingPage groups={trackedUpcomingGroups} onToggleReminder={toggleReminder} />} />
              <Route
                path="/library"
                element={
                  <LibraryPage
                    shows={trackedLibraryShows}
                    onOpenLists={() => navigate('/lists')}
                    onSelectShow={(show) => navigate(`/shows/${toSlug(show.title)}`)}
                  />
                }
              />
              <Route
                path="/profile"
                element={
                  <ProfileDashboard
                    displayName={profile?.displayName ?? 'Watcher'}
                    username={profile?.username ?? 'watcher'}
                    libraryShows={trackedLibraryShows}
                    recentActivity={recentActivity}
                    stats={profileStats}
                    onOpenSettings={() => navigate('/settings')}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/shows" replace />} />
                </Routes>
              </View>
            </Suspense>
          </ScrollView>

          {shouldShowNav && (
            <View style={[styles.nav, isDesktop && styles.navDesktop]}>
              <NavItem active={activeTab === 'today'} label="Today" onPress={() => navigate('/today')} icon={Home} />
              <NavItem active={activeTab === 'shows'} label="Shows" onPress={() => navigate('/shows')} icon={Tv} />
              <NavItem active={activeTab === 'movies'} label="Movies" onPress={() => navigate('/movies')} icon={Clapperboard} />
              <NavItem active={activeTab === 'discover'} label="Discover" onPress={() => navigate('/discover')} icon={Compass} />
              <NavItem active={activeTab === 'calendar'} label="Calendar" onPress={() => navigate('/calendar')} icon={CalendarDays} />
              <NavItem active={activeTab === 'library'} label="Library" onPress={() => navigate('/library')} icon={Library} />
              <NavItem active={activeTab === 'profile'} label="Profile" onPress={() => navigate('/profile')} icon={UserRound} />
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

function titleFor(tab: Tab) {
  return {
    today: 'Today',
    shows: 'Next Episodes',
    movies: 'Movie Diary',
    discover: 'Discover',
    calendar: 'Calendar',
    library: 'Library',
    profile: 'Profile',
  }[tab];
}
