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

export function CommunityPage({ context, onBack }: { context: CommunityContext; onBack: () => void }) {
  return (
    <View>
      <Pressable style={styles.detailBack} onPress={onBack}>
        <ArrowLeft color={ink} size={20} />
        <Text style={styles.detailBackText}>Back</Text>
      </Pressable>

      <ImageBackground
        source={{ uri: context.image }}
        style={styles.communityHero}
        imageStyle={styles.detailHeroImage}
        resizeMode="cover"
      >
        <View style={styles.detailShade}>
          <Text style={styles.detailMeta}>{context.kind === 'episode' ? 'Episode reactions' : 'Movie reactions'}</Text>
          <Text style={styles.detailTitle}>{context.title}</Text>
          <Text style={styles.detailBody}>{context.subtitle}</Text>
        </View>
      </ImageBackground>

      <View style={styles.communitySummary}>
        <MiniStat label="Mood" value="Loved" />
        <MiniStat label="Rating" value="4.7" />
        <MiniStat label="Replies" value="254" />
      </View>

      {!context.watched && (
        <View style={styles.spoilerLock}>
          <MessageCircle color={gold} size={28} />
          <Text style={styles.spoilerLockTitle}>Spoiler-safe lock</Text>
          <Text style={styles.spoilerLockBody}>
            Reactions stay hidden until this title is marked watched in your library.
          </Text>
        </View>
      )}

      {context.watched && (
        <>
          <Text style={styles.sectionTitle}>Top comments</Text>
          <View style={styles.commentList}>
            {comments.map((comment) => (
              <View key={`${comment.user}-${comment.mood}`} style={styles.commentCard}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>{comment.user.slice(0, 1)}</Text>
                </View>
                <View style={styles.commentCopy}>
                  <View style={styles.commentTop}>
                    <Text style={styles.commentUser}>{comment.user}</Text>
                    <Text style={styles.commentMood}>{comment.mood}</Text>
                  </View>
                  <Text style={styles.commentText}>{comment.text}</Text>
                  <Text style={styles.commentLikes}>{comment.likes} likes</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
