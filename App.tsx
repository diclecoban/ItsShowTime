import { StatusBar } from 'expo-status-bar';
import { CalendarDays, Clapperboard, Compass, Library, Tv, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';

import { EpisodeCard, NavItem, ScreenHeader } from './src/components';
import {
  customLists as initialCustomLists,
  discoveries,
  episodes as initialEpisodes,
  libraryShows as initialLibraryShows,
  movies as initialMovies,
  notifications as initialNotifications,
  searchResults as initialSearchResults,
  showSeasons,
  upcomingGroups as initialUpcomingGroups,
} from './src/data';
import { usePreferences } from './src/hooks/usePreferences';
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
import { themes } from './src/theme';
import type {
  CommunityContext,
  CustomList,
  Episode,
  LibraryShow,
  Movie,
  NotificationItem,
  SearchResult,
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
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(true);
  const [selected, setSelected] = useState<Episode | null>(null);
  const [communityContext, setCommunityContext] = useState<CommunityContext | null>(null);
  const [queueIndex, setQueueIndex] = useState(0);
  const { activeTheme, selectedGenres, selectedServices, setActiveTheme, toggleGenre, toggleService } = usePreferences();
  const [trackedEpisodes, setTrackedEpisodes] = useState<Episode[]>(initialEpisodes);
  const [trackedSearchResults, setTrackedSearchResults] = useState<SearchResult[]>(initialSearchResults);
  const [trackedLibraryShows, setTrackedLibraryShows] = useState<LibraryShow[]>(initialLibraryShows);
  const [trackedMovies, setTrackedMovies] = useState<Movie[]>(initialMovies);
  const [trackedUpcomingGroups, setTrackedUpcomingGroups] = useState<UpcomingGroup[]>(initialUpcomingGroups);
  const [trackedNotifications, setTrackedNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [trackedLists, setTrackedLists] = useState<CustomList[]>(initialCustomLists);
  const [movieReactions, setMovieReactions] = useState<Record<number, string>>({});
  const [selectedStarterShows, setSelectedStarterShows] = useState(['Severance', 'The Bear', 'Dark']);

  const profileStats = useMemo(() => {
    const watchedEpisodes = trackedLibraryShows.reduce((total, show) => total + show.watchedEpisodes, 0);
    const watchedMovies = trackedMovies.filter((movie) => movie.status === 'Watched').length;
    const totalMinutes = watchedEpisodes * 44 + watchedMovies * 112;
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.round((totalMinutes % 1440) / 60);

    return {
      episodes: watchedEpisodes + 1274,
      totalTime: `${days}d ${hours}h`,
      streak: `${Math.max(1, trackedUpcomingGroups.filter((group) => group.items.some((item) => item.tracked)).length * 4)}d`,
    };
  }, [trackedLibraryShows, trackedMovies, trackedUpcomingGroups]);

  const activeDiscovery = discoveries[queueIndex % discoveries.length];
  const nextDiscoveries = discoveries.filter((_, index) => index !== queueIndex % discoveries.length);
  const activeTab = mainTabs.find((tab) => location.pathname === `/${tab}`) ?? 'shows';
  const shouldShowNav = mainTabs.some((tab) => location.pathname === `/${tab}`);

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

  const markEpisodeWatched = (episodeToWatch: Episode) => {
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

  const toggleSearchResult = (title: string) => {
    const resultToToggle = trackedSearchResults.find((result) => result.title === title);

    setTrackedSearchResults((results) =>
      results.map((result) =>
        result.title === title ? { ...result, status: result.status === 'In library' ? 'Add' : 'In library' } : result
      )
    );

    if (!resultToToggle || resultToToggle.status === 'In library') return;

    if (resultToToggle.type === 'Shows') {
      setTrackedLibraryShows((shows) =>
        shows.some((show) => show.title === resultToToggle.title) ? shows : [createLibraryShow(resultToToggle), ...shows]
      );
      setTrackedEpisodes((currentEpisodes) =>
        currentEpisodes.some((episode) => episode.show === resultToToggle.title)
          ? currentEpisodes
          : [createEpisodeFromResult(resultToToggle), ...currentEpisodes]
      );
    }

    if (resultToToggle.type === 'Movies') {
      setTrackedMovies((movies) =>
        movies.some((movie) => movie.title === resultToToggle.title)
          ? movies
          : [
              {
                id: Date.now(),
                title: resultToToggle.title,
                year: 'Watchlist',
                runtime: '116 min',
                platform: resultToToggle.platform,
                genre: resultToToggle.meta.split(' - ')[1] ?? 'Drama',
                status: 'Watchlist',
                averageRating: 4.4,
                body: 'Added from search and ready for your next movie night.',
                image: resultToToggle.image,
              },
              ...movies,
            ]
      );
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

  const markMovieWatched = (movieId: number, reaction: string) => {
    setTrackedMovies((movies) =>
      movies.map((movie) => (movie.id === movieId ? { ...movie, status: 'Watched' } : movie))
    );
    setMovieReactions((reactions) => ({ ...reactions, [movieId]: reaction }));
  };

  const toggleReminder = (show: string, code: string) => {
    setTrackedUpcomingGroups((groups) =>
      groups.map((group) => ({
        ...group,
        items: group.items.map((item) =>
          item.show === show && item.code === code ? { ...item, tracked: !item.tracked } : item
        ),
      }))
    );
  };

  const openCommunity = (context: CommunityContext) => {
    setCommunityContext(context);
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
    const episode = trackedEpisodes.find((item) => item.show === fromSlug(title));

    if (!episode) return <Navigate to="/shows" replace />;

    return (
      <ShowDetail
        episode={episode}
        seasons={showSeasons[episode.show] ?? []}
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
          markEpisodeWatched(episode);
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
          markEpisodeWatched(episode);
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
        onSaveReaction={(reaction) => markMovieWatched(movie.id, reaction)}
        onAddToList={(listTitle) =>
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
          )
        }
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
      {!isAuthed ? (
        <AuthPage
          onContinue={() => {
            setIsAuthed(true);
            navigate('/shows');
          }}
        />
      ) : isOnboardingOpen ? (
        <OnboardingPage
          selectedGenres={selectedGenres}
          selectedServices={selectedServices}
          selectedStarterShows={selectedStarterShows}
          onToggleGenre={toggleGenre}
          onToggleService={toggleService}
          onToggleStarterShow={(title) =>
            setSelectedStarterShows((titles) =>
              titles.includes(title) ? titles.filter((selectedTitle) => selectedTitle !== title) : [...titles, title]
            )
          }
          onFinish={() => {
            addSelectedStarterShows();
            setIsOnboardingOpen(false);
            navigate('/shows');
          }}
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
                      setTrackedNotifications((notifications) =>
                        notifications.map((notification) => ({ ...notification, unread: false }))
                      )
                    }
                    onToggleRead={(id) =>
                      setTrackedNotifications((notifications) =>
                        notifications.map((notification) =>
                          notification.id === id ? { ...notification, unread: !notification.unread } : notification
                        )
                      )
                    }
                  />
                }
              />
              <Route
                path="/community"
                element={communityContext ? <CommunityPage context={communityContext} onBack={() => navigate(-1)} /> : <Navigate to="/shows" replace />}
              />
              <Route
                path="/settings"
                element={
                  <SettingsPage
                    onBack={() => navigate('/profile')}
                    selectedGenres={selectedGenres}
                    selectedServices={selectedServices}
                    activeTheme={activeTheme}
                    onChangeTheme={setActiveTheme}
                    onToggleGenre={toggleGenre}
                    onToggleService={toggleService}
                  />
                }
              />
              <Route
                path="/lists"
                element={
                  <ListsPage
                    lists={trackedLists}
                    onBack={() => navigate('/library')}
                    onCreateList={(list) => setTrackedLists((lists) => [list, ...lists])}
                    onTogglePrivacy={(title) =>
                      setTrackedLists((lists) =>
                        lists.map((list) =>
                          list.title === title
                            ? { ...list, privacy: list.privacy === 'Private' ? 'Public' : 'Private' }
                            : list
                        )
                      )
                    }
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
                    {trackedEpisodes.map((episode) => (
                      <EpisodeCard
                        key={episode.id}
                        episode={episode}
                        onPress={() => navigate(`/shows/${toSlug(episode.show)}`)}
                      />
                    ))}
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
                    selectedGenres={selectedGenres}
                    selectedServices={selectedServices}
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
