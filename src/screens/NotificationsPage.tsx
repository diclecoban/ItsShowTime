import { ArrowLeft, Bell, Check } from 'lucide-react';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { EmptyState, FilterChips } from '../components';
import { bg, ink } from '../theme';
import { styles } from '../styles';
import type { NotificationItem } from '../types';

export function NotificationsPage({
  notifications,
  onBack,
  onMarkAllRead,
  onToggleRead,
}: {
  notifications: NotificationItem[];
  onBack: () => void;
  onMarkAllRead: () => void;
  onToggleRead: (id: string) => void;
}) {
  const [activeFilter, setActiveFilter] = useState('All');
  const unreadCount = notifications.filter((notification) => notification.unread).length;
  const filteredNotifications = notifications.filter((notification) => {
    if (activeFilter === 'Unread') {
      return notification.unread;
    }

    if (activeFilter === 'Replies') {
      return notification.type === 'Reply';
    }

    return true;
  });
  const filterCounts = {
    All: notifications.length,
    Unread: unreadCount,
    Replies: notifications.filter((notification) => notification.type === 'Reply').length,
  };

  return (
    <View>
      <Pressable style={styles.detailBack} onPress={onBack}>
        <ArrowLeft color={ink} size={20} />
        <Text style={styles.detailBackText}>Back</Text>
      </Pressable>

      <View style={styles.notificationsHero}>
        <View>
          <Text style={styles.libraryKicker}>Activity</Text>
          <Text style={styles.libraryTitle}>{unreadCount} unread updates</Text>
          <Text style={styles.libraryBody}>Premieres, reminders, badges, and spoiler-safe replies in one place.</Text>
        </View>
        <View style={styles.notificationsBell}>
          <Bell color={bg} size={24} />
          {unreadCount > 0 && <View style={styles.notificationBellDot} />}
        </View>
      </View>

      <Pressable style={styles.markAllReadButton} onPress={onMarkAllRead}>
        <Check color={bg} size={17} strokeWidth={3} />
        <Text style={styles.markAllReadText}>Mark all as read</Text>
      </Pressable>

      <View style={styles.notificationTabs}>
        {['All', 'Unread', 'Replies'].map((filter) => (
          <Pressable key={filter} onPress={() => setActiveFilter(filter)}>
            <Text style={activeFilter === filter ? styles.notificationTabActive : styles.notificationTab}>
              {filter} {filterCounts[filter as keyof typeof filterCounts]}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.notificationList}>
        {filteredNotifications.map(({ id, type, title, body, time, unread, icon: Icon, tone }) => (
          <View key={`${type}-${title}`} style={[styles.notificationCard, unread && styles.notificationCardUnread]}>
            {unread && <View style={styles.notificationAccentBar} />}
            <View style={[styles.notificationIcon, { backgroundColor: tone }]}>
              <Icon color={bg} size={20} />
            </View>
            <View style={styles.notificationCopy}>
              <View style={styles.notificationTop}>
                <Text style={styles.notificationType}>{type}</Text>
                <Text style={styles.notificationTime}>{time}</Text>
              </View>
              <Text style={styles.notificationTitle}>{title}</Text>
              <Text style={styles.notificationBody}>{body}</Text>
            </View>
            <Pressable
              style={[styles.notificationReadButton, !unread && styles.notificationReadButtonDone]}
              onPress={() => onToggleRead(id)}
            >
              <Text style={[styles.notificationReadText, !unread && styles.notificationReadTextDone]}>
                {unread ? 'Read' : 'Unread'}
              </Text>
            </Pressable>
            {unread && <View style={styles.unreadDot} />}
          </View>
        ))}
        {filteredNotifications.length === 0 && (
          <EmptyState
            icon={Bell}
            title={`No ${activeFilter.toLowerCase()} notifications`}
            body="When your shows, lists, and comments need attention, they will appear here."
            action="All caught up"
          />
        )}
      </View>
    </View>
  );
}
