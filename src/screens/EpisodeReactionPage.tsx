import { ArrowLeft, Check, Heart, MessageCircle, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { useState } from 'react';
import { ImageBackground, Pressable, Text, TextInput, View } from 'react-native';

import { accent, bg, gold, ink, muted } from '../theme';
import { styles } from '../styles';
import type { Episode, EpisodeReaction } from '../types';

export function EpisodeReactionPage({
  episode,
  onBack,
  onSave,
  onOpenCommunity,
}: {
  episode: Episode;
  onBack: () => void;
  onSave: (reaction: EpisodeReaction) => void | Promise<void>;
  onOpenCommunity: () => void;
}) {
  const feelings = ['Mind blown', 'Tense', 'Funny', 'Heavy', 'Confused', 'Loved it'];
  const characters = ['Mark', 'Helly', 'Irving', 'Dylan'];
  const quickReactions = ['Perfect twist', 'Need answers', 'Best scene', 'Too slow', 'Rewatch worthy'];
  const spoilerComforts = ['Hide spoilers', 'Episode-only', 'Open comments'];
  const [rating, setRating] = useState(4);
  const [selectedMood, setSelectedMood] = useState(feelings[0]);
  const [quickReaction, setQuickReaction] = useState(quickReactions[0]);
  const [spoilerComfort, setSpoilerComfort] = useState(spoilerComforts[0]);
  const [favoriteCharacter, setFavoriteCharacter] = useState(characters[1]);
  const [favoriteMoment, setFavoriteMoment] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const saveReaction = async () => {
    if (isSaving) return;

    setIsSaving(true);
    setSaveMessage('');

    try {
      const composedNote = [
        quickReaction ? `Quick reaction: ${quickReaction}` : '',
        favoriteMoment.trim() ? `Favorite moment: ${favoriteMoment.trim()}` : '',
        note.trim(),
      ]
        .filter(Boolean)
        .join('\n\n');

      await onSave({
        rating,
        mood: selectedMood,
        favoriteCharacter,
        favoriteMoment: favoriteMoment.trim(),
        quickReaction,
        spoilerComfort,
        note: composedNote,
      });
      setSaveMessage('Reaction saved');
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Could not save reaction');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View>
      <Pressable style={styles.detailBack} onPress={onBack}>
        <ArrowLeft color={ink} size={20} />
        <Text style={styles.detailBackText}>Back to episode</Text>
      </Pressable>

      <ImageBackground
        source={{ uri: episode.image }}
        style={styles.reactionHero}
        imageStyle={styles.reactionHeroImage}
        resizeMode="cover"
      >
        <View style={styles.reactionShade}>
          <Text style={styles.reactionShow}>{episode.show}</Text>
          <Text style={styles.reactionEpisode}>{episode.code} - {episode.title}</Text>
          <View style={styles.watchedStamp}>
            <Check color={bg} size={16} strokeWidth={3} />
            <Text style={styles.watchedStampText}>Marked watched</Text>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.reactionPanel}>
        <View style={styles.reactionPanelTop}>
          <View>
            <Text style={styles.reactionSectionLabel}>Your rating</Text>
            <Text style={styles.reactionPanelTitle}>{rating}.0 / 5</Text>
          </View>
          <View style={styles.reactionPrivacyPill}>
            <ShieldCheck color={bg} size={15} />
            <Text style={styles.reactionPrivacyText}>{spoilerComfort}</Text>
          </View>
        </View>
        <View style={styles.reactionStars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable key={star} onPress={() => setRating(star)}>
              <Star color={gold} fill={star <= rating ? gold : 'transparent'} size={34} />
            </Pressable>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quick reaction</Text>
      <View style={styles.quickReactionGrid}>
        {quickReactions.map((reaction) => (
          <Pressable
            key={reaction}
            style={[styles.quickReactionCard, quickReaction === reaction && styles.quickReactionCardActive]}
            onPress={() => setQuickReaction(reaction)}
          >
            <Sparkles color={quickReaction === reaction ? bg : gold} size={16} />
            <Text style={[styles.quickReactionText, quickReaction === reaction && styles.quickReactionTextActive]}>
              {reaction}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Episode mood</Text>
      <View style={styles.reactionGrid}>
        {feelings.map((feeling) => (
          <Pressable
            key={feeling}
            style={[styles.reactionChip, selectedMood === feeling && styles.reactionChipActive]}
            onPress={() => setSelectedMood(feeling)}
          >
            <Text style={[styles.reactionChipText, selectedMood === feeling && styles.reactionChipActiveText]}>{feeling}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Spoiler comfort</Text>
      <View style={styles.characterRow}>
        {spoilerComforts.map((comfort) => (
          <Pressable
            key={comfort}
            style={[styles.characterPill, spoilerComfort === comfort && styles.characterPillActive]}
            onPress={() => setSpoilerComfort(comfort)}
          >
            <Text style={[styles.characterText, spoilerComfort === comfort && styles.characterTextActive]}>{comfort}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Favorite character</Text>
      <View style={styles.characterRow}>
        {characters.map((character) => (
          <Pressable
            key={character}
            style={[styles.characterPill, favoriteCharacter === character && styles.characterPillActive]}
            onPress={() => setFavoriteCharacter(character)}
          >
            <Text style={[styles.characterText, favoriteCharacter === character && styles.characterTextActive]}>{character}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Favorite moment</Text>
      <TextInput
        style={styles.favoriteMomentInput}
        value={favoriteMoment}
        onChangeText={setFavoriteMoment}
        placeholder="A line, twist, scene, or tiny detail..."
        placeholderTextColor={muted}
      />

      <Text style={styles.sectionTitle}>Private note</Text>
      <TextInput
        style={styles.reactionNoteInput}
        value={note}
        onChangeText={setNote}
        placeholder="What do you want to remember about this episode?"
        placeholderTextColor={muted}
        multiline
      />

      <View style={styles.reactionRecapCard}>
        <View>
          <Text style={styles.reactionSectionLabel}>Reaction recap</Text>
          <Text style={styles.reactionRecapTitle}>{quickReaction}</Text>
        </View>
        <View style={styles.reactionRecapScore}>
          <Star color={gold} fill={gold} size={16} />
          <Text style={styles.reactionRecapScoreText}>{rating}/5</Text>
        </View>
        <Text style={styles.reactionRecapBody}>
          {selectedMood} - {spoilerComfort} - {favoriteCharacter}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Spoiler-safe comments</Text>
      <Pressable style={styles.commentsPreview} onPress={onOpenCommunity}>
        <MessageCircle color={accent} size={22} />
        <View style={styles.commentsCopy}>
          <Text style={styles.commentsTitle}>Unlocked after watching</Text>
          <Text style={styles.commentsBody}>Join reactions from people who are exactly at this episode.</Text>
        </View>
        <Heart color={gold} size={20} />
      </Pressable>

      {saveMessage ? <Text style={styles.reactionSaveMessage}>{saveMessage}</Text> : null}
      <Pressable style={[styles.saveReactionButton, isSaving && styles.commentSubmitDisabled]} onPress={saveReaction} disabled={isSaving}>
        <Check color={bg} size={20} strokeWidth={3} />
        <Text style={styles.saveReactionText}>{isSaving ? 'Saving...' : 'Save reaction'}</Text>
      </Pressable>
    </View>
  );
}
