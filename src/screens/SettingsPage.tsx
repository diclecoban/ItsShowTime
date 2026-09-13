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
import { ImageBackground, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

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
  onSignOut,
  onDeleteAccount,
  displayName,
  email,
  activeTheme,
  selectedGenres,
  selectedServices,
  onChangeTheme,
  onToggleGenre,
  onToggleService,
}: {
  onBack: () => void;
  onSignOut: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  displayName: string;
  email: string;
  activeTheme: keyof typeof themes;
  selectedGenres: string[];
  selectedServices: string[];
  onChangeTheme: (theme: keyof typeof themes) => void;
  onToggleGenre: (genre: string) => void;
  onToggleService: (service: string) => void;
}) {
  const genres = ['Drama', 'Mystery', 'Comedy', 'Sci-fi', 'Thriller', 'Limited'];
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleSignOut = () => {
    setIsSigningOut(true);
    onSignOut().finally(() => setIsSigningOut(false));
  };

  const handleDeleteAccount = () => {
    setIsDeleting(true);
    setDeleteError('');
    onDeleteAccount()
      .catch((error: unknown) => {
        if (error instanceof Error) {
          setDeleteError(error.message);
          return;
        }

        if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string') {
          setDeleteError(error.message);
          return;
        }

        setDeleteError('Account deletion could not be requested.');
      })
      .finally(() => setIsDeleting(false));
  };

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
          <Text style={styles.settingsName}>{displayName}</Text>
          <Text style={styles.settingsEmail}>{email}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Preferences</Text>
      <View style={styles.settingsGroup}>
        <SettingRow title="Spoiler protection" value="Strict" active />
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

      <Pressable style={styles.signOutButton} onPress={handleSignOut} disabled={isSigningOut}>
        <Text style={styles.signOutText}>{isSigningOut ? 'Signing out...' : 'Sign out'}</Text>
      </Pressable>

      <Pressable style={styles.deleteAccountButton} onPress={() => setIsDeleteModalOpen(true)}>
        <Text style={styles.deleteAccountText}>Delete account</Text>
      </Pressable>

      <Modal visible={isDeleteModalOpen} transparent animationType="fade" onRequestClose={() => setIsDeleteModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Delete account?</Text>
            <Text style={styles.confirmBody}>
              This will request permanent deletion and sign you out. Your watch history, lists, comments, and preferences
              will be removed after the request is processed.
            </Text>
            {deleteError && <Text style={styles.authError}>{deleteError}</Text>}
            <View style={styles.confirmActions}>
              <Pressable
                style={styles.confirmCancelButton}
                onPress={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.confirmDeleteButton} onPress={handleDeleteAccount} disabled={isDeleting}>
                <Text style={styles.confirmDeleteText}>{isDeleting ? 'Deleting...' : 'Delete'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
