import { Grid2X2, Library, List, ListPlus, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CachedImageBackground, ProgressRail } from '../components';
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
  const sortOptions = ['Progress', 'A-Z', 'Recently watched'];
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeSort, setActiveSort] = useState(sortOptions[0]);
  const [viewMode, setViewMode] = useState<'List' | 'Grid'>('List');
  const [visibleShowCount, setVisibleShowCount] = useState(18);
  const watchedEpisodes = shows.reduce((total, show) => total + show.watchedEpisodes, 0);
  const totalEpisodes = shows.reduce((total, show) => total + show.totalEpisodes, 0);
  const staleShows = useMemo(
    () => shows.filter((show) => show.status === 'Watching' && show.progress < 25).slice(0, 3),
    [shows]
  );
  const filteredShows = useMemo(
    () =>
      [...(activeFilter === 'All' ? shows : shows.filter((show) => show.status === activeFilter))].sort((a, b) => {
        if (activeSort === 'A-Z') return a.title.localeCompare(b.title);
        if (activeSort === 'Recently watched') return b.watchedEpisodes - a.watchedEpisodes;
        return b.progress - a.progress;
      }),
    [activeFilter, activeSort, shows]
  );
  const useGrid = viewMode === 'Grid' && !isCompact;
  const visibleShows = filteredShows.slice(0, visibleShowCount);
  const hasMoreShows = filteredShows.length > visibleShows.length;

  useEffect(() => {
    setVisibleShowCount(18);
  }, [activeFilter, activeSort, viewMode]);

  return (
    <View>
      <View style={[styles.libraryDashboard, isCompact && styles.libraryDashboardCompact]}>
        <View style={[styles.libraryHero, isCompact && styles.libraryHeroCompact]}>
          <Text style={styles.libraryKicker}>My library</Text>
          <Text style={styles.libraryTitle}>{shows.length} tracked shows</Text>
          {!isCompact && <Text style={styles.libraryBody}>Your tracked shows, all in one place.</Text>}
          <Pressable style={({ pressed }) => [styles.openListsButton, pressed && styles.pressablePressed]} onPress={onOpenLists}>
            <ListPlus color={bg} size={18} />
            <Text style={styles.openListsText}>Open lists</Text>
          </Pressable>
        </View>

        {!isCompact && <View style={styles.libraryDashboardPanel}>
          <Text style={styles.libraryKicker}>Watch health</Text>
          <Text style={styles.libraryPanelValue}>{totalEpisodes ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0}%</Text>
          <Text style={styles.libraryBody}>{watchedEpisodes}/{totalEpisodes} episodes watched across your library.</Text>
          <View style={styles.libraryPanelDivider} />
          <Text style={styles.libraryPanelLabel}>Needs attention</Text>
          {staleShows.length ? (
            staleShows.map((show) => (
              <Pressable key={show.title} style={({ pressed }) => [styles.libraryMiniRow, pressed && styles.pressablePressed]} onPress={() => onSelectShow(show)}>
                <Text style={styles.libraryMiniTitle}>{show.title}</Text>
                <Text style={styles.libraryMiniMeta}>{show.progress}%</Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.libraryMiniEmpty}>Your active shelf looks tidy.</Text>
          )}
        </View>}
      </View>

      <View style={[styles.libraryFilters, isCompact && styles.libraryFiltersCompact]}>
        {filters.map((filter) => (
            <Pressable key={filter} style={({ pressed }) => pressed && styles.pressablePressed} onPress={() => setActiveFilter(filter)}>
            <Text style={[styles.libraryFilter, activeFilter === filter && styles.libraryFilterActive]}>{filter}</Text>
          </Pressable>
        ))}
      </View>

      {!isCompact && <View style={styles.libraryToolbar}>
        <View style={styles.librarySortGroup}>
          <SlidersHorizontal color={muted} size={17} />
          {sortOptions.map((sort) => (
            <Pressable key={sort} style={({ pressed }) => pressed && styles.pressablePressed} onPress={() => setActiveSort(sort)}>
              <Text style={[styles.librarySortChip, activeSort === sort && styles.librarySortChipActive]}>{sort}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.libraryViewToggle}>
          <Pressable style={({ pressed }) => [styles.libraryViewButton, viewMode === 'List' && styles.libraryViewButtonActive, pressed && styles.pressablePressed]} onPress={() => setViewMode('List')}>
            <List color={viewMode === 'List' ? bg : ink} size={17} />
          </Pressable>
          <Pressable style={({ pressed }) => [styles.libraryViewButton, viewMode === 'Grid' && styles.libraryViewButtonActive, pressed && styles.pressablePressed]} onPress={() => setViewMode('Grid')}>
            <Grid2X2 color={viewMode === 'Grid' ? bg : ink} size={17} />
          </Pressable>
        </View>
      </View>}

      {filteredShows.length === 0 ? (
        <View style={[styles.libraryShelfStarter, isCompact && styles.libraryShelfStarterCompact]}>
          <View style={styles.libraryShelfIcon}>
            <Library color={gold} size={25} />
          </View>
          <View style={styles.libraryShelfCopy}>
            <Text style={styles.libraryShowTitle}>{`No ${activeFilter.toLowerCase()} shows yet`}</Text>
            <Text style={styles.libraryNext}>Add shows to fill this shelf.</Text>
          </View>
          <Pressable style={({ pressed }) => [styles.openListsButton, styles.libraryShelfButton, pressed && styles.pressablePressed]} onPress={onOpenLists}>
            <ListPlus color={bg} size={18} />
            <Text style={styles.openListsText}>Plan lists</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.libraryList, useGrid && styles.libraryGrid]}>
          {visibleShows.map((show) => (
            <Pressable key={show.title} style={({ pressed }) => [styles.libraryCard, isCompact && styles.libraryCardCompact, useGrid && styles.libraryGridCard, pressed && styles.pressablePressed]} onPress={() => onSelectShow(show)}>
              <CachedImageBackground
                uri={show.image}
                style={[styles.libraryPoster, isCompact && styles.libraryPosterCompact, useGrid && styles.libraryGridPoster]}
                imageStyle={styles.libraryPosterImage}
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
          {hasMoreShows ? (
            <Pressable style={({ pressed }) => [styles.adminWideActionButton, pressed && styles.pressablePressed]} onPress={() => setVisibleShowCount((count) => count + 18)}>
              <Text style={styles.adminActionText}>Load more</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}
