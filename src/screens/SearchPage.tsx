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

export function SearchPage({
  onBack,
  results,
  selectedGenres,
  selectedServices,
  onToggleResult,
}: {
  onBack: () => void;
  results: SearchResult[];
  selectedGenres: string[];
  selectedServices: string[];
  onToggleResult: (title: string) => void;
}) {
  const filters = ['All', 'Shows', 'Movies', 'People'];
  const recent = ['Severance', 'Dark comedy', 'Limited series'];
  const suggestions = [
    { label: 'Because you track workplace chaos', query: 'Slow Horses' },
    { label: 'New on your platforms', query: 'Apple TV+' },
    { label: 'Short seasons under 6h', query: 'Limited series' },
  ];
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeGenre, setActiveGenre] = useState('All');
  const [activePlatform, setActivePlatform] = useState('All');
  const [viewMode, setViewMode] = useState<'List' | 'Grid'>('List');
  const [selectedActor, setSelectedActor] = useState<SearchResult | null>(null);
  const genreFilters = ['All', ...selectedGenres];
  const platformFilters = ['All', ...selectedServices];
  const normalizedQuery = query.trim().toLowerCase();
  const filteredResults = results.filter((result) => {
    const matchesType = activeFilter === 'All' || result.type === activeFilter;
    const matchesGenre = activeGenre === 'All' || result.meta.includes(activeGenre);
    const matchesPlatform = activePlatform === 'All' || result.platform === activePlatform;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      [result.title, result.meta, result.platform].some((value) => value.toLowerCase().includes(normalizedQuery));

    return matchesType && matchesGenre && matchesPlatform && matchesQuery;
  });

  return (
    <View>
      <Pressable style={styles.detailBack} onPress={onBack}>
        <ArrowLeft color={ink} size={20} />
        <Text style={styles.detailBackText}>Back</Text>
      </Pressable>

      <View style={styles.searchBox}>
        <Search color={muted} size={20} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search shows, movies, actors..."
          placeholderTextColor={muted}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.searchSuggestionPanel}>
        {suggestions.map((suggestion) => (
          <Pressable key={suggestion.label} style={styles.searchSuggestion} onPress={() => setQuery(suggestion.query)}>
            <Sparkles color={gold} size={15} />
            <Text style={styles.searchSuggestionText}>{suggestion.label}</Text>
          </Pressable>
        ))}
      </View>

      <FilterChips options={filters} active={activeFilter} onChange={setActiveFilter} />

      <Text style={styles.sectionTitle}>Genres</Text>
      <FilterChips options={genreFilters} active={activeGenre} onChange={setActiveGenre} />

      <Text style={styles.sectionTitle}>Platforms</Text>
      <View style={styles.platformFilterGrid}>
        {platformFilters.map((platform) => (
          <Pressable
            key={platform}
            style={[styles.platformFilterCard, activePlatform === platform && styles.platformFilterCardActive]}
            onPress={() => setActivePlatform(platform)}
          >
            <Tv color={activePlatform === platform ? bg : gold} size={17} />
            <Text style={[styles.platformFilterText, activePlatform === platform && styles.platformFilterTextActive]}>
              {platform}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Recent searches</Text>
      <View style={styles.recentSearches}>
        {recent.map((item) => (
          <Text key={item} style={styles.recentChip}>{item}</Text>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Trending searches</Text>
      <View style={styles.trendingSearches}>
        {['Slow Horses', 'Apple TV+', 'Arrival', 'Adam Scott'].map((item, index) => (
          <Pressable key={item} style={styles.trendingChip} onPress={() => setQuery(item)}>
            <Text style={styles.trendingRank}>#{index + 1}</Text>
            <Text style={styles.trendingText}>{item}</Text>
          </Pressable>
        ))}
      </View>

      {selectedActor && (
        <View style={styles.actorPreview}>
          <ImageBackground
            source={{ uri: selectedActor.image }}
            style={styles.actorPreviewImage}
            imageStyle={styles.actorPreviewImageStyle}
            resizeMode="cover"
          />
          <View style={styles.actorPreviewCopy}>
            <Text style={styles.actorPreviewKicker}>Actor preview</Text>
            <Text style={styles.actorPreviewTitle}>{selectedActor.title}</Text>
            <Text style={styles.actorPreviewBody}>{selectedActor.meta}</Text>
          </View>
          <Pressable style={styles.actorPreviewClose} onPress={() => setSelectedActor(null)}>
            <X color={ink} size={16} />
          </Pressable>
        </View>
      )}

      <View style={styles.resultsHeader}>
        <Text style={styles.sectionTitle}>Top results</Text>
        <View style={styles.viewToggle}>
          {(['List', 'Grid'] as const).map((mode) => (
            <Pressable key={mode} onPress={() => setViewMode(mode)}>
              <Text style={[styles.viewToggleText, viewMode === mode && styles.viewToggleTextActive]}>{mode}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {filteredResults.length === 0 ? (
        <EmptyState
          icon={Search}
          title={`No ${activeFilter.toLowerCase()} found`}
          body="Try a broader filter or search by another title, actor, or platform."
          action="Clear filter"
        />
      ) : (
        <View style={viewMode === 'Grid' ? styles.searchGridResults : styles.searchResults}>
          {filteredResults.map((result) => (
            <Pressable
              key={result.title}
              style={viewMode === 'Grid' ? styles.searchGridCard : styles.searchResultCard}
              onPress={() => result.type === 'People' && setSelectedActor(result)}
            >
              <ImageBackground
                source={{ uri: result.image }}
                style={viewMode === 'Grid' ? styles.searchGridPoster : styles.searchPoster}
                imageStyle={viewMode === 'Grid' ? styles.searchGridPosterImage : styles.searchPosterImage}
                resizeMode="cover"
              />
              <View style={styles.searchResultCopy}>
                <Text style={styles.searchResultTitle}>{result.title}</Text>
                <Text style={styles.searchResultMeta}>{result.meta}</Text>
                {result.platform && <Text style={styles.platformPill}>{result.platform}</Text>}
              </View>
              <Pressable
                style={[styles.searchAddButton, result.status === 'In library' && styles.searchAddedButton]}
                onPress={() => onToggleResult(result.title)}
              >
                {result.status === 'In library' ? (
                  <Check color={bg} size={18} strokeWidth={3} />
                ) : (
                  <Plus color={bg} size={18} strokeWidth={3} />
                )}
              </Pressable>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
