import { Bell, Check, Search, Tv } from 'lucide-react';
import type { ReactNode } from 'react';
import { ImageBackground, Pressable, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { accent, bg, ink } from './theme';
import { styles } from './styles';
import type { Episode } from './types';

export function ScreenHeader({
  title,
  onOpenNotifications,
  onOpenSearch,
}: {
  title: string;
  onOpenNotifications: () => void;
  onOpenSearch: () => void;
}) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.eyebrow}>Watchlight</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.headerActions}>
        <Pressable style={styles.iconButton} onPress={onOpenSearch}>
          <Search color={ink} size={20} />
        </Pressable>
        <Pressable style={styles.iconButton} onPress={onOpenNotifications}>
          <Bell color={ink} size={20} />
        </Pressable>
      </View>
    </View>
  );
}

export function FilterChips({
  options,
  active,
  onChange,
}: {
  options: string[];
  active: string;
  onChange: (option: string) => void;
}) {
  return (
    <View style={styles.searchFilters}>
      {options.map((option) => (
        <Pressable key={option} onPress={() => onChange(option)}>
          <Text style={[styles.searchFilter, active === option && styles.searchFilterActive]}>
            {option}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function MediaCard({
  image,
  children,
  onPress,
  style,
}: {
  image: string;
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const content = (
    <>
      <ImageBackground source={{ uri: image }} style={styles.poster} resizeMode="cover" />
      {children}
    </>
  );

  if (onPress) {
    return (
      <Pressable style={style} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={style}>{content}</View>;
}

export function EpisodeCard({ episode, onPress }: { episode: Episode; onPress: () => void }) {
  return (
    <MediaCard image={episode.image} style={styles.episodeCard} onPress={onPress}>
      <View style={styles.episodeBody}>
        <Text style={styles.pill}>{episode.show}</Text>
        <Text style={styles.code}>{episode.code}</Text>
        <Text style={styles.episodeTitle}>{episode.title}</Text>
        <ProgressRail watched={episode.watchedEpisodes} total={episode.totalEpisodes} progress={episode.progress} />
        <View style={styles.cardFooter}>
          <Text style={styles.cardTag}>{episode.tag}</Text>
          <Text style={styles.progressText}>
            {episode.watchedEpisodes}/{episode.totalEpisodes}
          </Text>
        </View>
      </View>
      <View style={[styles.checkCircle, episode.watched && styles.checkCircleDone]}>
        <Check color={episode.watched ? bg : ink} size={25} strokeWidth={3} />
      </View>
    </MediaCard>
  );
}

export function ProgressRail({ watched, total, progress }: { watched: number; total: number; progress: number }) {
  const visibleSegments = Array.from({ length: Math.min(total, 10) });

  return (
    <View style={styles.progressRail}>
      <View style={[styles.progressGlow, { width: `${progress}%` }]} />
      {visibleSegments.map((_, index) => {
        const isWatched = index < watched;

        return (
          <View
            key={index}
            style={[
              styles.progressSegment,
              isWatched && styles.progressSegmentWatched,
              index === visibleSegments.length - 1 && styles.progressSegmentLast,
            ]}
          />
        );
      })}
    </View>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: typeof Tv;
  title: string;
  body: string;
  action?: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyVisual}>
        <View style={styles.emptyPosterGhost} />
        <View style={styles.emptyPosterGhostSmall} />
        <View style={styles.emptyIconWrap}>
          <Icon color={bg} size={28} />
        </View>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {action && (
        <View style={styles.emptyAction}>
          <Text style={styles.emptyActionText}>{action}</Text>
        </View>
      )}
    </View>
  );
}

export function SettingRow({ title, value, active = false }: { title: string; value: string; active?: boolean }) {
  return (
    <View style={styles.settingRow}>
      <View>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingValue}>{value}</Text>
      </View>
      <View style={[styles.settingToggle, active && styles.settingToggleActive]}>
        <View style={[styles.settingToggleKnob, active && styles.settingToggleKnobActive]} />
      </View>
    </View>
  );
}

export function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

export function NavItem({
  active,
  icon: Icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: typeof Tv;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.navItem} onPress={onPress}>
      <Icon color={active ? accent : '#71808a'} size={24} strokeWidth={active ? 2.8 : 2} />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </Pressable>
  );
}
