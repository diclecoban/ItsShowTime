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

export function OnboardingPage({
  selectedGenres,
  selectedServices,
  selectedStarterShows,
  onToggleGenre,
  onToggleService,
  onToggleStarterShow,
  onFinish,
}: {
  selectedGenres: string[];
  selectedServices: string[];
  selectedStarterShows: string[];
  onToggleGenre: (genre: string) => void;
  onToggleService: (service: string) => void;
  onToggleStarterShow: (title: string) => void;
  onFinish: () => void;
}) {
  const starterShows = ['Severance', 'The Bear', 'Dark', 'Slow Horses', 'Station Eleven', 'Past Lives'];
  const services = ['Netflix', 'Apple TV+', 'Max', 'Hulu'];
  const genres = ['Drama', 'Mystery', 'Comedy', 'Sci-fi', 'Thriller', 'Limited'];

  return (
    <ScrollView contentContainerStyle={styles.onboarding} showsVerticalScrollIndicator={false}>
      <Text style={styles.onboardingBrand}>Watchlight</Text>
      <Text style={styles.onboardingTitle}>Build your watch home</Text>
      <Text style={styles.onboardingBody}>
        Pick a few titles and preferences so your next episodes, calendar, and recommendations feel ready from day one.
      </Text>

      <Text style={styles.onboardingSection}>Start with titles</Text>
      <View style={styles.onboardingChips}>
        {starterShows.map((show) => (
          <Pressable
            key={show}
            style={[styles.onboardingChip, selectedStarterShows.includes(show) && styles.onboardingChipActive]}
            onPress={() => onToggleStarterShow(show)}
          >
            <Text style={[styles.onboardingChipText, selectedStarterShows.includes(show) && styles.onboardingChipTextActive]}>
              {show}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.onboardingSection}>Favorite genres</Text>
      <View style={styles.onboardingChips}>
        {genres.map((genre) => (
          <Pressable
            key={genre}
            style={[styles.onboardingChip, selectedGenres.includes(genre) && styles.onboardingChipActive]}
            onPress={() => onToggleGenre(genre)}
          >
            <Text style={[styles.onboardingChipText, selectedGenres.includes(genre) && styles.onboardingChipTextActive]}>
              {genre}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.onboardingSection}>Streaming services</Text>
      <View style={styles.serviceGrid}>
        {services.map((service) => (
          <Pressable
            key={service}
            style={[styles.serviceTile, selectedServices.includes(service) && styles.serviceTileActive]}
            onPress={() => onToggleService(service)}
          >
            <Text style={[styles.serviceText, selectedServices.includes(service) && styles.serviceTextActive]}>
              {service}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.onboardingSection}>Spoiler mode</Text>
      <View style={styles.onboardingChoice}>
        <View>
          <Text style={styles.settingTitle}>Strict protection</Text>
          <Text style={styles.settingValue}>Hide comments until each episode is marked watched.</Text>
        </View>
        <View style={[styles.settingToggle, styles.settingToggleActive]}>
          <View style={[styles.settingToggleKnob, styles.settingToggleKnobActive]} />
        </View>
      </View>

      <Pressable style={styles.onboardingButton} onPress={onFinish}>
        <Check color={bg} size={20} strokeWidth={3} />
        <Text style={styles.onboardingButtonText}>Start tracking</Text>
      </Pressable>
    </ScrollView>
  );
}
