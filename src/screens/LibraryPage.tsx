import { Library, ListPlus } from 'lucide-react';
import { useState } from 'react';
import { ImageBackground, Pressable, Text, View } from 'react-native';

import { EmptyState, ProgressRail } from '../components';
import { bg, gold, ink, muted } from '../theme';
import { styles } from '../styles';
import { useResponsive } from '../hooks/useResponsive';
import type { LibraryShow } from '../types';

export function LibraryPage({
  shows,
  onOpenLists,
  onSelectShow,
}: {
  shows: LibraryShow[];
  onOpenLists: () => void;
  onSelectShow: (show: LibraryShow) => void;
}) {
  const { isCompact } = useResponsive();
  const filters = ['All', 'Watching', 'Paused', 'Finished', 'Dropped'];
  const [activeFilter, setActiveFilter] = useState('All');
  const filteredShows =
    activeFilter === 'All' ? shows : shows.filter((show) => show.status === activeFilter);

  return (
    <View>
      <View style={styles.libraryHero}>
        <Text style={styles.libraryKicker}>My library</Text>
        <Text style={styles.libraryTitle}>{shows.length} tracked shows</Text>
        <Text style={styles.libraryBody}>Everything you are watching, pausing, finishing, or saving for later.</Text>
        <Pressable style={styles.openListsButton} onPress={onOpenLists}>
          <ListPlus color={bg} size={18} />
          <Text style={styles.openListsText}>Open lists</Text>
        </Pressable>
      </View>

      <View style={styles.libraryFilters}>
        {filters.map((filter) => (
          <Pressable key={filter} onPress={() => setActiveFilter(filter)}>
            <Text style={[styles.libraryFilter, activeFilter === filter && styles.libraryFilterActive]}>{filter}</Text>
          </Pressable>
        ))}
      </View>

      {filteredShows.length === 0 ? (
        <EmptyState
          icon={Library}
          title={`No ${activeFilter.toLowerCase()} shows yet`}
          body="Add a show from search or discover to start filling this shelf."
          action="Browse discover"
        />
      ) : (
        <View style={styles.libraryList}>
          {filteredShows.map((show) => (
            <Pressable key={show.title} style={[styles.libraryCard, isCompact && styles.libraryCardCompact]} onPress={() => onSelectShow(show)}>
              <ImageBackground
                source={{ uri: show.image }}
                style={[styles.libraryPoster, isCompact && styles.libraryPosterCompact]}
                imageStyle={styles.libraryPosterImage}
                resizeMode="cover"
              />
              <View style={styles.libraryCopy}>
                <View style={styles.libraryTopLine}>
                  <Text style={styles.libraryShowTitle}>{show.title}</Text>
                  <Text style={[styles.libraryStatus, show.status === 'Finished' && styles.libraryStatusDone]}>
                    {show.status}
                  </Text>
                </View>
                <Text style={styles.libraryNext}>{show.next}</Text>
                <ProgressRail watched={show.watchedEpisodes} total={show.totalEpisodes} progress={show.progress} />
                <Text style={styles.libraryMeta}>{show.meta}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
