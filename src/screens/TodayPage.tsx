import { CalendarDays, Check, Compass, Play, Search, Tv } from 'lucide-react';
import { Pressable, Text, View } from 'react-native';

import { BackendState, CachedImageBackground, MiniStat, ProgressRail } from '../components';
import { useResponsive } from '../hooks/useResponsive';
import { accent, bg, gold, ink } from '../theme';
import { styles } from '../styles';
import type { DiscoverItem, Episode, LibraryShow, NotificationItem, ProfileStats, UpcomingGroup } from '../types';

export function TodayPage({
  displayName,
  episodes,
  upcomingGroups,
  libraryShows,
  notifications,
  discovery,
  stats,
  isSyncing,
  onOpenEpisode,
  onMarkWatched,
  onOpenDiscover,
  onOpenSearch,
  onOpenCalendar,
}: {
  displayName: string;
  episodes: Episode[];
  upcomingGroups: UpcomingGroup[];
  libraryShows: LibraryShow[];
  notifications: NotificationItem[];
  discovery?: DiscoverItem;
  stats: ProfileStats;
  isSyncing?: boolean;
  onOpenEpisode: (episode: Episode) => void;
  onMarkWatched: (episode: Episode) => void | Promise<void>;
  onOpenDiscover: () => void;
  onOpenSearch: () => void;
  onOpenCalendar: () => void;
}) {
  const { isCompact } = useResponsive();
  const nextEpisode = episodes[0];
  const nextUpcoming = upcomingGroups.flatMap((group) => group.items.map((item) => ({ ...item, group }))).slice(0, 3);
  const unreadCount = notifications.filter((notification) => notification.unread).length;
  const activeShows = libraryShows.filter((show) => show.status === 'Watching').length;

  return (
    <View>
      <View style={[styles.todayHero, isCompact && styles.todayHeroCompact]}>
        <View style={styles.todayHeroCopy}>
          <Text style={styles.libraryKicker}>Today</Text>
          <Text style={styles.todayTitle}>Welcome back, {displayName}</Text>
          <Text style={styles.libraryBody}>Continue, plan, discover, react.</Text>
          <View style={styles.todayActionRow}>
            <Pressable style={({ pressed }) => [styles.continueButton, pressed && styles.pressablePressed]} onPress={() => (nextEpisode ? onOpenEpisode(nextEpisode) : onOpenSearch())}>
              <Play color={bg} fill={bg} size={18} />
              <Text style={styles.continueText}>{nextEpisode ? 'Continue watching' : 'Find shows'}</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.detailIconButton, pressed && styles.pressablePressed]} onPress={onOpenDiscover}>
              <Compass color={ink} size={21} />
            </Pressable>
          </View>
        </View>
        {!isCompact && (
          <View style={styles.todayStatsGrid}>
            <MiniStat label="Watch time" value={stats.totalTime} />
            <MiniStat label="Active shows" value={String(activeShows)} />
            <MiniStat label="Unread" value={String(unreadCount)} />
          </View>
        )}
        {isCompact && (
          <View style={styles.todayMobileStats}>
            <Text style={styles.todayMobileStat}>{stats.totalTime}</Text>
            <Text style={styles.todayMobileDot}>•</Text>
            <Text style={styles.todayMobileStat}>{activeShows} active</Text>
            <Text style={styles.todayMobileDot}>•</Text>
            <Text style={styles.todayMobileStat}>{unreadCount} unread</Text>
          </View>
        )}
      </View>

      {!isCompact && (
        <View style={styles.betaReadinessPanel}>
          <View style={styles.betaReadinessIcon}>
            <Check color={bg} size={20} />
          </View>
          <View style={styles.betaReadinessCopy}>
            <Text style={styles.betaReadinessTitle}>Beta workspace</Text>
            <Text style={styles.betaReadinessBody}>
              Add a show, then track the loop.
            </Text>
          </View>
        </View>
      )}

      {isSyncing ? (
        <BackendState title="Refreshing today" body="Syncing your latest activity." />
      ) : null}

      <Text style={styles.sectionTitle}>Next up</Text>
      {nextEpisode ? (
        <Pressable style={({ pressed }) => [styles.todayNextCard, isCompact && styles.todayNextCardCompact, pressed && styles.pressablePressed]} onPress={() => onOpenEpisode(nextEpisode)}>
          <CachedImageBackground
            uri={nextEpisode.image}
            style={[styles.todayNextPoster, isCompact && styles.todayNextPosterCompact]}
            imageStyle={styles.todayNextPosterImage}
          />
          <View style={styles.todayNextCopy}>
            <Text style={styles.pill}>{nextEpisode.show}</Text>
            <Text style={styles.libraryShowTitle}>{nextEpisode.code}</Text>
            <Text style={styles.libraryNext}>{nextEpisode.title}</Text>
            <ProgressRail watched={nextEpisode.watchedEpisodes} total={nextEpisode.totalEpisodes} progress={nextEpisode.progress} />
          </View>
          <Pressable style={({ pressed }) => [styles.searchAddButton, pressed && styles.pressablePressed]} onPress={() => onMarkWatched(nextEpisode)}>
            <Check color={bg} size={18} strokeWidth={3} />
          </Pressable>
        </Pressable>
      ) : (
        <Pressable style={({ pressed }) => [styles.todayNextEmptyCard, isCompact && styles.todayNextEmptyCardCompact, pressed && styles.pressablePressed]} onPress={onOpenSearch}>
          <View style={styles.todayNextEmptyIcon}>
            <Tv color={gold} size={24} />
          </View>
          <View style={styles.todayNextEmptyCopy}>
            <Text style={styles.libraryShowTitle}>No episode waiting</Text>
            <Text style={styles.libraryNext}>Add a show to start.</Text>
          </View>
          <View style={styles.todayNextEmptyAction}>
            <Search color={bg} size={17} />
            <Text style={styles.continueText}>Search shows</Text>
          </View>
        </Pressable>
      )}

      <View style={[styles.todaySplitGrid, isCompact && styles.todaySplitGridCompact]}>
        <View style={[styles.todayPanel, isCompact && styles.todayPanelCompact]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Coming up</Text>
            <Pressable style={({ pressed }) => pressed && styles.pressablePressed} onPress={onOpenCalendar}>
              <CalendarDays color={gold} size={19} />
            </Pressable>
          </View>
          {nextUpcoming.length ? (
            nextUpcoming.map((item) => (
              <View key={`${item.show}-${item.code}`} style={styles.todayMiniRow}>
                <Text style={styles.libraryMiniTitle}>{item.show}</Text>
                <Text style={styles.libraryMiniMeta}>{item.code} - {item.group.date}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.libraryMiniEmpty}>No dated releases in your queue yet.</Text>
          )}
        </View>

        <View style={[styles.todayPanel, isCompact && styles.todayPanelCompact]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>For your taste</Text>
            <Compass color={accent} size={19} />
          </View>
          {discovery ? (
            <Pressable style={({ pressed }) => [styles.todayDiscoveryRow, pressed && styles.pressablePressed]} onPress={onOpenDiscover}>
              <CachedImageBackground
                uri={discovery.image}
                style={styles.todayDiscoveryPoster}
                imageStyle={styles.todayNextPosterImage}
              />
              <View style={styles.customListCopy}>
                <Text style={styles.customListTitle}>{discovery.title}</Text>
                <Text style={styles.customListMeta}>{discovery.match}</Text>
              </View>
            </Pressable>
          ) : (
            <Pressable style={({ pressed }) => [styles.adminWideActionButton, pressed && styles.pressablePressed]} onPress={onOpenSearch}>
              <Search color={bg} size={16} />
              <Text style={styles.adminActionText}>Search catalog</Text>
            </Pressable>
          )}
        </View>
      </View>

      {!isCompact && (
        <>
          <Text style={styles.sectionTitle}>Signals</Text>
          <View style={styles.todaySignalRow}>
            <View style={styles.todaySignal}>
              <CalendarDays color={gold} size={20} />
              <Text style={styles.todaySignalText}>{unreadCount ? `${unreadCount} updates need attention` : 'All caught up'}</Text>
            </View>
            <View style={styles.todaySignal}>
              <Tv color={accent} size={20} />
              <Text style={styles.todaySignalText}>{stats.episodes} episodes watched overall</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}
