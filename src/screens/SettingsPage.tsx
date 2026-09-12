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

export function SettingsPage({
  onBack,
  activeTheme,
  selectedGenres,
  selectedServices,
  onChangeTheme,
  onToggleGenre,
  onToggleService,
}: {
  onBack: () => void;
  activeTheme: keyof typeof themes;
  selectedGenres: string[];
  selectedServices: string[];
  onChangeTheme: (theme: keyof typeof themes) => void;
  onToggleGenre: (genre: string) => void;
  onToggleService: (service: string) => void;
}) {
  const genres = ['Drama', 'Mystery', 'Comedy', 'Sci-fi', 'Thriller', 'Limited'];

  return (
    <View>
      <Pressable style={styles.detailBack} onPress={onBack}>
        <ArrowLeft color={ink} size={20} />
        <Text style={styles.detailBackText}>Back to profile</Text>
      </Pressable>

      <View style={styles.settingsHero}>
        <View style={styles.avatar}>
          <UserRound color={bg} size={32} />
        </View>
        <View style={styles.settingsHeroCopy}>
          <Text style={styles.settingsName}>Dicle</Text>
          <Text style={styles.settingsEmail}>dicle@example.com</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Preferences</Text>
      <View style={styles.settingsGroup}>
        <SettingRow title="Spoiler protection" value="Strict" active />
        <SettingRow title="Region" value="United States" />
        <SettingRow title="Language" value="English" />
      </View>

      <Text style={styles.sectionTitle}>Theme palettes</Text>
      <View style={styles.themeGrid}>
        {(Object.keys(themes) as Array<keyof typeof themes>).map((themeName) => (
          <Pressable
            key={themeName}
            style={[styles.themeCard, activeTheme === themeName && styles.themeCardActive]}
            onPress={() => onChangeTheme(themeName)}
          >
            <View style={styles.themeSwatches}>
              <View style={[styles.themeSwatch, { backgroundColor: themes[themeName]['--accent'] }]} />
              <View style={[styles.themeSwatch, { backgroundColor: themes[themeName]['--gold'] }]} />
              <View style={[styles.themeSwatch, { backgroundColor: themes[themeName]['--ink'] }]} />
            </View>
            <Text style={[styles.themeName, activeTheme === themeName && styles.themeNameActive]}>{themeName}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Favorite genres</Text>
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

      <Text style={styles.sectionTitle}>Streaming services</Text>
      <View style={styles.serviceGrid}>
        {['Netflix', 'Apple TV+', 'Max', 'Hulu'].map((service) => (
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

      <Text style={styles.sectionTitle}>Data</Text>
      <View style={styles.settingsGroup}>
        <SettingRow title="Import watch history" value="CSV, JSON, Trakt" />
        <SettingRow title="Export backup" value="Ready" active />
      </View>
    </View>
  );
}
