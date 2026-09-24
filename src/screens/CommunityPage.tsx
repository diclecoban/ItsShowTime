import { ArrowLeft, Flag, Heart, MessageCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ImageBackground, Pressable, Text, TextInput, View } from 'react-native';

import { EmptyState, MiniStat } from '../components';
import { accent, bg, gold, ink, muted } from '../theme';
import { styles } from '../styles';
import type { CommunityComment, CommunityContext } from '../types';

export function CommunityPage({
  context,
  communityComments,
  onBack,
  onSubmitComment,
  onToggleLike,
  onDeleteComment,
  onReportComment,
  onLoadReplies,
  onSubmitReply,
  onLoadMore,
  hasMoreComments,
}: {
  context: CommunityContext;
  communityComments: CommunityComment[];
  onBack: () => void;
  onSubmitComment: (body: string, mood: string) => Promise<void>;
  onToggleLike: (comment: CommunityComment) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onReportComment: (commentId: string) => Promise<void>;
  onLoadReplies: (commentId: string) => Promise<CommunityComment[]>;
  onSubmitReply: (comment: CommunityComment, body: string, mood: string) => Promise<void>;
  onLoadMore: () => Promise<void>;
  hasMoreComments: boolean;
}) {
  const moods = ['Reacted', 'Loved it', 'Shocked', 'Theory', 'Spoiler'];
  const [body, setBody] = useState('');
  const [mood, setMood] = useState(moods[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [openReplies, setOpenReplies] = useState<Record<string, CommunityComment[]>>({});
  const [replyBodyByComment, setReplyBodyByComment] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState('');

  const submitComment = async () => {
    const trimmedBody = body.trim();
    if (!trimmedBody || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmitComment(trimmedBody, mood);
      setBody('');
    } catch (commentError) {
      setError(commentError instanceof Error ? commentError.message : 'Could not post this comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleReplies = async (comment: CommunityComment) => {
    if (openReplies[comment.id]) {
      setOpenReplies((current) => {
        const next = { ...current };
        delete next[comment.id];
        return next;
      });
      return;
    }

    const replies = await onLoadReplies(comment.id);
    setOpenReplies((current) => ({ ...current, [comment.id]: replies }));
  };

  const submitReply = async (comment: CommunityComment) => {
    const trimmedBody = replyBodyByComment[comment.id]?.trim();
    if (!trimmedBody) return;

    await onSubmitReply(comment, trimmedBody, mood);
    const replies = await onLoadReplies(comment.id);
    setOpenReplies((current) => ({ ...current, [comment.id]: replies }));
    setReplyBodyByComment((current) => ({ ...current, [comment.id]: '' }));
    setReplyingTo('');
  };

  return (
    <View>
      <Pressable style={styles.detailBack} onPress={onBack}>
        <ArrowLeft color={ink} size={20} />
        <Text style={styles.detailBackText}>Back</Text>
      </Pressable>

      <ImageBackground
        source={{ uri: context.image }}
        style={styles.communityHero}
        imageStyle={styles.detailHeroImage}
        resizeMode="cover"
      >
        <View style={styles.detailShade}>
          <Text style={styles.detailMeta}>{context.kind === 'episode' ? 'Episode reactions' : 'Movie reactions'}</Text>
          <Text style={styles.detailTitle}>{context.title}</Text>
          <Text style={styles.detailBody}>{context.subtitle}</Text>
        </View>
      </ImageBackground>

      <View style={styles.communitySummary}>
        <MiniStat label="Mood" value="Loved" />
        <MiniStat label="Rating" value="4.7" />
        <MiniStat label="Replies" value="254" />
      </View>

      {!context.watched && (
        <View style={styles.spoilerLock}>
          <MessageCircle color={gold} size={28} />
          <Text style={styles.spoilerLockTitle}>Spoiler-safe lock</Text>
          <Text style={styles.spoilerLockBody}>
            Reactions stay hidden until this title is marked watched in your library.
          </Text>
        </View>
      )}

      {context.watched && (
        <>
          <View style={styles.commentComposer}>
            <TextInput
              style={styles.commentInput}
              value={body}
              onChangeText={setBody}
              placeholder="Write your reaction..."
              placeholderTextColor={muted}
              multiline
            />
            <View style={styles.commentMoodRow}>
              {moods.map((item) => (
                <Pressable key={item} onPress={() => setMood(item)}>
                  <Text style={[styles.commentMoodChip, mood === item && styles.commentMoodChipActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>
            {error ? <Text style={styles.commentError}>{error}</Text> : null}
            <Pressable
              style={[styles.commentSubmit, (!body.trim() || isSubmitting) && styles.commentSubmitDisabled]}
              onPress={submitComment}
              disabled={!body.trim() || isSubmitting}
            >
              <MessageCircle color={bg} size={17} />
              <Text style={styles.commentSubmitText}>{isSubmitting ? 'Posting...' : 'Post comment'}</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Top comments</Text>
          {communityComments.length ? (
            <View style={styles.commentList}>
              {communityComments.map((comment) => (
                <View key={comment.id} style={styles.commentCard}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>{comment.user.slice(0, 1)}</Text>
                  </View>
                  <View style={styles.commentCopy}>
                    <View style={styles.commentTop}>
                      <Text style={styles.commentUser}>{comment.user}</Text>
                      <Text style={styles.commentMood}>{comment.mood}</Text>
                    </View>
                    {comment.status === 'reported' && (
                      <Text style={styles.commentModerationText}>Under spoiler review</Text>
                    )}
                    {comment.isSpoiler && (
                      <Text style={styles.commentModerationText}>Spoiler marked</Text>
                    )}
                    <Text style={styles.commentText}>{comment.text}</Text>
                    <View style={styles.commentActionRow}>
                      <Pressable style={styles.commentActionButton} onPress={() => onToggleLike(comment)}>
                        <Heart
                          color={comment.likedByMe ? gold : muted}
                          fill={comment.likedByMe ? gold : 'transparent'}
                          size={15}
                        />
                        <Text style={styles.commentLikes}>{comment.likes} likes</Text>
                      </Pressable>
                      <Pressable style={styles.commentActionButton} onPress={() => toggleReplies(comment)}>
                        <MessageCircle color={muted} size={15} />
                        <Text style={styles.commentLikes}>
                          {openReplies[comment.id] ? 'Hide replies' : `${comment.replyCount ?? 0} replies`}
                        </Text>
                      </Pressable>
                      <Pressable style={styles.commentActionButton} onPress={() => setReplyingTo(replyingTo === comment.id ? '' : comment.id)}>
                        <Text style={styles.commentLikes}>Reply</Text>
                      </Pressable>
                      {comment.canDelete && (
                        <Pressable style={styles.commentActionButton} onPress={() => onDeleteComment(comment.id)}>
                          <Trash2 color={muted} size={15} />
                          <Text style={styles.commentLikes}>Delete</Text>
                        </Pressable>
                      )}
                      {comment.canReport && (
                        <Pressable style={styles.commentActionButton} onPress={() => onReportComment(comment.id)}>
                          <Flag color={muted} size={15} />
                          <Text style={styles.commentLikes}>Report</Text>
                        </Pressable>
                      )}
                    </View>
                    {replyingTo === comment.id ? (
                      <View style={styles.replyComposer}>
                        <TextInput
                          style={styles.replyInput}
                          value={replyBodyByComment[comment.id] ?? ''}
                          onChangeText={(value) => setReplyBodyByComment((current) => ({ ...current, [comment.id]: value }))}
                          placeholder={`Reply to ${comment.user}...`}
                          placeholderTextColor={muted}
                        />
                        <Pressable style={styles.replySubmit} onPress={() => submitReply(comment)}>
                          <Text style={styles.adminActionText}>Send</Text>
                        </Pressable>
                      </View>
                    ) : null}
                    {openReplies[comment.id]?.length ? (
                      <View style={styles.replyThread}>
                        {openReplies[comment.id].map((reply) => (
                          <View key={reply.id} style={styles.replyItem}>
                            <Text style={styles.commentUser}>{reply.user}</Text>
                            {reply.isSpoiler ? <Text style={styles.commentModerationText}>Spoiler marked</Text> : null}
                            <Text style={styles.commentText}>{reply.text}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
              {hasMoreComments ? (
                <Pressable style={styles.adminWideActionButton} onPress={onLoadMore}>
                  <Text style={styles.adminActionText}>Load more</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <EmptyState
              icon={MessageCircle}
              title="No comments yet"
              body="Start the conversation."
            />
          )}
        </>
      )}
    </View>
  );
}
