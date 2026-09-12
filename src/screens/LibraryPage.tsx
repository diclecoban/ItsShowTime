import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  Library,
  ListPlus,
  MessageCircle,
  Plus,
  Play,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Star,
  Tv,
  X,
  Zap,
  UserRound,
} from 'lucide-react';
import { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { EmptyState, FilterChips, MiniStat, ProgressRail, SettingRow } from '../components';
import { achievements, comments, discoveries, favoriteShows, movies } from '../data';
import { accent, bg, gold, ink, muted, themes } from '../theme';
import { styles } from '../styles';
import type {
  CommunityContext,
  CustomList,
  DetailEpisode,
  Episode,
  LibraryShow,
  Movie,
  NotificationItem,
  SearchResult,
  ShowSeason,
  UpcomingGroup,
} from '../types';

export function LibraryPage({ shows, onOpenLists }: { shows: LibraryShow[]; onOpenLists: () => void }) {
  const filters = ['All', 'Watching', 'Paused', 'Finished', 'Dropped'];
  const [activeFilter, setActiveFilter] = useState('All');
  const filteredShows =
    activeFilter === 'All' ? shows : shows.filter((show) => show.status === activeFilter);

  return (
    <View>
      <View style={styles.libraryHero}>
        <Text style={styles.libraryKicker}>My library</Text>
        <Text style={styles.libraryTitle}>{shows.length} tracked shows</Text>
        <Text style={styles.libraryBody}>Everything you are watching, pausing, finishing, or saving for later.</Text>
        <Pressable style={styles.openListsButton} onPress={onOpenLists}>
          <ListPlus color={bg} size={18} />
          <Text style={styles.openListsText}>Open lists</Text>
        </Pressable>
      </View>

      <View style={styles.libraryFilters}>
        {filters.map((filter) => (
          <Pressable key={filter} onPress={() => setActiveFilter(filter)}>
            <Text style={[styles.libraryFilter, activeFilter === filter && styles.libraryFilterActive]}>{filter}</Text>
          </Pressable>
        ))}
      </View>

      {filteredShows.length === 0 ? (
        <EmptyState
          icon={Library}
          title={`No ${activeFilter.toLowerCase()} shows yet`}
          body="Add a show from search or discover to start filling this shelf."
          action="Browse discover"
        />
      ) : (
        <View style={styles.libraryList}>
          {filteredShows.map((show) => (
            <View key={show.title} style={styles.libraryCard}>
              <ImageBackground
                source={{ uri: show.image }}
                style={styles.libraryPoster}
                imageStyle={styles.libraryPosterImage}
                resizeMode="cover"
              />
              <View style={styles.libraryCopy}>
                <View style={styles.libraryTopLine}>
                  <Text style={styles.libraryShowTitle}>{show.title}</Text>
                  <Text style={[styles.libraryStatus, show.status === 'Finished' && styles.libraryStatusDone]}>
                    {show.status}
                  </Text>
                </View>
                <Text style={styles.libraryNext}>{show.next}</Text>
                <ProgressRail watched={show.watchedEpisodes} total={show.totalEpisodes} progress={show.progress} />
                <Text style={styles.libraryMeta}>{show.meta}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
