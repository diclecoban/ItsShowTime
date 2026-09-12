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

export function UpcomingPage({
  groups,
  onToggleReminder,
}: {
  groups: UpcomingGroup[];
  onToggleReminder: (show: string, code: string) => void;
}) {
  const [activeDay, setActiveDay] = useState(groups[0]?.day ?? 'Today');
  const visibleGroups = groups.filter((group) => group.day === activeDay);
  const reminderCount = groups.reduce(
    (count, group) => count + group.items.filter((item) => item.tracked).length,
    0
  );

  return (
    <View>
      <View style={styles.calendarHero}>
        <View>
          <Text style={styles.calendarKicker}>Your schedule</Text>
          <Text style={styles.calendarTitle}>{groups.reduce((count, group) => count + group.items.length, 0)} episodes this week</Text>
        </View>
        <View style={styles.calendarBadge}>
          <Bell color={bg} size={16} />
          <Text style={styles.calendarBadgeText}>{reminderCount} alerts</Text>
        </View>
      </View>

      <View style={styles.calendarDays}>
        {groups.map((group) => (
          <Pressable
            key={group.day}
            style={[styles.calendarDayPill, activeDay === group.day && styles.calendarDayPillActive]}
            onPress={() => setActiveDay(group.day)}
          >
            <Text style={[styles.calendarDayText, activeDay === group.day && styles.calendarDayTextActive]}>{group.day}</Text>
            <Text style={[styles.calendarDateText, activeDay === group.day && styles.calendarDayTextActive]}>
              {group.date.replace('Sep ', '')}
            </Text>
          </Pressable>
        ))}
      </View>

      {visibleGroups.map((group) => (
        <View key={`${group.day}-${group.date}`} style={styles.upcomingGroup}>
          <View style={styles.upcomingGroupHeader}>
            <Text style={styles.upcomingDay}>{group.day}</Text>
            <Text style={styles.upcomingDate}>{group.date}</Text>
          </View>
          {group.items.map((item) => (
            <View key={`${item.show}-${item.code}`} style={styles.upcomingCard}>
              <ImageBackground
                source={{ uri: item.image }}
                style={styles.upcomingPoster}
                imageStyle={styles.upcomingPosterImage}
                resizeMode="cover"
              />
              <View style={styles.upcomingCopy}>
                <Text style={styles.upcomingShow}>{item.show}</Text>
                <Text style={styles.upcomingEpisode}>{item.code} - {item.title}</Text>
                <View style={styles.upcomingMetaRow}>
                  <Text style={styles.platformPill}>{item.platform}</Text>
                  <Text style={styles.upcomingTime}>{item.time}</Text>
                </View>
              </View>
              <Pressable
                style={[styles.reminderButton, item.tracked && styles.reminderButtonActive]}
                onPress={() => onToggleReminder(item.show, item.code)}
              >
                {item.tracked ? <Check color={bg} size={18} strokeWidth={3} /> : <Bell color={ink} size={18} />}
              </Pressable>
            </View>
          ))}
        </View>
      ))}
      <EmptyState
        icon={CalendarDays}
        title="No more episodes this week"
        body="When tracked shows announce new dates, they will land here automatically."
        action="Find shows"
      />
    </View>
  );
}
