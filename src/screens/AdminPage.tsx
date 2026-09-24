import { Activity, ArrowLeft, Database, Flag, Gauge, Pause, RefreshCw, Search, ShieldAlert, Trash2 } from 'lucide-react';
import { Pressable, Text, View } from 'react-native';

import { BackendState, EmptyState, MiniStat } from '../components';
import { accent, bg, gold, ink } from '../theme';
import { styles } from '../styles';
import type { AdminSummary, CrisisControl } from '../types';

export function AdminPage({
  summary,
  onBack,
  onRefresh,
  onRetryImport,
  onHideComment,
  onClearCache,
  onRunMaintenance,
  onSetCrisisControl,
  isLoading,
  error,
}: {
  summary: AdminSummary | null;
  onBack: () => void;
  onRefresh: () => void | Promise<void>;
  onRetryImport: (jobId: string) => void | Promise<void>;
  onHideComment: (commentId: string) => void | Promise<void>;
  onClearCache: (cacheId?: string) => void | Promise<void>;
  onRunMaintenance: () => void | Promise<void>;
  onSetCrisisControl: (config: CrisisControl, incidentMessage: string) => void | Promise<void>;
  isLoading?: boolean;
  error?: string;
}) {
  const importJobs = summary?.importJobs ?? [];
  const reports = summary?.reportedComments ?? [];
  const deletionRequests = summary?.deletionRequests ?? [];
  const cacheEntries = summary?.cacheEntries ?? [];
  const operations = summary?.operations;
  const edgeEvents = summary?.edgeEvents ?? [];
  const tableGrowth = summary?.tableGrowth ?? [];
  const crisisControl = summary?.crisisControl;
  const incidents = summary?.incidents ?? [];

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

      {isLoading ? (
        <BackendState title="Loading admin health" body="Queue, cache, and Edge Function metrics are being refreshed." />
      ) : null}
      {error ? (
        <BackendState
          mode="error"
          title="Admin health could not load"
          body={error}
          onRetry={onRefresh}
        />
      ) : null}

      <View style={styles.watchStats}>
        <MiniStat label="Failed jobs" value={String(operations?.failedJobs ?? 0)} />
        <MiniStat label="Queue backlog" value={String((operations?.pendingJobs ?? 0) + (operations?.processingJobs ?? 0))} />
        <MiniStat label="Cache hit rate" value={`${operations?.cacheHitRate24h ?? 0}%`} />
      </View>
      <View style={styles.watchStats}>
        <MiniStat label="Search avg" value={`${operations?.avgSearchMs24h ?? 0}ms`} />
        <MiniStat label="Import avg" value={`${operations?.avgImportMs24h ?? 0}ms`} />
        <MiniStat label="Edge errors" value={String(operations?.edgeErrors24h ?? 0)} />
      </View>
      <View style={styles.watchStats}>
        <MiniStat label="Expired cache" value={String(operations?.expiredCacheEntries ?? 0)} />
        <MiniStat label="Old logs" value={String(operations?.oldEdgeEvents ?? 0)} />
        <MiniStat label="Old deliveries" value={String(operations?.oldDeliveries ?? 0)} />
      </View>
      <Pressable style={styles.adminWideActionButton} onPress={onRunMaintenance}>
        <Trash2 color={bg} size={16} />
        <Text style={styles.adminActionText}>Run database cleanup</Text>
      </Pressable>

      {crisisControl ? (
        <>
          <Text style={styles.sectionTitle}>Emergency controls</Text>
          <View style={styles.adminEmergencyPanel}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.customListTitle}>Mode: {crisisControl.mode}</Text>
                <Text style={styles.customListMeta}>{crisisControl.message || 'All systems are operating normally.'}</Text>
              </View>
              <ShieldAlert color={gold} size={22} />
            </View>
            <View style={styles.adminEmergencyGrid}>
              <Pressable
                style={styles.adminActionButton}
                onPress={() =>
                  onSetCrisisControl(
                    { ...crisisControl, mode: 'normal', message: '', features: { ...crisisControl.features, externalSearch: true, catalogImport: true, communityWrites: true, notifications: true, realtime: true, newSignups: true, queueWorkers: true } },
                    'Recovered to normal mode.'
                  )
                }
              >
                <RefreshCw color={bg} size={16} />
                <Text style={styles.adminActionText}>Normal</Text>
              </Pressable>
              <Pressable
                style={styles.adminActionButton}
                onPress={() =>
                  onSetCrisisControl(
                    { ...crisisControl, mode: 'degraded', message: 'Some features are temporarily limited while we stabilize the app.', features: { ...crisisControl.features, realtime: false } },
                    'Degraded mode enabled.'
                  )
                }
              >
                <Gauge color={bg} size={16} />
                <Text style={styles.adminActionText}>Degraded</Text>
              </Pressable>
              <Pressable
                style={styles.adminActionButton}
                onPress={() =>
                  onSetCrisisControl(
                    { ...crisisControl, mode: 'readonly', message: 'Read-only mode is active. Writes are temporarily paused.', features: { ...crisisControl.features, catalogImport: false, communityWrites: false, notifications: false, queueWorkers: false } },
                    'Read-only mode enabled.'
                  )
                }
              >
                <Pause color={bg} size={16} />
                <Text style={styles.adminActionText}>Read-only</Text>
              </Pressable>
              <Pressable
                style={styles.adminActionButton}
                onPress={() =>
                  onSetCrisisControl(
                    { ...crisisControl, mode: 'maintenance', message: 'It’s Showtime is in maintenance mode. Your watch data is safe.', features: { ...crisisControl.features, externalSearch: false, catalogImport: false, communityWrites: false, notifications: false, realtime: false, newSignups: false, queueWorkers: false } },
                    'Maintenance mode enabled.'
                  )
                }
              >
                <ShieldAlert color={bg} size={16} />
                <Text style={styles.adminActionText}>Maintenance</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Incident log</Text>
          <View style={styles.customListStack}>
            {incidents.map((incident) => (
              <View key={incident.id} style={styles.customListCard}>
                <View style={[styles.notificationIcon, { backgroundColor: incident.severity === 'critical' ? gold : accent }]}>
                  <ShieldAlert color={bg} size={19} />
                </View>
                <View style={styles.customListCopy}>
                  <Text style={styles.customListTitle}>{incident.message}</Text>
                  <Text style={styles.customListMeta}>{incident.severity} - {incident.action}</Text>
                  <Text style={styles.commentModerationText}>{new Date(incident.createdAt).toLocaleString('en-US')}</Text>
                </View>
              </View>
            ))}
            {!incidents.length && <EmptyState icon={ShieldAlert} title="No incidents yet" body="Emergency mode changes will appear here." />}
          </View>
        </>
      ) : null}
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

      <Text style={styles.sectionTitle}>Table growth</Text>
      <View style={styles.customListStack}>
        {tableGrowth.map((table) => (
          <View key={table.tableName} style={styles.customListCard}>
            <View style={[styles.notificationIcon, { backgroundColor: accent }]}>
              <Database color={bg} size={19} />
            </View>
            <View style={styles.customListCopy}>
              <Text style={styles.customListTitle}>{table.tableName}</Text>
              <Text style={styles.customListMeta}>{table.rowCount.toLocaleString('en-US')} rows</Text>
            </View>
          </View>
        ))}
        {!tableGrowth.length && <EmptyState icon={Database} title="No table metrics yet" body="Growth metrics will appear after admin summary refreshes." />}
      </View>

      <Text style={styles.sectionTitle}>Edge health</Text>
      <View style={styles.customListStack}>
        {edgeEvents.map((event) => (
          <View key={event.id} style={styles.customListCard}>
            <View style={[styles.notificationIcon, { backgroundColor: event.eventType === 'error' ? gold : accent }]}>
              {event.durationMs && event.durationMs >= 1000 ? <Gauge color={bg} size={19} /> : <Activity color={bg} size={19} />}
            </View>
            <View style={styles.customListCopy}>
              <Text style={styles.customListTitle}>{event.functionName}</Text>
              <Text style={styles.customListMeta}>
                {event.eventType} - {event.statusCode ?? 'n/a'} - {event.durationMs ?? 0}ms
              </Text>
              <Text style={styles.commentModerationText}>{new Date(event.createdAt).toLocaleString('en-US')}</Text>
            </View>
          </View>
        ))}
        {!edgeEvents.length && <EmptyState icon={Activity} title="No Edge events yet" body="Search and import events will appear here after live usage." />}
      </View>

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
