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

export function MoviesPage({ movies, onSelectMovie }: { movies: Movie[]; onSelectMovie: (movie: Movie) => void }) {
  return (
    <View>
      <View style={styles.segment}>
        <Text style={styles.segmentActive}>Watchlist</Text>
        <Text style={styles.segmentMuted}>Watched</Text>
      </View>
      {movies.map((movie) => (
        <Pressable key={movie.id} style={styles.movieCard} onPress={() => onSelectMovie(movie)}>
          <ImageBackground
            source={{ uri: movie.image }}
            style={styles.moviePoster}
            imageStyle={styles.moviePosterImage}
            resizeMode="cover"
          />
          <View style={styles.movieCardCopy}>
            <Text style={styles.movieTitle}>{movie.title}</Text>
            <Text style={styles.movieMeta}>{movie.year} - {movie.runtime} - {movie.genre}</Text>
            <Text style={styles.movieBody}>{movie.body}</Text>
            <View style={styles.movieFooter}>
              <Text style={styles.platformPill}>{movie.platform}</Text>
              <View style={styles.timelineRatingBadge}>
                <Star color={gold} fill={gold} size={12} />
                <Text style={styles.ratingText}>{movie.averageRating.toFixed(1)}</Text>
              </View>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
