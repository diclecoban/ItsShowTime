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

export function ProfileDashboard({
  selectedGenres,
  selectedServices,
  stats,
  onOpenSettings,
}: {
  selectedGenres: string[];
  selectedServices: string[];
  stats: { episodes: number; totalTime: string; streak: string };
  onOpenSettings: () => void;
}) {
  return (
    <View>
      <View style={styles.identityHeader}>
        <Pressable style={styles.profileSettingsButton} onPress={onOpenSettings}>
          <Settings color={ink} size={20} />
        </Pressable>
        <View style={styles.avatar}>
          <UserRound color={bg} size={32} />
        </View>
        <View style={styles.identityCopy}>
          <Text style={styles.profileName}>Dicle</Text>
          <View style={styles.personaBadge}>
            <Zap color={bg} size={14} />
            <Text style={styles.personaText}>Late-night binger</Text>
          </View>
        </View>
      </View>

      <View style={styles.watchPanel}>
        <View style={styles.watchStats}>
          <MiniStat label="Episodes" value={stats.episodes.toLocaleString('en-US')} />
          <MiniStat label="Total time" value={stats.totalTime} />
          <MiniStat label="Streak" value={stats.streak} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Watch preferences</Text>
      <View style={styles.preferenceSummary}>
        <Text style={styles.preferenceSummaryText}>{selectedGenres.slice(0, 3).join(' / ') || 'No genres selected'}</Text>
        <Text style={styles.preferenceSummaryText}>{selectedServices.join(' / ') || 'No platforms selected'}</Text>
      </View>

      <Text style={styles.sectionTitle}>Achievement shelf</Text>
      <View style={styles.achievementShelf}>
        {achievements.map(({ title, icon: Icon, tone }) => (
          <View key={title} style={styles.achievement}>
            <View style={[styles.achievementIcon, { backgroundColor: tone }]}>
              <Icon color={bg} size={20} />
            </View>
            <Text style={styles.achievementText}>{title}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Favorite spine</Text>
      <View style={styles.posterSpine}>
        {favoriteShows.map((show) => (
          <ImageBackground
            key={show.title}
            source={{ uri: show.image }}
            style={styles.spinePoster}
            imageStyle={styles.spinePosterImage}
            resizeMode="cover"
          >
            <View style={styles.spineShade}>
              <Text style={styles.spineTitle}>{show.title}</Text>
            </View>
          </ImageBackground>
        ))}
      </View>
    </View>
  );
}
