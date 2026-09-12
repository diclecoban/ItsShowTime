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

export function ShowDetail({
  episode,
  seasons,
  onBack,
  onOpenCommunity,
  onWatch,
}: {
  episode: Episode;
  seasons: ShowSeason[];
  onBack: () => void;
  onOpenCommunity: () => void;
  onWatch: (episode?: DetailEpisode) => void;
}) {
  const fallbackSeasons = [
    {
      season: 'Season 1',
      episodes: [{ code: 'E01', title: episode.title, watched: episode.watched, averageRating: episode.averageRating }],
    },
  ];
  const seasonList = seasons.length > 0 ? seasons : fallbackSeasons;
  const [activeSeason, setActiveSeason] = useState(seasonList[0].season);
  const detailEpisodes = seasonList.find((season) => season.season === activeSeason)?.episodes ?? seasonList[0].episodes;

  return (
    <View>
      <Pressable style={styles.detailBack} onPress={onBack}>
        <ArrowLeft color={ink} size={20} />
        <Text style={styles.detailBackText}>Back to shows</Text>
      </Pressable>

      <ImageBackground
        source={{ uri: episode.image }}
        style={styles.detailHero}
        imageStyle={styles.detailHeroImage}
        resizeMode="cover"
      >
        <View style={styles.detailShade}>
          <Text style={styles.detailMeta}>Drama - Mystery - Apple TV+</Text>
          <Text style={styles.detailTitle}>{episode.show}</Text>
          <Text style={styles.detailBody}>
            Keep your season in order, jump into the next episode, and unlock spoiler-safe reactions after watching.
          </Text>
        </View>
      </ImageBackground>

      <View style={styles.detailActionRow}>
        <Pressable style={styles.continueButton} onPress={() => onWatch()}>
          <Play color={bg} fill={bg} size={18} />
          <Text style={styles.continueText}>Watch {episode.code}</Text>
        </Pressable>
        <Pressable style={styles.detailIconButton}>
          <Plus color={ink} size={22} />
        </Pressable>
      </View>

      <View style={styles.detailProgressCard}>
        <View>
          <Text style={styles.detailSmallLabel}>Season progress</Text>
          <Text style={styles.detailProgressValue}>{episode.watchedEpisodes}/{episode.totalEpisodes} watched</Text>
        </View>
        <ProgressRail watched={episode.watchedEpisodes} total={episode.totalEpisodes} progress={episode.progress} />
      </View>

      <Text style={styles.sectionTitle}>Episodes</Text>
      <View style={styles.seasonTabs}>
        {seasonList.map((season) => (
          <Pressable key={season.season} onPress={() => setActiveSeason(season.season)}>
            <Text style={[styles.seasonTab, activeSeason === season.season && styles.seasonTabActive]}>{season.season}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.seasonSummary}>
        <Text style={styles.seasonSummaryText}>
          {detailEpisodes.filter((item) => item.watched).length}/{detailEpisodes.length} watched
        </Text>
        <Text style={styles.seasonSummaryText}>Avg {episode.averageRating.toFixed(1)}</Text>
      </View>
      <View style={styles.timeline}>
        {detailEpisodes.map((item) => (
          <Pressable key={item.code} style={styles.timelineItem} onPress={() => onWatch(item)}>
            <View style={[styles.timelineDot, item.watched && styles.timelineDotDone]}>
              {item.watched && <Check color={bg} size={14} strokeWidth={3} />}
            </View>
            <View style={styles.timelineCopy}>
              <Text style={styles.timelineCode}>{item.code}</Text>
              <Text style={styles.timelineTitle}>{item.title}</Text>
            </View>
            {item.watched && (
              <View style={styles.timelineRatingBadge}>
                <Star color={gold} fill={gold} size={12} />
                <Text style={styles.ratingText}>{item.averageRating.toFixed(1)}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Community pulse</Text>
      <Pressable style={styles.communityCard} onPress={onOpenCommunity}>
        <View style={styles.communityMetric}>
          <Star color={gold} fill={gold} size={18} />
          <Text style={styles.communityValue}>4.7</Text>
          <Text style={styles.communityLabel}>avg rating</Text>
        </View>
        <View style={styles.communityMetric}>
          <MessageCircle color={accent} size={18} />
          <Text style={styles.communityValue}>Locked</Text>
          <Text style={styles.communityLabel}>until watched</Text>
        </View>
      </Pressable>
    </View>
  );
}
