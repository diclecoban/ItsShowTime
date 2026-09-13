import { StatusBar } from 'expo-status-bar';
import { Bell, CalendarDays, Clapperboard, Compass, Library, Tv, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';

import { EmptyState, EpisodeCard, NavItem, ScreenHeader } from './src/components';
import {
  customLists as initialCustomLists,
  discoveries,
  showSeasons,
  upcomingGroups as initialUpcomingGroups,
} from './src/data';
import { usePreferences } from './src/hooks/usePreferences';
import {
  getCurrentSession,
  addMovieToLibrary,
  addShowToLibrary,
  addMovieTitleToList,
  createList as saveCustomList,
  findEpisodeByShowAndCode,
  findMovieByTitle,
  findShowByTitle,
  getLists,
  getCommunityComments,
  getProfile,
  getProfileStats,
  getRecentActivity,
  getUserPreferences,
  getLibraryItems,
  getNotifications,
  getReminders,
  getShowSeasonsByTitle,
  markAllNotificationsRead,
  setNotificationRead,
  markEpisodeWatched as saveEpisodeWatched,
  markMovieWatched as saveMovieWatched,
  requestAccountDeletion,
  saveOnboardingPreferences,
  saveProfileTheme,
  searchCatalog,
  searchExternalCatalog,
  importExternalShow,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  toggleListPrivacy,
  toggleReminderForEpisode,
} from './src/lib/watchlightApi';
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
  Episode,
  LibraryShow,
  Movie,
  NotificationItem,
  CommunityComment,
  RecentActivity,
  SearchResult,
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
  const [trackedUpcomingGroups, setTrackedUpcomingGroups] = useState<UpcomingGroup[]>(initialUpcomingGroups);
  const [trackedNotifications, setTrackedNotifications] = useState<NotificationItem[]>([]);
  const [trackedLists, setTrackedLists] = useState<CustomList[]>(initialCustomLists);
  const [libraryTitles, setLibraryTitles] = useState<string[]>([]);
  const [dynamicShowSeasons, setDynamicShowSeasons] = useState<Record<string, ShowSeason[]>>({});
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

  const activeDiscovery = discoveries[queueIndex % discoveries.length];
  const nextDiscoveries = discoveries.filter((_, index) => index !== queueIndex % discoveries.length);
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

    getRecentActivity(currentUser.id)
      .then(setRecentActivity)
      .catch(() => setRecentActivity([]));

    getNotifications(currentUser.id)
      .then((notifications) => {
        if (!notifications.length) return;
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
      })
      .catch(() => undefined);

    getReminders(currentUser.id)
      .then((reminders) => {
        if (!reminders.length) return;
        setTrackedUpcomingGroups((groups) =>
          groups.map((group) => ({
            ...group,
            items: group.items.map((item) => {
              const reminder = reminders.find((row) => {
                const episode = row.episodes as
                  | { episode_number: number; seasons: { season_number: number; shows: { title: string } } }
                  | null;
                return (
                  episode?.seasons?.shows?.title === item.show &&
                  item.code.includes(`S${String(episode.seasons.season_number).padStart(2, '0')}`) &&
                  item.code.includes(`E${String(episode.episode_number).padStart(2, '0')}`)
                );
              });

              return reminder ? { ...item, tracked: reminder.enabled } : item;
            }),
          }))
        );
      })
      .catch(() => undefined);

    getLibraryItems(currentUser.id)
      .then((items) => {
        const backendShows = items
          .filter((item) => item.media_type === 'show' && item.shows)
          .map((item) => {
            const show = item.shows as { title: string; poster_url: string | null };
            const fallback = trackedLibraryShows.find((libraryShow) => libraryShow.title === show.title);

            return {
              title: show.title,
              status:
                item.status === 'finished'
                  ? 'Finished'
                  : item.status === 'paused'
                    ? 'Paused'
                    : item.status === 'dropped'
                      ? 'Dropped'
                      : 'Watching',
              progress: fallback?.progress ?? 0,
              watchedEpisodes: fallback?.watchedEpisodes ?? 0,
              totalEpisodes: fallback?.totalEpisodes ?? 8,
              next: fallback?.next ?? 'S01 | E01',
              meta: fallback?.meta ?? 'Synced from your account',
              image: show.poster_url ?? fallback?.image ?? 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop',
            } satisfies LibraryShow;
          });

        if (backendShows.length) {
          setLibraryTitles((titles) => [
            ...new Set([...titles, ...backendShows.map((show) => show.title)]),
          ]);
          setTrackedLibraryShows((shows) => [
            ...backendShows,
            ...shows.filter((show) => !backendShows.some((backendShow) => backendShow.title === show.title)),
          ]);
        }
      })
      .catch(() => undefined);

    getLists(currentUser.id)
      .then((lists) => {
        if (!lists.length) return;
        setTrackedLists((currentLists) => [
          ...lists.map((list) => ({
            title: list.title,
            count: `${list.list_items?.length ?? 0} titles`,
            privacy: list.privacy === 'public' ? 'Public' : 'Private',
            images: currentLists.find((item) => item.title === list.title)?.images ?? [],
            items: currentLists.find((item) => item.title === list.title)?.items ?? [],
          })),
          ...currentLists.filter((list) => !lists.some((backendList) => backendList.title === list.title)),
        ]);
      })
      .catch(() => undefined);
  }, [currentUser, setSelectedGenres, setSelectedServices]);

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

  const markEpisodeWatched = async (episodeToWatch: Episode) => {
    const wasAlreadyWatched = trackedEpisodes.some(
      (episode) => episode.id === episodeToWatch.id && episode.watched
    );

    setTrackedEpisodes((currentEpisodes) =>
      currentEpisodes.map((episode) =>
        episode.id === episodeToWatch.id
          ? episode.watched
            ? episode
            : {
                ...episode,
                watched: true,
                watchedEpisodes: Math.min(episode.totalEpisodes, episode.watchedEpisodes + 1),
                progress: Math.min(100, Math.round(((episode.watchedEpisodes + 1) / episode.totalEpisodes) * 100)),
              }
          : episode
      )
    );

    if (wasAlreadyWatched) return;

    if (currentUser) {
      const backendEpisode = await findEpisodeByShowAndCode(episodeToWatch.show, episodeToWatch.code);
      if (backendEpisode) {
        await saveEpisodeWatched(currentUser.id, backendEpisode.id, episodeToWatch.averageRating);
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

  const toggleSearchResult = async (title: string) => {
    const resultToToggle = trackedSearchResults.find((result) => result.title === title);

    setTrackedSearchResults((results) =>
      results.map((result) =>
        result.title === title ? { ...result, status: result.status === 'In library' ? 'Add' : 'In library' } : result
      )
    );

    if (!resultToToggle || resultToToggle.status === 'In library') return;
    if (resultToToggle.type === 'Movies') return;

    if (resultToToggle.type === 'Shows') {
      setLibraryTitles((titles) => (titles.includes(resultToToggle.title) ? titles : [...titles, resultToToggle.title]));
      setTrackedLibraryShows((shows) =>
        shows.some((show) => show.title === resultToToggle.title) ? shows : [createLibraryShow(resultToToggle), ...shows]
      );
      setTrackedEpisodes((currentEpisodes) =>
        currentEpisodes.some((episode) => episode.show === resultToToggle.title)
          ? currentEpisodes
          : [createEpisodeFromResult(resultToToggle), ...currentEpisodes]
      );

      if (currentUser) {
        try {
          if (resultToToggle.source === 'tvmaze' && resultToToggle.tmdbId) {
            const externalShow = (await searchExternalCatalog(resultToToggle.title)).find(
              (show) => show.id === resultToToggle.tmdbId
            );
            if (externalShow) await importExternalShow(externalShow);
          }

          const show = await findShowByTitle(resultToToggle.title);
          if (show) await addShowToLibrary(currentUser.id, show.id);
        } catch {
          // Keep the local add feedback; backend import can be retried from search later.
        }
      }
    }
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
      toggleReminderForEpisode({ userId: currentUser.id, showTitle: show, code, enabled: nextEnabled }).catch(() => undefined);
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
    const episode = trackedEpisodes.find((item) => item.show === showTitle);

    useEffect(() => {
      if (!episode || dynamicShowSeasons[showTitle]?.length) return;

      getShowSeasonsByTitle(showTitle)
        .then((seasons) => {
          if (!seasons.length) return;
          setDynamicShowSeasons((current) => ({ ...current, [showTitle]: seasons }));
        })
        .catch(() => undefined);
    }, [episode, showTitle]);

    if (!episode) return <Navigate to="/shows" replace />;

    return (
      <ShowDetail
        episode={episode}
        seasons={dynamicShowSeasons[episode.show] ?? showSeasons[episode.show] ?? []}
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
          markEpisodeWatched(episode).catch(() => undefined);
          setSelected({
            ...episode,
            code: detailEpisode?.code ? `S02 | ${detailEpisode.code}` : episode.code,
            title: detailEpisode?.title ?? episode.title,
            averageRating: detailEpisode?.averageRating ?? episode.averageRating,
            watched: true,
          });
          navigate(`/episodes/${toSlug(episode.show)}/${toSlug(detailEpisode?.code ?? episode.code)}`);
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
        onSave={() => {
          markEpisodeWatched(episode).catch(() => undefined);
          navigate('/shows');
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

          if (currentUser) addMovieTitleToList(currentUser.id, listTitle, movie.title).catch(() => undefined);
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
          <Text style={styles.authBrand}>Watchlight</Text>
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
        <View style={styles.app}>
          <ScreenHeader
            title={titleForPath()}
            onOpenSearch={() => navigate('/search')}
            onOpenNotifications={() => navigate('/notifications')}
          />

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
                      if (currentUser) saveCustomList(currentUser.id, list.title).catch(() => undefined);
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
                element={<DiscoverQueue item={activeDiscovery} nextItems={nextDiscoveries} onAdvance={() => setQueueIndex((index) => index + 1)} />}
              />
              <Route path="/calendar" element={<UpcomingPage groups={trackedUpcomingGroups} onToggleReminder={toggleReminder} />} />
              <Route path="/library" element={<LibraryPage shows={trackedLibraryShows} onOpenLists={() => navigate('/lists')} />} />
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
            <View style={styles.nav}>
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
