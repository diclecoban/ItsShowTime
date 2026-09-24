import { Check, Eye, Library, MessageCircle, Settings, Star, Tv, UserRound, Zap } from 'lucide-react';
import { ImageBackground, Pressable, Text, View } from 'react-native';

import { EmptyState, MiniStat } from '../components';
import { accent, bg, gold, ink, muted } from '../theme';
import { styles } from '../styles';
import type { LibraryShow, ProfileStats, RecentActivity } from '../types';

export function ProfileDashboard({
  displayName,
  username,
  libraryShows,
  recentActivity,
  stats,
  onOpenSettings,
}: {
  displayName: string;
  username: string;
  libraryShows: LibraryShow[];
  recentActivity: RecentActivity[];
  stats: ProfileStats;
  onOpenSettings: () => void;
}) {
  const milestones = [
    { title: 'First episode', value: stats.episodes > 0, icon: Tv, tone: accent },
    { title: 'Building a streak', value: stats.streak !== '0d', icon: Zap, tone: gold },
    { title: 'Library started', value: libraryShows.length > 0, icon: Library, tone: '#f4f5ef' },
  ];
  const earnedMilestones = milestones.filter((milestone) => milestone.value);
  const socialItems = recentActivity.map((activity, index) => ({
    id: activity.id,
    user: 'You',
    action: activity.title,
    detail: activity.subtitle,
    time: activity.time,
    icon: index % 2 === 0 ? MessageCircle : Star,
    tone: index % 2 === 0 ? accent : gold,
  }));

  return (
    <View>
      <View style={styles.identityHeader}>
        <Pressable style={styles.profileSettingsButton} onPress={onOpenSettings}>
          <Settings color={ink} size={20} />
        </Pressable>
        <View style={styles.avatar}>
          <UserRound color={bg} size={32} />
        </View>
        <View style={styles.identityCopy}>
          <Text style={styles.profileName}>{displayName}</Text>
          <View style={styles.personaBadge}>
            <Zap color={bg} size={14} />
            <Text style={styles.personaText}>@{username} - Late-night binger</Text>
          </View>
        </View>
      </View>

      <View style={styles.profileSocialSummary}>
        <View style={styles.profileSocialCard}>
          <Text style={styles.profileSocialValue}>{stats.libraryShows}</Text>
          <Text style={styles.profileSocialLabel}>Public shows</Text>
        </View>
        <View style={styles.profileSocialCard}>
          <Text style={styles.profileSocialValue}>{stats.completedShows}</Text>
          <Text style={styles.profileSocialLabel}>Completed</Text>
        </View>
        <View style={styles.profileSocialCard}>
          <Text style={styles.profileSocialValue}>{earnedMilestones.length}</Text>
          <Text style={styles.profileSocialLabel}>Badges</Text>
        </View>
      </View>

      <View style={styles.profileIdentityPanel}>
        <Text style={styles.profileIdentityTitle}>Watch identity</Text>
        <Text style={styles.profileIdentityBody}>
          Your profile gets more personal as real watch history, reactions, comments, and lists grow together.
        </Text>
      </View>

      <View style={styles.watchPanel}>
        <View style={styles.watchStats}>
          <MiniStat label="Episodes" value={stats.episodes.toLocaleString('en-US')} />
          <MiniStat label="Total time" value={stats.totalTime} />
          <MiniStat label="Streak" value={stats.streak} />
        </View>
        <View style={styles.watchStats}>
          <MiniStat label="Reactions" value={stats.reactions.toLocaleString('en-US')} />
          <MiniStat label="Comments" value={stats.comments.toLocaleString('en-US')} />
          <MiniStat label="Completed" value={stats.completedShows.toLocaleString('en-US')} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent activity</Text>
      {recentActivity.length === 0 ? (
        <View style={styles.activityEmpty}>
          <Text style={styles.activityEmptyText}>No recent activity yet</Text>
        </View>
      ) : (
        <View style={styles.activityList}>
          {recentActivity.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityDot}>
                <Check color={bg} size={14} strokeWidth={3} />
              </View>
              <View style={styles.activityCopy}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
              </View>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Social activity</Text>
      {socialItems.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No social activity yet"
          body="Your watch activity will appear here."
        />
      ) : (
        <>
          <View style={styles.publicProfilePreview}>
            <View style={styles.publicProfileAvatarStack}>
              <View style={styles.publicProfileAvatar}>
                <Text style={styles.publicProfileAvatarText}>{displayName.slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={[styles.publicProfileAvatar, styles.publicProfileAvatarOverlap]}>
                <Eye color={bg} size={15} />
              </View>
            </View>
            <View style={styles.publicProfileCopy}>
              <Text style={styles.publicProfileTitle}>@{username}'s public watch profile</Text>
              <Text style={styles.publicProfileBody}>
                {stats.episodes} watched episodes, {stats.reactions} reactions, and {stats.comments} comments are ready to become your social identity.
              </Text>
            </View>
          </View>
          <View style={styles.socialFeed}>
            {socialItems.map(({ id, user, action, detail, time, icon: Icon, tone }) => (
              <View key={id} style={styles.socialFeedItem}>
                <View style={[styles.socialFeedIcon, { backgroundColor: tone }]}>
                  <Icon color={bg} size={17} />
                </View>
                <View style={styles.socialFeedCopy}>
                  <Text style={styles.socialFeedTitle}>
                    <Text style={styles.socialFeedUser}>{user}</Text> {action}
                  </Text>
                  <Text style={styles.socialFeedBody}>{detail}</Text>
                </View>
                <Text style={styles.socialFeedTime}>{time}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Achievement shelf</Text>
      {earnedMilestones.length === 0 ? (
        <View style={styles.achievementEmpty}>
          <Text style={styles.achievementEmptyText}>No achievements earned yet</Text>
        </View>
      ) : (
        <View style={styles.achievementShelf}>
          {earnedMilestones.map(({ title, icon: Icon, tone }) => (
            <View key={title} style={styles.achievement}>
              <View style={[styles.achievementIcon, { backgroundColor: tone }]}>
                <Icon color={bg} size={20} />
              </View>
              <Text style={styles.achievementText}>{title}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Favorite spine</Text>
      {libraryShows.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No favorite shows yet"
          body="Library favorites will appear here."
          action="Find shows"
        />
      ) : (
        <View style={styles.posterSpine}>
          {libraryShows.slice(0, 4).map((show) => (
            <ImageBackground
              key={show.title}
              source={{ uri: show.image }}
              style={styles.spinePoster}
              imageStyle={styles.spinePosterImage}
              resizeMode="cover"
            >
              <View style={styles.spineShade}>
                <Text style={styles.spineTitle}>{show.title}</Text>
              </View>
            </ImageBackground>
          ))}
        </View>
      )}
    </View>
  );
}
