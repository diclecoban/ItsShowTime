import { StatusBar } from 'expo-status-bar';
import { Bell, CalendarDays, Clapperboard, Compass, Library, Tv, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';

import { EmptyState, EpisodeCard, NavItem, ScreenHeader } from './src/components';
import { showSeasons } from './src/data';
import { usePreferences } from './src/hooks/usePreferences';
import { useResponsive } from './src/hooks/useResponsive';
import {
  getCurrentSession,
  addMovieToLibrary,
  addShowToLibrary,
  addMovieTitleToList,
  addShowTitleToList,
  createCommunityComment,
  createNotification,
  createList as saveCustomList,
  findEpisodeByShowAndCode,
  findMovieByTitle,
  findShowByTitle,
  getHydratedLists,
  getCommunityComments,
  getProfile,
  getProfileStats,
  getRecentActivity,
  getUserPreferences,
  getLibraryShows,
  getNotifications,
  getDiscoverShows,
  getUpcomingGroups,
  getWatchNextEpisodes,
  getShowDetailByTitle,
  markAllNotificationsRead,
  setNotificationRead,
  markEpisodeWatched as saveEpisodeWatched,
  markMovieWatched as saveMovieWatched,
  requestAccountDeletion,
  saveOnboardingPreferences,
  saveEpisodeReaction,
  saveProfileTheme,
  searchCatalog,
  searchExternalCatalog,
  importExternalShow,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  toggleListPrivacy,
  toggleReminderForEpisode,
} from './src/lib/itsShowTimeApi';
import { isSupabaseConfigured, supabase } from './src/lib/supabase';
import {
  AuthPage,
  CommunityPage,
  DiscoverQueue,
  EpisodeReactionPage,
  LibraryPage,
  ListsPage,
  MovieDetailPage,
  MoviesPage,
  NotificationsPage,
  OnboardingPage,
  ProfileDashboard,
  SearchPage,
  SettingsPage,
  ShowDetail,
  UpcomingPage,
} from './src/screens';
import { styles } from './src/styles';
import { gold, themes } from './src/theme';
import type {
  CommunityContext,
  CustomList,
  DiscoverItem,
  Episode,
  LibraryShow,
  Movie,
  NotificationItem,
  CommunityComment,
  RecentActivity,
  SearchResult,
  ShowDetailInfo,
  ShowSeason,
  Tab,
  UpcomingGroup,
} from './src/types';

const mainTabs: Tab[] = ['shows', 'movies', 'discover', 'calendar', 'library', 'profile'];

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
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<{ displayName: string; username: string } | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(true);
  const [selected, setSelected] = useState<Episode | null>(null);
  const [communityContext, setCommunityContext] = useState<CommunityContext | null>(null);
  const [queueIndex, setQueueIndex] = useState(0);
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
  const [trackedLists, setTrackedLists] = useState<CustomList[]>([]);
  const [discoverItems, setDiscoverItems] = useState<DiscoverItem[]>([]);
  const [libraryTitles, setLibraryTitles] = useState<string[]>([]);
  const [dynamicShowSeasons, setDynamicShowSeasons] = useState<Record<string, ShowSeason[]>>({});
  const [dynamicShowDetails, setDynamicShowDetails] = useState<Record<string, ShowDetailInfo>>({});
  const [showDetailLoading, setShowDetailLoading] = useState<Record<string, boolean>>({});
  const [showDetailErrors, setShowDetailErrors] = useState<Record<string, string>>({});
  const [showDetailRetry, setShowDetailRetry] = useState<Record<string, number>>({});
  const [watchedEpisodeKeys, setWatchedEpisodeKeys] = useState<Record<string, boolean>>({});
  const [backendProfileStats, setBackendProfileStats] = useState<{ episodes: number; totalTime: string; streak: string } | null>(null);
  const [communityComments, setCommunityComments] = useState<CommunityComment[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [movieReactions, setMovieReactions] = useState<Record<number, string>>({});
  const [selectedStarterShows, setSelectedStarterShows] = useState(['Severance', 'The Bear', 'Dark']);

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
    };
  }, [trackedLibraryShows, trackedMovies, trackedUpcomingGroups]);
  const profileStats = backendProfileStats ?? fallbackProfileStats;

  const activeDiscovery = discoverItems.length ? discoverItems[queueIndex % discoverItems.length] : undefined;
  const nextDiscoveries = discoverItems.filter((_, index) => index !== queueIndex % Math.max(discoverItems.length, 1)).slice(0, 3);
  const activeTab = mainTabs.find((tab) => location.pathname === `/${tab}`) ?? 'shows';
  const shouldShowNav = mainTabs.some((tab) => location.pathname === `/${tab}`);

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

  const refreshNotifications = async (userId: string) => {
    const notifications = await getNotifications(userId);
    setTrackedNotifications(
      notifications.map((notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body ?? '',
        time: new Date(notification.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        unread: !notification.read_at,
        icon: Bell,
        tone: notification.read_at ? '#34392e' : gold,
      }))
    );
  };

  const refreshUpcoming = async (userId: string) => {
    const groups = await getUpcomingGroups(userId);
    setTrackedUpcomingGroups(groups);
  };

  const refreshWatchNext = async (userId: string) => {
    const episodes = await getWatchNextEpisodes(userId);
    setTrackedEpisodes(episodes);
  };

  const refreshLists = async (userId: string) => {
    const lists = await getHydratedLists(userId);
    setTrackedLists(lists);
  };

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
    if (!currentUser) {
      setProfile(null);
      setTrackedEpisodes([]);
      setTrackedLibraryShows([]);
      setTrackedUpcomingGroups([]);
      setTrackedNotifications([]);
      setTrackedLists([]);
      return;
    }

    getProfile(currentUser.id)
      .then((profileRow) => {
        setProfile({
          displayName: profileRow.display_name,
          username: profileRow.username ?? currentUser.email.split('@')[0],
        });
      })
      .catch(() => {
        setProfile({
          displayName: currentUser.email.split('@')[0] || 'Watcher',
          username: currentUser.email.split('@')[0] || 'watcher',
        });
      });

    getUserPreferences(currentUser.id)
      .then((preferences) => {
        if (preferences.genres.length) setSelectedGenres(preferences.genres);
        if (preferences.services.length) setSelectedServices(preferences.services);
      })
      .catch(() => undefined);

    getProfileStats(currentUser.id)
      .then(setBackendProfileStats)
      .catch(() => undefined);

    getDiscoverShows(selectedGenres, selectedServices)
      .then((items) => {
        setDiscoverItems(items);
        setQueueIndex(0);
      })
      .catch(() => setDiscoverItems([]));

    getRecentActivity(currentUser.id)
      .then(setRecentActivity)
      .catch(() => setRecentActivity([]));

    refreshNotifications(currentUser.id).catch(() => setTrackedNotifications([]));
    refreshUpcoming(currentUser.id).catch(() => setTrackedUpcomingGroups([]));

    getLibraryShows(currentUser.id)
      .then((backendShows) => {
        setLibraryTitles(backendShows.map((show) => show.title));
        setTrackedLibraryShows(backendShows);
      })
      .catch(() => undefined);
    refreshWatchNext(currentUser.id).catch(() => setTrackedEpisodes([]));

    refreshLists(currentUser.id).catch(() => setTrackedLists([]));
  }, [currentUser, setSelectedGenres, setSelectedServices]);

  useEffect(() => {
    if (!currentUser) return;

    getDiscoverShows(selectedGenres, selectedServices)
      .then((items) => {
        setDiscoverItems(items);
        setQueueIndex(0);
      })
      .catch(() => setDiscoverItems([]));
  }, [currentUser, selectedGenres, selectedServices]);

  const handleAuth = async (
    mode: 'signin' | 'signup',
    email: string,
    password: string,
    profile: { displayName: string; username: string }
  ) => {
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
    addSelectedStarterShows();

    if (currentUser) {
      await saveOnboardingPreferences({
        userId: currentUser.id,
        genres: selectedGenres,
        services: selectedServices,
        starterShows: selectedStarterShows,
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

  const createLibraryShow = (result: SearchResult): LibraryShow => {
    const totalEpisodes = showSeasons[result.title]?.reduce((count, season) => count + season.episodes.length, 0) ?? 8;

    return {
      title: result.title,
      status: 'Watching',
      progress: 0,
      watchedEpisodes: 0,
      totalEpisodes,
      next: 'S01 | E01',
      meta: `0 of ${totalEpisodes} watched`,
      image: result.image,
    };
  };

  const createEpisodeFromResult = (result: SearchResult): Episode => ({
    id: Date.now() + result.title.length,
    show: result.title,
    code: 'S01 | E01',
    title: showSeasons[result.title]?.[0]?.episodes[0]?.title ?? 'Pilot',
    tag: 'START WATCHING',
    progress: 0,
    watchedEpisodes: 0,
    totalEpisodes: showSeasons[result.title]?.reduce((count, season) => count + season.episodes.length, 0) ?? 8,
    averageRating: showSeasons[result.title]?.[0]?.episodes[0]?.averageRating ?? 4.2,
    image: result.image,
    watched: false,
  });

  const markEpisodeWatched = async (episodeToWatch: Episode, backendEpisodeId?: string) => {
    const episodeWatchKey = backendEpisodeId ?? `${episodeToWatch.show}:${episodeToWatch.code}`;
    const wasAlreadyWatched = watchedEpisodeKeys[episodeWatchKey];

    if (wasAlreadyWatched) return;

    setWatchedEpisodeKeys((keys) => ({ ...keys, [episodeWatchKey]: true }));

    setTrackedEpisodes((currentEpisodes) =>
      currentEpisodes.map((episode) =>
        episode.id === episodeToWatch.id
          ? {
              ...episode,
              watched: true,
              watchedEpisodes: Math.min(episode.totalEpisodes, episode.watchedEpisodes + 1),
              progress: Math.min(100, Math.round(((episode.watchedEpisodes + 1) / episode.totalEpisodes) * 100)),
            }
          : episode
      )
    );

    if (currentUser) {
      const backendEpisode = backendEpisodeId ? { id: backendEpisodeId } : await findEpisodeByShowAndCode(episodeToWatch.show, episodeToWatch.code);
      if (backendEpisode) {
        await saveEpisodeWatched(currentUser.id, backendEpisode.id, episodeToWatch.averageRating);
        createNotification({
          userId: currentUser.id,
          type: 'Progress',
          title: `${episodeToWatch.code} watched`,
          body: `${episodeToWatch.show} moved forward in your library.`,
          deepLink: `/shows/${toSlug(episodeToWatch.show)}`,
        })
          .then(() => refreshNotifications(currentUser.id))
          .catch(() => undefined);
        getLibraryShows(currentUser.id)
          .then((backendShows) => {
            setLibraryTitles(backendShows.map((show) => show.title));
            setTrackedLibraryShows(backendShows);
          })
          .catch(() => undefined);
        refreshWatchNext(currentUser.id).catch(() => undefined);
        getRecentActivity(currentUser.id).then(setRecentActivity).catch(() => undefined);
        getProfileStats(currentUser.id).then(setBackendProfileStats).catch(() => undefined);
      }
    }

    setTrackedLibraryShows((shows) =>
      shows.map((show) =>
        show.title === episodeToWatch.show
          ? {
              ...show,
              watchedEpisodes: Math.min(show.totalEpisodes, show.watchedEpisodes + 1),
              progress: Math.min(100, Math.round(((show.watchedEpisodes + 1) / show.totalEpisodes) * 100)),
              meta: `${Math.min(show.totalEpisodes, show.watchedEpisodes + 1)} of ${show.totalEpisodes} watched`,
              status: Math.min(show.totalEpisodes, show.watchedEpisodes + 1) === show.totalEpisodes ? 'Finished' : show.status,
            }
          : show
      )
    );
  };

  const addShowResultToLibrary = async (resultToAdd: SearchResult) => {
    if (resultToAdd.type !== 'Shows') return;

    setLibraryTitles((titles) => (titles.includes(resultToAdd.title) ? titles : [...titles, resultToAdd.title]));
    setTrackedLibraryShows((shows) =>
      shows.some((show) => show.title === resultToAdd.title) ? shows : [createLibraryShow(resultToAdd), ...shows]
    );
    setTrackedEpisodes((currentEpisodes) =>
      currentEpisodes.some((episode) => episode.show === resultToAdd.title)
        ? currentEpisodes
        : [createEpisodeFromResult(resultToAdd), ...currentEpisodes]
    );

    if (!currentUser) return;

    if (resultToAdd.source === 'tvmaze' && resultToAdd.tmdbId) {
      const externalShow = (await searchExternalCatalog(resultToAdd.title)).find((show) => show.id === resultToAdd.tmdbId);
      if (externalShow) await importExternalShow(externalShow);
    }

    const show = await findShowByTitle(resultToAdd.title);
    if (show) await addShowToLibrary(currentUser.id, show.id);
    await createNotification({
      userId: currentUser.id,
      type: 'Library',
      title: `${resultToAdd.title} added`,
      body: 'This show is now in your library and ready to track.',
      deepLink: `/shows/${toSlug(resultToAdd.title)}`,
    });
    const backendShows = await getLibraryShows(currentUser.id);
    setLibraryTitles(backendShows.map((show) => show.title));
    setTrackedLibraryShows(backendShows);
    await refreshWatchNext(currentUser.id);
    refreshNotifications(currentUser.id).catch(() => undefined);
    refreshUpcoming(currentUser.id).catch(() => undefined);
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
      // Keep the local add feedback; backend import can be retried from search later.
    }
  };

  const openSearchResult = async (result: SearchResult) => {
    if (result.type === 'Movies' || result.type === 'People') return;

    try {
      await addShowResultToLibrary(result);
    } catch {
      // The detail route can still hydrate the show from TVmaze.
    }

    setTrackedSearchResults((results) =>
      results.map((item) => (item.title === result.title ? { ...item, status: 'In library' } : item))
    );
    navigate(`/shows/${toSlug(result.title)}`);
  };

  const addSelectedStarterShows = () => {
    selectedStarterShows.forEach((title) => {
      const result = trackedSearchResults.find((item) => item.title === title && item.type === 'Shows');

      if (!result) return;

      setTrackedSearchResults((results) =>
        results.map((item) => (item.title === title ? { ...item, status: 'In library' } : item))
      );
      setTrackedLibraryShows((shows) =>
        shows.some((show) => show.title === title) ? shows : [createLibraryShow({ ...result, status: 'In library' }), ...shows]
      );
      setTrackedEpisodes((currentEpisodes) =>
        currentEpisodes.some((episode) => episode.show === title)
          ? currentEpisodes
          : [createEpisodeFromResult({ ...result, status: 'In library' }), ...currentEpisodes]
      );
    });
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

  const toggleReminder = (show: string, code: string) => {
    const nextEnabled = !trackedUpcomingGroups.some((group) =>
      group.items.some((item) => item.show === show && item.code === code && item.tracked)
    );

    setTrackedUpcomingGroups((groups) =>
      groups.map((group) => ({
        ...group,
        items: group.items.map((item) =>
          item.show === show && item.code === code ? { ...item, tracked: !item.tracked } : item
        ),
      }))
    );

    if (currentUser) {
      toggleReminderForEpisode({ userId: currentUser.id, showTitle: show, code, enabled: nextEnabled })
        .then(() =>
          createNotification({
            userId: currentUser.id,
            type: 'Reminder',
            title: nextEnabled ? 'Reminder enabled' : 'Reminder paused',
            body: `${show} ${code}`,
            deepLink: '/calendar',
          })
        )
        .then(() => Promise.all([refreshUpcoming(currentUser.id), refreshNotifications(currentUser.id)]))
        .catch(() => undefined);
    }
  };

  const openCommunity = (context: CommunityContext) => {
    setCommunityContext(context);
    getCommunityComments({ kind: context.kind, title: context.title })
      .then(setCommunityComments)
      .catch(() => setCommunityComments([]));
    navigate('/community');
  };

  const titleForPath = () => {
    if (location.pathname === '/search') return 'Search';
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
        const detail = await getShowDetailByTitle(showTitle, currentUser?.id);
        if (detail) {
          setDynamicShowDetails((current) => ({ ...current, [showTitle]: detail.show }));
          if (detail.seasons.length) {
            setDynamicShowSeasons((current) => ({ ...current, [showTitle]: detail.seasons }));
          }
        }

        const externalMatches = await searchExternalCatalog(showTitle);
        const exactMatch = externalMatches.find((item) => item.name.toLowerCase() === showTitle.toLowerCase());
        if (!exactMatch) return;

        await importExternalShow(exactMatch);
        const refreshedDetail = await getShowDetailByTitle(showTitle, currentUser?.id);
        if (refreshedDetail) {
          setDynamicShowDetails((current) => ({ ...current, [showTitle]: refreshedDetail.show }));
          if (refreshedDetail.seasons.length) {
            setDynamicShowSeasons((current) => ({ ...current, [showTitle]: refreshedDetail.seasons }));
          }
        }
      };

      loadShowDetail()
        .catch((error) => {
          setShowDetailErrors((current) => ({
            ...current,
            [showTitle]: error instanceof Error ? error.message : 'Could not load this show.',
          }));
        })
        .finally(() => {
          setShowDetailLoading((current) => ({ ...current, [showTitle]: false }));
        });
    }, [episode, showTitle, currentUser?.id, showDetailRetry[showTitle]]);

    if (!episode) return <Navigate to="/shows" replace />;

    return (
      <ShowDetail
        episode={episode}
        showInfo={dynamicShowDetails[episode.show]}
        seasons={dynamicShowSeasons[episode.show] ?? []}
        isLoading={Boolean(showDetailLoading[episode.show])}
        error={showDetailErrors[episode.show]}
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
            .then(() => Promise.all([refreshLists(currentUser.id), refreshNotifications(currentUser.id)]))
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
            refreshWatchNext(currentUser.id),
            getLibraryShows(currentUser.id).then((backendShows) => {
              setLibraryTitles(backendShows.map((show) => show.title));
              setTrackedLibraryShows(backendShows);
            }),
            getRecentActivity(currentUser.id).then(setRecentActivity),
            getProfileStats(currentUser.id).then(setBackendProfileStats),
            refreshNotifications(currentUser.id),
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
              .then(() => Promise.all([refreshLists(currentUser.id), refreshNotifications(currentUser.id)]))
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
      {isAuthLoading ? (
        <View style={styles.authPage}>
          <Text style={styles.authBrand}>It’s Showtime</Text>
          <Text style={styles.authTitle}>Opening your watch home...</Text>
        </View>
      ) : !isAuthed ? (
        <AuthPage onContinue={handleAuth} />
      ) : isOnboardingOpen ? (
        <OnboardingPage
          selectedGenres={selectedGenres}
          selectedServices={selectedServices}
          selectedStarterShows={selectedStarterShows}
          onToggleGenre={handleToggleGenre}
          onToggleService={handleToggleService}
          onToggleStarterShow={(title) =>
            setSelectedStarterShows((titles) =>
              titles.includes(title) ? titles.filter((selectedTitle) => selectedTitle !== title) : [...titles, title]
            )
          }
          onFinish={finishOnboarding}
        />
      ) : (
        <View style={[styles.app, isCompact && styles.appCompact, isTablet && styles.appTablet, isDesktop && styles.appDesktop]}>
          <ScreenHeader
            title={titleForPath()}
            onOpenSearch={() => navigate('/search')}
            onOpenNotifications={() => navigate('/notifications')}
          />

          <ScrollView
            contentContainerStyle={[
              styles.content,
              isCompact && styles.contentCompact,
              isDesktop && styles.contentDesktop,
            ]}
            showsVerticalScrollIndicator={false}
          >
            <Routes>
                <Route path="/" element={<Navigate to="/shows" replace />} />
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
                      onSubmitComment={async (body, mood) => {
                        if (!currentUser || !communityContext) return;
                        await createCommunityComment({
                          userId: currentUser.id,
                          context: { kind: communityContext.kind, title: communityContext.title },
                          body,
                          mood,
                        });
                        const refreshedComments = await getCommunityComments({
                          kind: communityContext.kind,
                          title: communityContext.title,
                        });
                        setCommunityComments(refreshedComments);
                        await createNotification({
                          userId: currentUser.id,
                          type: 'Reply',
                          title: 'Comment posted',
                          body: `Your reaction is now live on ${communityContext.title}.`,
                          deepLink: '/community',
                        });
                        await refreshNotifications(currentUser.id);
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
                    activeTheme={activeTheme}
                    onChangeTheme={handleChangeTheme}
                    onToggleGenre={handleToggleGenre}
                    onToggleService={handleToggleService}
                  />
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
                        saveCustomList(currentUser.id, list.title)
                          .then(() =>
                            createNotification({
                              userId: currentUser.id,
                              type: 'List',
                              title: `${list.title} created`,
                              body: 'Your new list is ready for titles.',
                              deepLink: '/lists',
                            })
                          )
                          .then(() => Promise.all([refreshLists(currentUser.id), refreshNotifications(currentUser.id)]))
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
                  <>
                    <View style={styles.segment}>
                      <Text style={styles.segmentActive}>Watch Next</Text>
                      <Text style={styles.segmentMuted}>Upcoming</Text>
                    </View>
                    {trackedEpisodes.length === 0 ? (
                      <EmptyState
                        icon={Tv}
                        title="No current shows tracked"
                        body="Search for a series and add it to your Library to build your next episode queue."
                        action="Find shows"
                      />
                    ) : (
                      trackedEpisodes.map((episode) => (
                        <EpisodeCard
                          key={episode.id}
                          episode={episode}
                          onPress={() => navigate(`/shows/${toSlug(episode.show)}`)}
                        />
                      ))
                    )}
                  </>
                }
              />
              <Route path="/movies/:title" element={<MovieDetailRoute />} />
              <Route
                path="/movies"
                element={<MoviesPage movies={trackedMovies} onSelectMovie={(movie) => navigate(`/movies/${toSlug(movie.title)}`)} />}
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
          </ScrollView>

          {shouldShowNav && (
            <View style={[styles.nav, isDesktop && styles.navDesktop]}>
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
    shows: 'Next Episodes',
    movies: 'Movie Diary',
    discover: 'Discover',
    calendar: 'Calendar',
    library: 'Library',
    profile: 'Profile',
  }[tab];
}
