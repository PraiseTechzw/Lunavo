/**
 * Notifications Center Screen
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Notification, NotificationType } from '@/app/types';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { getCurrentUser } from '@/lib/auth';
import { getNotifications, markNotificationAsRead } from '@/lib/database';
import { RealtimeChannel, subscribeToNotifications, subscribeToSystemNotifications, unsubscribe } from '@/lib/realtime';
import { MaterialIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | NotificationType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const notificationsChannelRef = useRef<RealtimeChannel | null>(null);
  const systemChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    loadNotifications();
    setupRealtimeSubscription();

    return () => {
      if (notificationsChannelRef.current) {
        unsubscribe(notificationsChannelRef.current);
      }
      if (systemChannelRef.current) {
        unsubscribe(systemChannelRef.current);
      }
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const allNotifications = await getNotifications(user.id);
      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const setupRealtimeSubscription = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const channel = subscribeToNotifications(user.id, (newNotification) => {
        setNotifications((prev) => [newNotification, ...prev]);
      });

      const sysChannel = subscribeToSystemNotifications((sysNotif) => {
        // Map system notification to Notification type
        const newNotif: Notification = {
          id: sysNotif.id,
          userId: user.id,
          type: 'system',
          title: sysNotif.title,
          message: sysNotif.message,
          data: sysNotif.data,
          read: false,
          createdAt: new Date(sysNotif.created_at || new Date()),
        };
        setNotifications((prev) => [newNotif, ...prev]);
      });

      notificationsChannelRef.current = channel;
      systemChannelRef.current = sysChannel;
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.data) {
      if (notification.type === 'reply' && notification.data.postId) {
        router.push(`/post/${notification.data.postId}`);
      } else if (notification.type === 'escalation' && notification.data.postId) {
        router.push(`/admin/escalations`);
      } else if (notification.type === 'meeting' && notification.data.meetingId) {
        // Navigate to meeting details
        router.push(`/meetings/${notification.data.meetingId}`);
      }
    }
  };

  const handleClearAll = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // Mark all as read
      const unreadNotifications = notifications.filter((n) => !n.read);
      await Promise.all(
        unreadNotifications.map((n) => markNotificationAsRead(n.id))
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'reply':
        return 'chat-bubble-outline';
      case 'escalation':
        return 'warning';
      case 'meeting':
        return 'event';
      case 'achievement':
        return 'emoji-events';
      case 'system':
        return 'info';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'reply':
        return '#3B82F6';
      case 'escalation':
        return '#EF4444';
      case 'meeting':
        return '#10B981';
      case 'achievement':
        return '#F59E0B';
      case 'system':
        return colors.icon;
      default:
        return colors.primary;
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        {
          backgroundColor: item.read ? colors.surface : colors.card,
          borderLeftColor: getNotificationColor(item.type),
        },
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: getNotificationColor(item.type) + '20' },
        ]}
      >
        <MaterialIcons
          name={getNotificationIcon(item.type) as any}
          size={24}
          color={getNotificationColor(item.type)}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.itemHeader}>
          <ThemedText
            type="body"
            style={[
              styles.title,
              { fontWeight: item.read ? '400' : '600', color: colors.text },
            ]}
          >
            {item.title}
          </ThemedText>
          {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
        </View>
        <ThemedText
          type="small"
          style={[styles.message, { color: colors.icon }]}
          numberOfLines={2}
        >
          {item.message}
        </ThemedText>
        <ThemedText
          type="small"
          style={[styles.time, { color: colors.icon }]}
        >
          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  const filterOptions: Array<{ id: 'all' | NotificationType; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'reply', label: 'Replies' },
    { id: 'escalation', label: 'Escalations' },
    { id: 'meeting', label: 'Meetings' },
    { id: 'achievement', label: 'Achievements' },
    { id: 'system', label: 'System' },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={getCursorStyle()}
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="h2" style={styles.headerTitle}>
              Notifications
            </ThemedText>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              style={getCursorStyle()}
            >
              <ThemedText type="small" style={{ color: colors.primary }}>
                Clear All
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            data={filterOptions}
            renderItem={({ item }) => {
              const isSelected = filter === item.id;
              return (
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : colors.surface,
                    },
                  ]}
                  onPress={() => setFilter(item.id)}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    type="small"
                    style={{
                      color: isSelected ? '#FFFFFF' : colors.text,
                      fontWeight: '600',
                    }}
                  >
                    {item.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          />
        </View>

        {/* Notifications List */}
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons
                name="notifications-none"
                size={64}
                color={colors.icon}
              />
              <ThemedText
                type="body"
                style={[styles.emptyText, { color: colors.icon }]}
              >
                No notifications yet
              </ThemedText>
            </View>
          }
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 20,
  },
  filtersContainer: {
    marginBottom: Spacing.md,
  },
  filtersContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 80,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    ...createShadow(1, '#000', 0.05),
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  title: {
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: Spacing.xs,
    marginTop: 4,
  },
  message: {
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
  time: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    marginTop: Spacing.xxl,
  },
  emptyText: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});


