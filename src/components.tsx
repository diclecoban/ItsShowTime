import { Bell, Check, RefreshCw, Search, Tv } from 'lucide-react';
import type { ReactNode } from 'react';
import { ImageBackground, Pressable, Text, View } from 'react-native';
import type { ImageStyle, StyleProp, ViewStyle } from 'react-native';

import { accent, bg, ink, muted } from './theme';
import { useResponsive } from './hooks/useResponsive';
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
  const { isCompact, isDesktop } = useResponsive();

  return (
    <View style={[styles.header, isCompact && styles.headerCompact, isDesktop && styles.headerDesktop]}>
      <View>
        <Text style={styles.eyebrow}>It’s Showtime</Text>
        <Text style={[styles.title, isCompact && styles.titleCompact]}>{title}</Text>
      </View>
      <View style={styles.headerActions}>
        <Pressable style={({ pressed }) => [styles.iconButton, pressed && styles.pressablePressed]} onPress={onOpenSearch}>
          <Search color={ink} size={20} />
        </Pressable>
        <Pressable style={({ pressed }) => [styles.iconButton, pressed && styles.pressablePressed]} onPress={onOpenNotifications}>
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
      <Pressable style={({ pressed }) => [style, styles.motionCard, pressed && styles.pressablePressed]} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={style}>{content}</View>;
}

export function CachedImageBackground({
  uri,
  style,
  imageStyle,
  children,
}: {
  uri: string;
  style: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  children?: ReactNode;
}) {
  return (
    <ImageBackground
      source={{ uri, cache: 'force-cache' }}
      style={style}
      imageStyle={imageStyle}
      resizeMode="cover"
    >
      {children}
    </ImageBackground>
  );
}

export function EpisodeCard({ episode, onPress }: { episode: Episode; onPress: () => void }) {
  const { isCompact } = useResponsive();

  return (
    <MediaCard image={episode.image} style={[styles.episodeCard, isCompact && styles.episodeCardCompact]} onPress={onPress}>
      <View style={[styles.episodeBody, isCompact && styles.episodeBodyCompact]}>
        <Text style={styles.pill}>{episode.show}</Text>
        <Text style={styles.code}>{episode.code}</Text>
        <Text style={[styles.episodeTitle, isCompact && styles.episodeTitleCompact]}>{episode.title}</Text>
        <ProgressRail watched={episode.watchedEpisodes} total={episode.totalEpisodes} progress={episode.progress} />
        <View style={styles.cardFooter}>
          <Text style={styles.cardTag}>{episode.tag}</Text>
          <Text style={styles.progressText}>
            {episode.watchedEpisodes}/{episode.totalEpisodes}
          </Text>
        </View>
      </View>
      <View style={[styles.checkCircle, isCompact && styles.checkCircleCompact, episode.watched && styles.checkCircleDone]}>
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

export function BackendState({
  title,
  body,
  mode = 'loading',
  onRetry,
}: {
  title: string;
  body: string;
  mode?: 'loading' | 'error' | 'empty';
  onRetry?: () => void | Promise<void>;
}) {
  return (
    <View style={styles.backendState}>
      <View style={[styles.backendStateIcon, mode === 'error' && styles.backendStateIconError]}>
        <RefreshCw color={bg} size={22} />
      </View>
      <Text style={styles.backendStateTitle}>{title}</Text>
      <Text style={styles.backendStateBody}>{body}</Text>
      {onRetry ? (
        <Pressable style={styles.adminWideActionButton} onPress={onRetry}>
          <Text style={styles.adminActionText}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SettingRow({
  title,
  value,
  active = false,
  onPress,
}: {
  title: string;
  value: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingValue}>{value}</Text>
      </View>
      <View style={[styles.settingToggle, active && styles.settingToggleActive]}>
        <View style={[styles.settingToggleKnob, active && styles.settingToggleKnobActive]} />
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={({ pressed }) => [styles.settingRow, pressed && styles.pressablePressed]} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return (
    <View style={styles.settingRow}>
      {content}
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
  const { isDesktop } = useResponsive();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.navItem,
        isDesktop && styles.navItemDesktop,
        active && isDesktop && styles.navItemDesktopActive,
        active && !isDesktop && styles.navItemActiveMobile,
        pressed && styles.navItemPressed,
      ]}
      onPress={onPress}
    >
      <Icon color={active ? accent : muted} size={24} strokeWidth={active ? 2.8 : 2} />
      <Text style={[styles.navLabel, isDesktop && styles.navLabelDesktop, active && styles.navLabelActive]}>{label}</Text>
    </Pressable>
  );
}
