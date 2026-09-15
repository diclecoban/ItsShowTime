import { ArrowLeft, Check, ListPlus, MessageCircle, Play, Plus, RotateCcw, Star, Tv } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ImageBackground, Pressable, Text, View } from 'react-native';

import { EmptyState, MiniStat, ProgressRail } from '../components';
import { accent, bg, gold, ink, muted } from '../theme';
import { styles } from '../styles';
import type { CustomList, DetailEpisode, Episode, ShowDetailInfo, ShowSeason } from '../types';

export function ShowDetail({
  episode,
  showInfo,
  seasons,
  isLoading,
  error,
  syncStatus,
  lists,
  onBack,
  onOpenCommunity,
  onWatch,
  onRetry,
  onAddToList,
}: {
  episode: Episode;
  showInfo?: ShowDetailInfo;
  seasons: ShowSeason[];
  isLoading?: boolean;
  error?: string;
  syncStatus?: 'syncing' | 'ready' | 'failed';
  lists: CustomList[];
  onBack: () => void;
  onOpenCommunity: () => void;
  onWatch: (episode?: DetailEpisode) => void;
  onRetry: () => void;
  onAddToList: (listTitle: string) => void | Promise<void>;
}) {
  const seasonList = seasons;
  const [activeSeason, setActiveSeason] = useState(seasonList[0]?.season ?? 'Episodes');

  useEffect(() => {
    if (seasons.length > 0 && !seasons.some((season) => season.season === activeSeason)) {
      setActiveSeason(seasons[0].season);
    }
  }, [activeSeason, seasons]);

  const detailEpisodes = seasonList.find((season) => season.season === activeSeason)?.episodes ?? [];
  const activeSeasonInfo = seasonList.find((season) => season.season === activeSeason);
  const nextEpisode = detailEpisodes.find((item) => !item.watched) ?? detailEpisodes[0];
  const heroImage = showInfo?.backdropUrl ?? showInfo?.posterUrl ?? episode.image;
  const [isListPickerOpen, setIsListPickerOpen] = useState(false);
  const [selectedListTitle, setSelectedListTitle] = useState(lists[0]?.title ?? '');
  const [isSavedToList, setIsSavedToList] = useState(false);

  useEffect(() => {
    if (!selectedListTitle && lists[0]?.title) {
      setSelectedListTitle(lists[0].title);
    }
  }, [lists, selectedListTitle]);

  return (
    <View>
      <Pressable style={styles.detailBack} onPress={onBack}>
        <ArrowLeft color={ink} size={20} />
        <Text style={styles.detailBackText}>Back to shows</Text>
      </Pressable>

      <ImageBackground
        source={{ uri: heroImage }}
        style={styles.detailHero}
        imageStyle={styles.detailHeroImage}
        resizeMode="cover"
      >
        <View style={styles.detailShade}>
          <Text style={styles.detailMeta}>{showInfo?.status ?? 'Series'} - Avg {(showInfo?.averageRating ?? episode.averageRating).toFixed(1)}</Text>
          <Text style={styles.detailTitle}>{showInfo?.title ?? episode.show}</Text>
          <Text style={styles.detailBody}>{showInfo?.overview ?? 'Keep your season in order, jump into the next episode, and unlock spoiler-safe reactions after watching.'}</Text>
        </View>
      </ImageBackground>

      <View style={styles.detailActionRow}>
        <Pressable style={styles.continueButton} onPress={() => nextEpisode && onWatch(nextEpisode)} disabled={!nextEpisode}>
          <Play color={bg} fill={bg} size={18} />
          <Text style={styles.continueText}>{nextEpisode ? `Watch ${nextEpisode.fullCode ?? episode.code}` : 'No episodes yet'}</Text>
        </Pressable>
        <Pressable style={styles.detailIconButton} onPress={() => setIsListPickerOpen((open) => !open)}>
          <Plus color={ink} size={22} />
        </Pressable>
      </View>

      {isListPickerOpen && (
        <View style={styles.showListPanel}>
          <Text style={styles.detailSmallLabel}>Add show to list</Text>
          {lists.length ? (
            <>
              <View style={styles.movieListPicker}>
                {lists.map((list) => (
                  <Pressable
                    key={list.title}
                    style={[styles.movieListOption, selectedListTitle === list.title && styles.movieListOptionActive]}
                    onPress={() => {
                      setSelectedListTitle(list.title);
                      setIsSavedToList(false);
                    }}
                  >
                    <Text style={[styles.movieListOptionText, selectedListTitle === list.title && styles.movieListOptionTextActive]}>
                      {list.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                style={[styles.saveReactionButton, isSavedToList && styles.searchAddedButton]}
                onPress={() => {
                  if (!selectedListTitle) return;
                  Promise.resolve(onAddToList(selectedListTitle)).then(() => setIsSavedToList(true));
                }}
              >
                <Plus color={bg} size={18} strokeWidth={3} />
                <Text style={styles.saveReactionText}>{isSavedToList ? 'Added to list' : 'Save to selected list'}</Text>
              </Pressable>
            </>
          ) : (
            <EmptyState
              icon={ListPlus}
              title="No lists yet"
              body="Create a list first, then add this show to it."
              action="Open Lists"
            />
          )}
        </View>
      )}

      <View style={styles.detailProgressCard}>
        <View>
          <Text style={styles.detailSmallLabel}>Season progress</Text>
          <Text style={styles.detailProgressValue}>{detailEpisodes.filter((item) => item.watched).length}/{detailEpisodes.length} watched</Text>
        </View>
        <ProgressRail
          watched={detailEpisodes.filter((item) => item.watched).length}
          total={detailEpisodes.length}
          progress={detailEpisodes.length ? Math.round((detailEpisodes.filter((item) => item.watched).length / detailEpisodes.length) * 100) : 0}
        />
        <View style={styles.syncStatusRow}>
          <View
            style={[
              styles.syncStatusDot,
              syncStatus === 'ready' && styles.syncStatusDotReady,
              syncStatus === 'failed' && styles.syncStatusDotFailed,
            ]}
          />
          <Text style={styles.syncStatusText}>
            {syncStatus === 'ready'
              ? 'Live episode data is ready'
              : syncStatus === 'failed'
                ? 'Episode sync needs a retry'
                : 'Syncing episodes from TVmaze'}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Episodes</Text>
      {isLoading ? (
        <EmptyState
          icon={Tv}
          title="Loading episodes"
          body="We are syncing this show from the live catalog."
        />
      ) : error ? (
        <View>
          <EmptyState
            icon={Tv}
            title="Could not load episodes"
            body={error}
          />
          <Pressable style={styles.detailRetryButton} onPress={onRetry}>
            <RotateCcw color={bg} size={17} />
            <Text style={styles.detailRetryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.seasonTabs}>
            {seasonList.map((season) => (
              <Pressable key={season.season} onPress={() => setActiveSeason(season.season)}>
                <Text style={[styles.seasonTab, activeSeason === season.season && styles.seasonTabActive]}>{season.season}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.seasonSummary}>
            <Text style={styles.seasonSummaryText}>
              {detailEpisodes.filter((item) => item.watched).length}/{detailEpisodes.length} watched
            </Text>
            <Text style={styles.seasonSummaryText}>Season {activeSeasonInfo?.seasonNumber ?? 1}</Text>
          </View>
          {detailEpisodes.length ? (
        <View style={styles.timeline}>
          {detailEpisodes.map((item) => (
            <Pressable key={item.id ?? item.fullCode ?? item.code} style={styles.timelineItem} onPress={() => onWatch(item)}>
              <View style={[styles.timelineDot, item.watched && styles.timelineDotDone]}>
                {item.watched && <Check color={bg} size={14} strokeWidth={3} />}
              </View>
              <View style={styles.timelineCopy}>
                <Text style={styles.timelineCode}>{item.code}</Text>
                <Text style={styles.timelineTitle}>{item.title}</Text>
              </View>
              {item.watched && (
                <View style={styles.timelineRatingBadge}>
                  <Star color={gold} fill={gold} size={12} />
                  <Text style={styles.ratingText}>{item.averageRating.toFixed(1)}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      ) : (
        <EmptyState
          icon={Tv}
          title="Episode data is syncing"
          body="This show is in your library, but its episode list has not been imported yet."
          action="Back to shows"
        />
          )}
        </>
      )}

      <Text style={styles.sectionTitle}>Community pulse</Text>
      <Pressable style={styles.communityCard} onPress={onOpenCommunity}>
        <View style={styles.communityMetric}>
          <Star color={gold} fill={gold} size={18} />
          <Text style={styles.communityValue}>4.7</Text>
          <Text style={styles.communityLabel}>avg rating</Text>
        </View>
        <View style={styles.communityMetric}>
          <MessageCircle color={accent} size={18} />
          <Text style={styles.communityValue}>Locked</Text>
          <Text style={styles.communityLabel}>until watched</Text>
        </View>
      </Pressable>
    </View>
  );
}
