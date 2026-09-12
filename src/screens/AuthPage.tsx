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

export function AuthPage({ onContinue }: { onContinue: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('dicle@example.com');
  const [password, setPassword] = useState('watchlight');
  const [showValidation, setShowValidation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [helperMessage, setHelperMessage] = useState('');
  const canContinue = email.includes('@') && password.length >= 6;
  const submit = () => {
    setShowValidation(true);

    if (!canContinue) {
      setHelperMessage('Use a valid email and at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setHelperMessage('');
    window.setTimeout(() => {
      setIsLoading(false);
      onContinue();
    }, 450);
  };

  return (
    <ScrollView contentContainerStyle={styles.authPage} showsVerticalScrollIndicator={false}>
      <Text style={styles.authBrand}>Watchlight</Text>
      <Text style={styles.authTitle}>{mode === 'signin' ? 'Welcome back' : 'Create your watch home'}</Text>
      <Text style={styles.authBody}>
        {mode === 'signin'
          ? 'Pick up your next episode, reactions, lists, and calendar exactly where you left them.'
          : 'Start tracking shows and movies with spoiler-safe reactions from the beginning.'}
      </Text>

      <View style={styles.authCard}>
        <Pressable style={styles.authProviderButton} onPress={onContinue}>
          <Text style={styles.authProviderMark}>G</Text>
          <Text style={styles.authProviderText}>Continue with Google</Text>
        </Pressable>
        <Pressable style={styles.authProviderButton} onPress={onContinue}>
          <Text style={styles.authProviderMark}>A</Text>
          <Text style={styles.authProviderText}>Continue with Apple</Text>
        </Pressable>

        <View style={styles.authDivider}>
          <View style={styles.authDividerLine} />
          <Text style={styles.authDividerText}>or</Text>
          <View style={styles.authDividerLine} />
        </View>

        <View style={styles.fakeInput}>
          <Text style={styles.fakeInputLabel}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.authInput}
          />
        </View>
        {showValidation && !email.includes('@') && <Text style={styles.authError}>Enter a valid email address.</Text>}
        <View style={styles.fakeInput}>
          <Text style={styles.fakeInputLabel}>Password</Text>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry style={styles.authInput} />
        </View>
        {showValidation && password.length < 6 && <Text style={styles.authError}>Password must be at least 6 characters.</Text>}

        <Pressable
          style={[styles.authPrimaryButton, !canContinue && styles.authPrimaryButtonDisabled]}
          onPress={submit}
        >
          <Text style={styles.authPrimaryText}>
            {isLoading ? 'Signing in...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </Text>
        </Pressable>
        <Pressable style={styles.forgotPassword} onPress={() => setHelperMessage('Password reset link sent to your email.')}>
          <Text style={styles.forgotPasswordText}>Forgot password?</Text>
        </Pressable>
        {helperMessage && <Text style={styles.authHelper}>{helperMessage}</Text>}
      </View>

      <Pressable style={styles.authSwitch} onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        <Text style={styles.authSwitchText}>
          {mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
