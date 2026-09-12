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

export function EpisodeReactionPage({
  episode,
  onBack,
  onSave,
  onOpenCommunity,
}: {
  episode: Episode;
  onBack: () => void;
  onSave: () => void;
  onOpenCommunity: () => void;
}) {
  const feelings = ['Mind blown', 'Tense', 'Funny', 'Heavy', 'Confused', 'Loved it'];
  const characters = ['Mark', 'Helly', 'Irving', 'Dylan'];

  return (
    <View>
      <Pressable style={styles.detailBack} onPress={onBack}>
        <ArrowLeft color={ink} size={20} />
        <Text style={styles.detailBackText}>Back to episode</Text>
      </Pressable>

      <ImageBackground
        source={{ uri: episode.image }}
        style={styles.reactionHero}
        imageStyle={styles.reactionHeroImage}
        resizeMode="cover"
      >
        <View style={styles.reactionShade}>
          <Text style={styles.reactionShow}>{episode.show}</Text>
          <Text style={styles.reactionEpisode}>{episode.code} - {episode.title}</Text>
          <View style={styles.watchedStamp}>
            <Check color={bg} size={16} strokeWidth={3} />
            <Text style={styles.watchedStampText}>Marked watched</Text>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.reactionPanel}>
        <Text style={styles.reactionSectionLabel}>Your rating</Text>
        <View style={styles.reactionStars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} color={gold} fill={star <= 4 ? gold : 'transparent'} size={34} />
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Episode mood</Text>
      <View style={styles.reactionGrid}>
        {feelings.map((feeling, index) => (
          <Pressable key={feeling} style={[styles.reactionChip, index === 0 && styles.reactionChipActive]}>
            <Text style={[styles.reactionChipText, index === 0 && styles.reactionChipActiveText]}>{feeling}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Favorite character</Text>
      <View style={styles.characterRow}>
        {characters.map((character, index) => (
          <Pressable key={character} style={[styles.characterPill, index === 1 && styles.characterPillActive]}>
            <Text style={[styles.characterText, index === 1 && styles.characterTextActive]}>{character}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Spoiler-safe comments</Text>
      <Pressable style={styles.commentsPreview} onPress={onOpenCommunity}>
        <MessageCircle color={accent} size={22} />
        <View style={styles.commentsCopy}>
          <Text style={styles.commentsTitle}>Unlocked after watching</Text>
          <Text style={styles.commentsBody}>Join reactions from people who are exactly at this episode.</Text>
        </View>
      </Pressable>

      <Pressable style={styles.saveReactionButton} onPress={onSave}>
        <Check color={bg} size={20} strokeWidth={3} />
        <Text style={styles.saveReactionText}>Save reaction</Text>
      </Pressable>
    </View>
  );
}
