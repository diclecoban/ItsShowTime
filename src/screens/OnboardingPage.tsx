import { Check } from 'lucide-react';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { SettingRow } from '../components';
import { bg } from '../theme';
import { styles } from '../styles';

export function OnboardingPage({
  selectedGenres,
  selectedServices,
  onToggleGenre,
  onToggleService,
  onFinish,
}: {
  selectedGenres: string[];
  selectedServices: string[];
  onToggleGenre: (genre: string) => void;
  onToggleService: (service: string) => void;
  onFinish: () => Promise<void> | void;
}) {
  const services = ['Netflix', 'Apple TV+', 'Max', 'Hulu'];
  const genres = ['Drama', 'Mystery', 'Comedy', 'Sci-fi', 'Thriller', 'Limited'];
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const finish = () => {
    setIsSaving(true);
    setSaveError('');
    Promise.resolve(onFinish())
      .catch((error: unknown) => {
        setSaveError(error instanceof Error ? error.message : 'Preferences could not be saved.');
      })
      .finally(() => setIsSaving(false));
  };

  return (
    <ScrollView contentContainerStyle={styles.onboarding} showsVerticalScrollIndicator={false}>
      <Text style={styles.onboardingBrand}>It’s Showtime</Text>
      <Text style={styles.onboardingTitle}>Build your watch home</Text>
      <Text style={styles.onboardingBody}>
        Pick a few titles and preferences so your next episodes, calendar, and recommendations feel ready from day one.
      </Text>

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

      {saveError && <Text style={styles.authError}>{saveError}</Text>}
      <Pressable style={[styles.onboardingButton, isSaving && styles.authPrimaryButtonDisabled]} onPress={finish} disabled={isSaving}>
        <Check color={bg} size={20} strokeWidth={3} />
        <Text style={styles.onboardingButtonText}>{isSaving ? 'Saving...' : 'Start tracking'}</Text>
      </Pressable>
    </ScrollView>
  );
}
