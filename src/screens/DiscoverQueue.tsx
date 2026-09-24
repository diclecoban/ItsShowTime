import { Flame, Plus, RotateCcw, Sparkles, Stars, X } from 'lucide-react';
import { ImageBackground, Pressable, Text, View } from 'react-native';

import { EmptyState } from '../components';
import { bg, gold, ink, muted } from '../theme';
import { styles } from '../styles';
import { useResponsive } from '../hooks/useResponsive';
import type { DiscoverItem } from '../types';

export function DiscoverQueue({
  item,
  nextItems,
  onAdvance,
  onAdd,
  onOpen,
}: {
  item?: DiscoverItem;
  nextItems: DiscoverItem[];
  onAdvance: () => void;
  onAdd: (item: DiscoverItem) => void | Promise<void>;
  onOpen: (item: DiscoverItem) => void | Promise<void>;
}) {
  const { isCompact } = useResponsive();
  const moodPicks = ['Dark twists', 'Cozy drama', 'Sharp comedy', 'One more episode'];
  const insightCards = [
    { label: 'Taste match', value: item?.match ?? 'New', icon: Sparkles },
    { label: 'Best fit', value: item?.fit[0] ?? 'Series', icon: Stars },
    { label: 'Queue heat', value: nextItems.length ? `${nextItems.length + 1} picks` : 'Fresh', icon: Flame },
  ];

  if (!item) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Building your discover queue"
        body="Live picks will appear here."
      />
    );
  }

  return (
    <View>
      <View style={styles.queueHeader}>
        <View>
          <Text style={styles.queueKicker}>Tonight's pick</Text>
          <Text style={styles.queueTitle}>Swipe Queue</Text>
        </View>
        <View style={styles.matchBadge}>
          <Sparkles color={bg} size={15} />
          <Text style={styles.matchText}>{item.match}</Text>
        </View>
      </View>

      <ImageBackground
        source={{ uri: item.image }}
        style={[styles.heroQueue, isCompact && styles.heroQueueCompact]}
        imageStyle={styles.heroQueueImage}
        resizeMode="cover"
      >
        <Pressable style={({ pressed }) => [styles.heroShade, pressed && styles.pressablePressed]} onPress={() => onOpen(item)}>
          <View style={styles.fitRow}>
            {item.fit.map((fit) => (
              <Text key={fit} style={styles.fitBadge}>{fit}</Text>
          ))}
        </View>
        <Text style={[styles.heroTitle, isCompact && styles.heroTitleCompact]}>{item.title}</Text>
        <Text style={styles.heroMeta}>{item.meta}</Text>
          {!isCompact && <Text style={styles.heroBody}>{item.body}</Text>}
          {!isCompact && <Text style={styles.heroReason}>{item.reason}</Text>}
        </Pressable>
      </ImageBackground>

      {!isCompact && <View style={styles.discoverMoodRail}>
        {moodPicks.map((mood) => (
          <Text key={mood} style={styles.discoverMoodPill}>{mood}</Text>
        ))}
      </View>}

      {!isCompact && <View style={styles.discoverInsightGrid}>
        {insightCards.map(({ label, value, icon: Icon }) => (
          <View key={label} style={styles.discoverInsightCard}>
            <Icon color={gold} size={18} />
            <Text style={styles.discoverInsightValue}>{value}</Text>
            <Text style={styles.discoverInsightLabel}>{label}</Text>
          </View>
        ))}
      </View>}

      {!isCompact && <View style={styles.discoverWhyPanel}>
        <Text style={styles.discoverWhyTitle}>Why this pick works</Text>
        <Text style={styles.discoverWhyBody}>
          Based on your taste and library.
        </Text>
      </View>}

      <View style={styles.queueActions}>
        <Pressable style={({ pressed }) => [styles.queueAction, pressed && styles.pressablePressed]} onPress={onAdvance}>
          <X color={ink} size={24} />
          <Text style={styles.queueActionText}>Skip</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.queueAction, styles.queueActionPrimary, pressed && styles.pressablePressed]}
          onPress={() => {
            Promise.resolve(onAdd(item)).then(onAdvance);
          }}
        >
          <Plus color={bg} size={26} strokeWidth={3} />
          <Text style={styles.queueActionPrimaryText}>Add</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.queueAction, pressed && styles.pressablePressed]} onPress={onAdvance}>
          <RotateCcw color={ink} size={23} />
          <Text style={styles.queueActionText}>Maybe</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Up next</Text>
        <Text style={styles.sectionHint}>Curated from your watch taste</Text>
      </View>
      <View style={[styles.nextRail, isCompact && styles.nextRailCompact]}>
        {nextItems.map((nextItem) => (
          <Pressable key={nextItem.title} style={({ pressed }) => [styles.nextCard, isCompact && styles.nextCardCompact, pressed && styles.pressablePressed]} onPress={() => onOpen(nextItem)}>
            <ImageBackground
              source={{ uri: nextItem.image }}
              style={styles.nextPoster}
              imageStyle={styles.nextPosterImage}
              resizeMode="cover"
            />
            <Text style={styles.nextTitle}>{nextItem.title}</Text>
            <Text style={styles.nextMeta}>{nextItem.match}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
