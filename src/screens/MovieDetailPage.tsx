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

export function MovieDetailPage({
  movie,
  lists,
  reaction,
  onBack,
  onSaveReaction,
  onAddToList,
  onOpenCommunity,
}: {
  movie: Movie;
  lists: CustomList[];
  reaction?: string;
  onBack: () => void;
  onSaveReaction: (reaction: string) => void;
  onAddToList: (listTitle: string) => void;
  onOpenCommunity: () => void;
}) {
  const [selectedReaction, setSelectedReaction] = useState(reaction ?? 'Loved it');
  const [selectedListTitle, setSelectedListTitle] = useState(lists[0]?.title ?? '');
  const [isSavedToList, setIsSavedToList] = useState(false);
  const movieMoods = ['Loved it', 'Emotional', 'Smart', 'Rewatchable', 'Slow burn'];

  return (
    <View>
      <Pressable style={styles.detailBack} onPress={onBack}>
        <ArrowLeft color={ink} size={20} />
        <Text style={styles.detailBackText}>Back to movies</Text>
      </Pressable>

      <ImageBackground
        source={{ uri: movie.image }}
        style={styles.movieDetailHero}
        imageStyle={styles.detailHeroImage}
        resizeMode="cover"
      >
        <View style={styles.detailShade}>
          <Text style={styles.detailMeta}>{movie.year} - {movie.genre} - {movie.platform}</Text>
          <Text style={styles.detailTitle}>{movie.title}</Text>
          <Text style={styles.detailBody}>{movie.body}</Text>
        </View>
      </ImageBackground>

      <View style={styles.movieDetailStats}>
        <MiniStat label="Runtime" value={movie.runtime} />
        <MiniStat label="Status" value={movie.status} />
        <MiniStat label="Rating" value={movie.averageRating.toFixed(1)} />
      </View>

      <View style={styles.detailActionRow}>
        <Pressable style={styles.continueButton} onPress={() => onSaveReaction(selectedReaction)}>
          <Check color={bg} size={20} strokeWidth={3} />
          <Text style={styles.continueText}>{reaction ? 'Reaction saved' : movie.status === 'Watched' ? 'Add reaction' : 'Mark watched'}</Text>
        </Pressable>
        <Pressable style={styles.detailIconButton}>
          <Plus color={ink} size={22} />
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Movie reaction</Text>
      <View style={styles.reactionGrid}>
        {movieMoods.map((mood) => (
          <Pressable
            key={mood}
            style={[styles.reactionChip, selectedReaction === mood && styles.reactionChipActive]}
            onPress={() => setSelectedReaction(mood)}
          >
            <Text style={[styles.reactionChipText, selectedReaction === mood && styles.reactionChipActiveText]}>
              {mood}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Your movie card</Text>
      <View style={styles.movieCardPreview}>
        <View style={styles.movieCardScore}>
          <Star color={gold} fill={gold} size={24} />
          <Text style={styles.movieScoreValue}>{movie.averageRating.toFixed(1)}</Text>
        </View>
        <View style={styles.commentsCopy}>
          <Text style={styles.commentsTitle}>Private note ready</Text>
          <Text style={styles.commentsBody}>Save a reaction, add it to a custom list, or keep it in your watched diary.</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Add to list</Text>
      <View style={styles.movieListPicker}>
        {lists.map((list) => (
          <Pressable
            key={list.title}
            style={[styles.movieListOption, selectedListTitle === list.title && styles.movieListOptionActive]}
            onPress={() => setSelectedListTitle(list.title)}
          >
            <Text style={[styles.movieListOptionText, selectedListTitle === list.title && styles.movieListOptionTextActive]}>
              {list.title}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        style={[styles.saveReactionButton, isSavedToList && styles.searchAddedButton]}
        onPress={() => {
          if (selectedListTitle) {
            onAddToList(selectedListTitle);
            setIsSavedToList(true);
          }
        }}
      >
        <Plus color={bg} size={20} strokeWidth={3} />
        <Text style={styles.saveReactionText}>{isSavedToList ? 'Added to list' : 'Save to selected list'}</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Community pulse</Text>
      <Pressable style={styles.communityCard} onPress={onOpenCommunity}>
        <View style={styles.communityMetric}>
          <Sparkles color={gold} size={18} />
          <Text style={styles.communityValue}>Loved</Text>
          <Text style={styles.communityLabel}>top mood</Text>
        </View>
        <View style={styles.communityMetric}>
          <MessageCircle color={accent} size={18} />
          <Text style={styles.communityValue}>Safe</Text>
          <Text style={styles.communityLabel}>spoiler mode</Text>
        </View>
      </Pressable>
    </View>
  );
}
