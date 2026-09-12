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

export function ListsPage({
  lists,
  onBack,
  onCreateList,
  onTogglePrivacy,
}: {
  lists: CustomList[];
  onBack: () => void;
  onCreateList: (list: CustomList) => void;
  onTogglePrivacy: (title: string) => void;
}) {
  const [selectedList, setSelectedList] = useState<CustomList | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const createList = () => {
    const title = newListName.trim() || 'Weekend watchlist';

    onCreateList({
      title,
      count: '0 titles',
      privacy: 'Private',
      images: [favoriteShows[0].image, favoriteShows[1].image, movies[0].image],
      items: [],
    });
    setSelectedList(null);
    setIsCreating(false);
    setNewListName('');
  };

  if (selectedList) {
    return (
      <View>
        <Pressable style={styles.detailBack} onPress={() => setSelectedList(null)}>
          <ArrowLeft color={ink} size={20} />
          <Text style={styles.detailBackText}>Back to lists</Text>
        </Pressable>

        <View style={styles.listsHero}>
          <View>
            <Text style={styles.libraryKicker}>{selectedList.privacy}</Text>
            <Text style={styles.libraryTitle}>{selectedList.title}</Text>
            <Text style={styles.libraryBody}>{selectedList.count} saved for exactly this mood.</Text>
          </View>
          <Pressable
            style={styles.listPrivacyToggle}
            onPress={() => {
              onTogglePrivacy(selectedList.title);
              setSelectedList({
                ...selectedList,
                privacy: selectedList.privacy === 'Private' ? 'Public' : 'Private',
              });
            }}
          >
            <Text style={styles.listPrivacyText}>{selectedList.privacy}</Text>
          </Pressable>
        </View>

        <View style={styles.listDetailPosterRow}>
          {selectedList.images.map((image, index) => (
            <ImageBackground
              key={`${selectedList.title}-${index}`}
              source={{ uri: image }}
              style={styles.listDetailPoster}
              imageStyle={styles.listDetailPosterImage}
              resizeMode="cover"
            />
          ))}
        </View>

        <View style={styles.listShareCard}>
          <Text style={styles.actorPreviewKicker}>Share preview</Text>
          <Text style={styles.socialListTitle}>{selectedList.title}</Text>
          <Text style={styles.socialListBody}>
            {selectedList.privacy === 'Public' ? 'Visible on your profile' : 'Only you can see this list'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Saved titles</Text>
        {(selectedList.items ?? []).length === 0 ? (
          <EmptyState
            icon={ListPlus}
            title="No titles here yet"
            body="Add shows or movies from detail pages to start shaping this list."
            action="Add title"
          />
        ) : (
          <View style={styles.listDetailItems}>
            {(selectedList.items ?? []).map((item) => (
              <View key={`${selectedList.title}-${item.title}`} style={styles.listDetailItem}>
                <ImageBackground
                  source={{ uri: item.image }}
                  style={styles.listDetailThumb}
                  imageStyle={styles.listDetailThumbImage}
                  resizeMode="cover"
                />
                <View style={styles.customListCopy}>
                  <Text style={styles.customListTitle}>{item.title}</Text>
                  <Text style={styles.customListMeta}>{item.meta}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }

  return (
    <View>
      <Pressable style={styles.detailBack} onPress={onBack}>
        <ArrowLeft color={ink} size={20} />
        <Text style={styles.detailBackText}>Back to library</Text>
      </Pressable>

      <View style={styles.listsHero}>
        <View>
          <Text style={styles.libraryKicker}>Collections</Text>
          <Text style={styles.libraryTitle}>Your curated shelves</Text>
        </View>
        <Pressable style={styles.createListButton} onPress={() => setIsCreating(true)}>
          <Plus color={bg} size={22} strokeWidth={3} />
        </Pressable>
      </View>

      {isCreating && (
        <View style={styles.createListPanel}>
          <Text style={styles.createListTitle}>New list</Text>
          <TextInput
            value={newListName}
            onChangeText={setNewListName}
            placeholder="List name"
            placeholderTextColor={muted}
            style={styles.createListInput}
          />
          <View style={styles.createListActions}>
            <Pressable style={styles.createListCancel} onPress={() => setIsCreating(false)}>
              <Text style={styles.createListCancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.createListSave} onPress={createList}>
              <Text style={styles.createListSaveText}>Create</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.listQuickRow}>
        <View style={styles.quickListTile}>
          <Star color={gold} fill={gold} size={24} />
          <Text style={styles.quickListValue}>36</Text>
          <Text style={styles.quickListLabel}>Favorites</Text>
        </View>
        <View style={styles.quickListTile}>
          <CalendarDays color={accent} size={24} />
          <Text style={styles.quickListValue}>18</Text>
          <Text style={styles.quickListLabel}>Watch later</Text>
        </View>
      </View>

      <View style={styles.socialListPulse}>
        <View style={styles.socialAvatarStack}>
          {['D', 'M', 'L'].map((initial, index) => (
            <View key={initial} style={[styles.socialAvatar, { marginLeft: index === 0 ? 0 : -10 }]}>
              <Text style={styles.socialAvatarText}>{initial}</Text>
            </View>
          ))}
        </View>
        <View style={styles.socialListCopy}>
          <Text style={styles.socialListTitle}>3 friends updated lists today</Text>
          <Text style={styles.socialListBody}>Mara added Arrival to Mind-bending nights.</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Custom lists</Text>
      {lists.length === 0 ? (
        <EmptyState
          icon={ListPlus}
          title="No custom lists yet"
          body="Create a shelf for comfort rewatches, mind-bending nights, or anything only you would name."
          action="Create list"
        />
      ) : (
        <View style={styles.customListStack}>
          {lists.map((list) => (
          <Pressable key={list.title} style={styles.customListCard} onPress={() => setSelectedList(list)}>
            <View style={styles.listPosterStack}>
              {list.images.map((image, index) => (
                <ImageBackground
                  key={`${list.title}-${index}`}
                  source={{ uri: image }}
                  style={[styles.listPosterSlice, { left: index * 26 }]}
                  imageStyle={styles.listPosterSliceImage}
                  resizeMode="cover"
                />
              ))}
            </View>
            <View style={styles.customListCopy}>
              <Text style={styles.customListTitle}>{list.title}</Text>
              <Text style={styles.customListMeta}>{list.count} - {list.privacy}</Text>
            </View>
            <View style={styles.customListArrow}>
              <Plus color={ink} size={18} />
            </View>
          </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
