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
  RecentActivity,
  SearchResult,
  ShowSeason,
  UpcomingGroup,
} from '../types';

export function ProfileDashboard({
  displayName,
  username,
  libraryShows,
  recentActivity,
  stats,
  onOpenSettings,
}: {
  displayName: string;
  username: string;
  libraryShows: LibraryShow[];
  recentActivity: RecentActivity[];
  stats: { episodes: number; totalTime: string; streak: string };
  onOpenSettings: () => void;
}) {
  const milestones = [
    { title: 'First episode', value: stats.episodes > 0, icon: Tv, tone: accent },
    { title: 'Building a streak', value: stats.streak !== '0d', icon: Zap, tone: gold },
    { title: 'Library started', value: libraryShows.length > 0, icon: Library, tone: '#f4f5ef' },
  ];
  const earnedMilestones = milestones.filter((milestone) => milestone.value);

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
          <Text style={styles.profileName}>{displayName}</Text>
          <View style={styles.personaBadge}>
            <Zap color={bg} size={14} />
            <Text style={styles.personaText}>@{username} - Late-night binger</Text>
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

      <Text style={styles.sectionTitle}>Recent activity</Text>
      {recentActivity.length === 0 ? (
        <View style={styles.activityEmpty}>
          <Text style={styles.activityEmptyText}>No recent activity yet</Text>
        </View>
      ) : (
        <View style={styles.activityList}>
          {recentActivity.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityDot}>
                <Check color={bg} size={14} strokeWidth={3} />
              </View>
              <View style={styles.activityCopy}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
              </View>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Achievement shelf</Text>
      {earnedMilestones.length === 0 ? (
        <View style={styles.achievementEmpty}>
          <Text style={styles.achievementEmptyText}>No achievements earned yet</Text>
        </View>
      ) : (
        <View style={styles.achievementShelf}>
          {earnedMilestones.map(({ title, icon: Icon, tone }) => (
            <View key={title} style={styles.achievement}>
              <View style={[styles.achievementIcon, { backgroundColor: tone }]}>
                <Icon color={bg} size={20} />
              </View>
              <Text style={styles.achievementText}>{title}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Favorite spine</Text>
      {libraryShows.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No favorite shows yet"
          body="Shows you add to your Library will appear here instead of demo posters."
          action="Find shows"
        />
      ) : (
        <View style={styles.posterSpine}>
          {libraryShows.slice(0, 4).map((show) => (
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
      )}
    </View>
  );
}
