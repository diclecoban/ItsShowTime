import { ArrowLeft, Database, Flag, RefreshCw, Search, Trash2 } from 'lucide-react';
import { Pressable, Text, View } from 'react-native';

import { EmptyState, MiniStat } from '../components';
import { accent, bg, gold, ink } from '../theme';
import { styles } from '../styles';
import type { AdminSummary } from '../types';

export function AdminPage({
  summary,
  onBack,
  onRefresh,
  onRetryImport,
  onHideComment,
  onClearCache,
}: {
  summary: AdminSummary | null;
  onBack: () => void;
  onRefresh: () => void | Promise<void>;
  onRetryImport: (jobId: string) => void | Promise<void>;
  onHideComment: (commentId: string) => void | Promise<void>;
  onClearCache: (cacheId?: string) => void | Promise<void>;
}) {
  const importJobs = summary?.importJobs ?? [];
  const reports = summary?.reportedComments ?? [];
  const deletionRequests = summary?.deletionRequests ?? [];
  const cacheEntries = summary?.cacheEntries ?? [];

  return (
    <View>
      <Pressable style={styles.detailBack} onPress={onBack}>
        <ArrowLeft color={ink} size={20} />
        <Text style={styles.detailBackText}>Back to settings</Text>
      </Pressable>

      <View style={styles.listsHero}>
        <View>
          <Text style={styles.libraryKicker}>Operations</Text>
          <Text style={styles.libraryTitle}>Admin tools</Text>
          <Text style={styles.libraryBody}>Catalog imports, moderation, deletion requests, and search cache health.</Text>
        </View>
        <Pressable style={styles.createListButton} onPress={onRefresh}>
          <RefreshCw color={bg} size={21} />
        </Pressable>
      </View>

      <View style={styles.watchStats}>
        <MiniStat label="Import jobs" value={String(importJobs.length)} />
        <MiniStat label="Reports" value={String(reports.length)} />
        <MiniStat label="Cache" value={String(cacheEntries.length)} />
      </View>
      {summary?.support ? (
        <View style={styles.adminSupportCard}>
          <Text style={styles.customListTitle}>{summary.support.title}</Text>
          <Text style={styles.customListMeta}>
            {summary.support.openedIntents} support opens - {summary.support.currency}{' '}
            {(summary.support.currentAmountCents / 100).toFixed(0)} /{' '}
            {(summary.support.targetAmountCents / 100).toFixed(0)}
          </Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Catalog imports</Text>
      <View style={styles.customListStack}>
        {importJobs.map((job) => (
          <View key={job.id} style={styles.customListCard}>
            <View style={[styles.notificationIcon, { backgroundColor: job.status === 'failed' ? gold : accent }]}>
              <Database color={bg} size={19} />
            </View>
            <View style={styles.customListCopy}>
              <Text style={styles.customListTitle}>{job.title}</Text>
              <Text style={styles.customListMeta}>
                {job.source} - {job.status} - {job.attempts} attempts
              </Text>
              {job.error ? <Text style={styles.commentModerationText}>{job.error}</Text> : null}
            </View>
            <Pressable
              style={[styles.adminActionButton, job.status !== 'failed' && styles.adminActionButtonDisabled]}
              disabled={job.status !== 'failed'}
              onPress={() => onRetryImport(job.id)}
            >
              <RefreshCw color={bg} size={16} />
              <Text style={styles.adminActionText}>Retry</Text>
            </Pressable>
          </View>
        ))}
        {!importJobs.length && <EmptyState icon={Database} title="No import jobs yet" body="Live catalog imports will appear here." />}
      </View>

      <Text style={styles.sectionTitle}>Reported comments</Text>
      <View style={styles.customListStack}>
        {reports.map((comment) => (
          <View key={comment.id} style={styles.customListCard}>
            <View style={[styles.notificationIcon, { backgroundColor: gold }]}>
              <Flag color={bg} size={19} />
            </View>
            <View style={styles.customListCopy}>
              <Text style={styles.customListTitle}>{comment.title}</Text>
              <Text style={styles.customListMeta}>
                {comment.reportCount} reports - {comment.status}
              </Text>
              <Text style={styles.commentText}>{comment.body}</Text>
            </View>
            <Pressable
              style={[styles.adminActionButton, comment.status === 'hidden' && styles.adminActionButtonDisabled]}
              disabled={comment.status === 'hidden'}
              onPress={() => onHideComment(comment.id)}
            >
              <Trash2 color={bg} size={16} />
              <Text style={styles.adminActionText}>Hide</Text>
            </Pressable>
          </View>
        ))}
        {!reports.length && <EmptyState icon={Flag} title="No reported comments" body="Spoiler reports and moderation flags will land here." />}
      </View>

      <Text style={styles.sectionTitle}>Deletion requests</Text>
      <View style={styles.customListStack}>
        {deletionRequests.map((request) => (
          <View key={request.id} style={styles.customListCard}>
            <View style={[styles.notificationIcon, { backgroundColor: gold }]}>
              <Trash2 color={bg} size={19} />
            </View>
            <View style={styles.customListCopy}>
              <Text style={styles.customListTitle}>{request.processedAt ? 'Processed' : 'Pending deletion'}</Text>
              <Text style={styles.customListMeta}>{new Date(request.createdAt).toLocaleDateString('en-US')}</Text>
              {request.reason ? <Text style={styles.commentText}>{request.reason}</Text> : null}
            </View>
          </View>
        ))}
        {!deletionRequests.length && <EmptyState icon={Trash2} title="No deletion requests" body="Account deletion requests will appear here." />}
      </View>

      <Text style={styles.sectionTitle}>Search cache</Text>
      {cacheEntries.length ? (
        <Pressable style={styles.adminWideActionButton} onPress={() => onClearCache()}>
          <Trash2 color={bg} size={16} />
          <Text style={styles.adminActionText}>Clear all cache</Text>
        </Pressable>
      ) : null}
      <View style={styles.customListStack}>
        {cacheEntries.map((entry) => (
          <View key={entry.id} style={styles.customListCard}>
            <View style={[styles.notificationIcon, { backgroundColor: accent }]}>
              <Search color={bg} size={19} />
            </View>
            <View style={styles.customListCopy}>
              <Text style={styles.customListTitle}>{entry.query}</Text>
              <Text style={styles.customListMeta}>
                {entry.resultCount} results - expires {new Date(entry.expiresAt).toLocaleDateString('en-US')}
              </Text>
            </View>
            <Pressable style={styles.adminActionButton} onPress={() => onClearCache(entry.id)}>
              <Trash2 color={bg} size={16} />
              <Text style={styles.adminActionText}>Clear</Text>
            </Pressable>
          </View>
        ))}
        {!cacheEntries.length && <EmptyState icon={Search} title="Search cache is empty" body="TVmaze searches will populate this cache." />}
      </View>
    </View>
  );
}
