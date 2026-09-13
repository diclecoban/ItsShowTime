import { ArrowLeft, Check, Lock, Plus, Search, Sparkles, Tv, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ImageBackground, Pressable, Text, TextInput, View } from 'react-native';

import { EmptyState, FilterChips } from '../components';
import { bg, gold, ink, muted } from '../theme';
import { styles } from '../styles';
import { useResponsive } from '../hooks/useResponsive';
import type { SearchResult } from '../types';

export function SearchPage({
  onBack,
  results,
  selectedGenres,
  selectedServices,
  onToggleResult,
  onSelectResult,
  onSearch,
}: {
  onBack: () => void;
  results: SearchResult[];
  selectedGenres: string[];
  selectedServices: string[];
  onToggleResult: (title: string) => void | Promise<void>;
  onSelectResult: (result: SearchResult) => void | Promise<void>;
  onSearch?: (query: string, type: 'All' | 'Shows' | 'Movies' | 'People') => void;
}) {
  const { isCompact } = useResponsive();
  const filters = ['All', 'Shows', 'Movies', 'People'];
  const suggestions = [
    { label: 'Because you track workplace chaos', query: 'Slow Horses' },
    { label: 'Try a comfort comedy', query: 'Abbott Elementary' },
    { label: 'Find a limited series', query: 'Chernobyl' },
  ];
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeGenre, setActiveGenre] = useState('All');
  const [activePlatform, setActivePlatform] = useState('All');
  const [viewMode, setViewMode] = useState<'List' | 'Grid'>('List');
  const [selectedActor, setSelectedActor] = useState<SearchResult | null>(null);
  const [addedTitle, setAddedTitle] = useState('');
  const [isFeedbackLeaving, setIsFeedbackLeaving] = useState(false);

  useEffect(() => {
    const searchTimer = window.setTimeout(() => onSearch?.(query, activeFilter), 250);
    return () => window.clearTimeout(searchTimer);
  }, [activeFilter, onSearch, query]);

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

  const addResult = (title: string) => {
    Promise.resolve(onToggleResult(title)).then(() => {
      setAddedTitle(title);
      setIsFeedbackLeaving(false);
      window.setTimeout(() => setIsFeedbackLeaving(true), 1600);
      window.setTimeout(() => setAddedTitle(''), 2150);
    });
  };

  return (
    <View style={styles.searchScreen}>
      <Pressable style={styles.detailBack} onPress={onBack}>
        <ArrowLeft color={ink} size={20} />
        <Text style={styles.detailBackText}>Back</Text>
      </Pressable>

      <View style={styles.searchBox}>
        <Search color={muted} size={20} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search shows..."
          placeholderTextColor={muted}
          style={styles.searchInput}
        />
      </View>

      {addedTitle && (
        <View style={[styles.searchFeedbackOverlay, isFeedbackLeaving && styles.searchFeedbackOverlayLeaving]}>
          <View style={[styles.searchFeedback, isFeedbackLeaving && styles.searchFeedbackLeaving]}>
            <View style={styles.searchFeedbackIcon}>
              <Check color={bg} size={26} strokeWidth={3} />
            </View>
            <Text style={styles.searchFeedbackTitle}>Added to Library</Text>
            <Text style={styles.searchFeedbackText}>{addedTitle}</Text>
          </View>
        </View>
      )}

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
          body={activeFilter === 'Movies' ? 'Movie search will open once It’s Showtime has enough budget for broader catalog access.' : 'Try a broader filter or search by another title, actor, or platform.'}
          action="Clear filter"
        />
      ) : (
        <View style={viewMode === 'Grid' && !isCompact ? styles.searchGridResults : styles.searchResults}>
          {filteredResults.map((result) => (
            <Pressable
              key={result.title}
              style={viewMode === 'Grid' && !isCompact ? styles.searchGridCard : styles.searchResultCard}
              onPress={() => {
                if (result.type === 'People') {
                  setSelectedActor(result);
                  return;
                }

                Promise.resolve(onSelectResult(result));
              }}
            >
              <ImageBackground
                source={{ uri: result.image }}
                style={viewMode === 'Grid' && !isCompact ? styles.searchGridPoster : styles.searchPoster}
                imageStyle={viewMode === 'Grid' && !isCompact ? styles.searchGridPosterImage : styles.searchPosterImage}
                resizeMode="cover"
              />
              <View style={styles.searchResultCopy}>
                <Text style={styles.searchResultTitle}>{result.title}</Text>
                <Text style={styles.searchResultMeta}>{result.meta}</Text>
                {result.type === 'Movies' ? (
                  <View style={styles.searchPremiumPill}>
                    <Lock color={gold} size={12} />
                    <Text style={styles.searchPremiumText}>Awaiting catalog budget</Text>
                  </View>
                ) : (
                  result.platform && <Text style={styles.platformPill}>{result.platform}</Text>
                )}
              </View>
              <Pressable
                style={[
                  styles.searchAddButton,
                  result.status === 'In library' && styles.searchAddedButton,
                  result.type === 'Movies' && styles.searchLockedButton,
                ]}
                onPress={(event) => {
                  event.stopPropagation();
                  addResult(result.title);
                }}
                disabled={result.type === 'Movies'}
              >
                {result.status === 'In library' ? (
                  <Check color={bg} size={18} strokeWidth={3} />
                ) : result.type === 'Movies' ? (
                  <Lock color={bg} size={16} strokeWidth={3} />
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
