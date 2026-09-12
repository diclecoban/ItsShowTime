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

export function DiscoverQueue({
  item,
  nextItems,
  onAdvance,
}: {
  item: (typeof discoveries)[number];
  nextItems: typeof discoveries;
  onAdvance: () => void;
}) {
  return (
    <View>
      <View style={styles.queueHeader}>
        <View>
          <Text style={styles.queueKicker}>Tonight's pick</Text>
          <Text style={styles.queueTitle}>Swipe Queue</Text>
        </View>
        <View style={styles.matchBadge}>
          <Sparkles color={bg} size={15} />
          <Text style={styles.matchText}>{item.match}</Text>
        </View>
      </View>

      <ImageBackground
        source={{ uri: item.image }}
        style={styles.heroQueue}
        imageStyle={styles.heroQueueImage}
        resizeMode="cover"
      >
        <View style={styles.heroShade}>
          <View style={styles.fitRow}>
            {item.fit.map((fit) => (
              <Text key={fit} style={styles.fitBadge}>{fit}</Text>
            ))}
          </View>
          <Text style={styles.heroTitle}>{item.title}</Text>
          <Text style={styles.heroMeta}>{item.meta}</Text>
          <Text style={styles.heroBody}>{item.body}</Text>
          <Text style={styles.heroReason}>{item.reason}</Text>
        </View>
      </ImageBackground>

      <View style={styles.queueActions}>
        <Pressable style={styles.queueAction} onPress={onAdvance}>
          <X color={ink} size={24} />
          <Text style={styles.queueActionText}>Skip</Text>
        </Pressable>
        <Pressable style={[styles.queueAction, styles.queueActionPrimary]} onPress={onAdvance}>
          <Plus color={bg} size={26} strokeWidth={3} />
          <Text style={styles.queueActionPrimaryText}>Add</Text>
        </Pressable>
        <Pressable style={styles.queueAction} onPress={onAdvance}>
          <RotateCcw color={ink} size={23} />
          <Text style={styles.queueActionText}>Maybe</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Up next</Text>
      <View style={styles.nextRail}>
        {nextItems.map((nextItem) => (
          <View key={nextItem.title} style={styles.nextCard}>
            <ImageBackground
              source={{ uri: nextItem.image }}
              style={styles.nextPoster}
              imageStyle={styles.nextPosterImage}
              resizeMode="cover"
            />
            <Text style={styles.nextTitle}>{nextItem.title}</Text>
            <Text style={styles.nextMeta}>{nextItem.match}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
