/**
 * Chat List Screen - Enhanced with unread, online status, last message preview
 */

import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { formatDistanceToNow, format } from 'date-fns';

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  time: Date;
  unread: number;
  isOnline?: boolean;
  lastMessageType?: 'text' | 'image' | 'voice' | 'system';
  avatar?: string;
}

// Mock data - in production, this would come from database
const mockChats: Chat[] = [
  {
    id: '1',
    name: 'Peer Supporter',
    lastMessage: 'Take your time. There\'s no rush. I\'m here to listen whenever you\'re ready.',
    time: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    unread: 0,
    isOnline: true,
    lastMessageType: 'text',
  },
  {
    id: '2',
    name: 'Support Team',
    lastMessage: 'We received your message. How can we help?',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24), // Yesterday
    unread: 2,
    isOnline: false,
    lastMessageType: 'text',
  },
  {
    id: '3',
    name: 'Counselor',
    lastMessage: '📎 Attachment: resource.pdf',
    time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    unread: 0,
    isOnline: true,
    lastMessageType: 'image',
  },
];

export default function ChatListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [chats, setChats] = useState<Chat[]>(mockChats);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // In production, subscribe to real-time chat updates
    // subscribeToChats((updatedChats) => setChats(updatedChats));
  }, []);

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, 'h:mm a');
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else if (diffInHours < 168) { // 7 days
      return format(date, 'EEE');
    } else {
      return format(date, 'MMM d');
    }
  };

  const getLastMessagePreview = (chat: Chat): string => {
    if (chat.lastMessageType === 'image') {
      return '📷 Photo';
    } else if (chat.lastMessageType === 'voice') {
      return '🎤 Voice message';
    } else if (chat.lastMessageType === 'system') {
      return chat.lastMessage;
    }
    return chat.lastMessage;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // In production, reload chats from database
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderChatItem = ({ item }: { item: Chat }) => (
    <TouchableOpacity
      style={[
        styles.chatItem,
        { 
          backgroundColor: item.unread > 0 ? colors.primary + '05' : colors.card,
        },
        createShadow(1, '#000', 0.05),
      ]}
      onPress={() => router.push(`/chat/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="headset" size={24} color={colors.primary} />
        </View>
        {item.isOnline && (
          <View style={[styles.onlineIndicator, { backgroundColor: colors.success }]} />
        )}
      </View>
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <ThemedText type="body" style={[styles.chatName, item.unread > 0 && { fontWeight: '700' }]}>
            {item.name}
          </ThemedText>
          <ThemedText type="small" style={[styles.chatTime, { color: colors.icon }]}>
            {formatTime(item.time)}
          </ThemedText>
        </View>
        <View style={styles.chatMessageRow}>
          <ThemedText 
            type="small" 
            style={[
              styles.chatMessage, 
              { color: item.unread > 0 ? colors.text : colors.icon },
              item.unread > 0 && { fontWeight: '600' },
            ]} 
            numberOfLines={1}
          >
            {getLastMessagePreview(item)}
          </ThemedText>
          {item.unread > 0 && (
            <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
          )}
        </View>
      </View>
      {item.unread > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 11 }}>
            {item.unread > 99 ? '99+' : item.unread}
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <ThemedText type="h2" style={styles.headerTitle}>
            Messages
          </ThemedText>
          <TouchableOpacity style={getCursorStyle()}>
            <MaterialIcons name="search" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color={colors.icon} />
              <ThemedText type="h3" style={styles.emptyTitle}>
                No Chats Yet
              </ThemedText>
              <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
                Start a conversation with a peer supporter or support team.
              </ThemedText>
            </View>
          }
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaTop: {
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
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontWeight: '700',
  },
  listContent: {
    padding: Spacing.md,
  },
  chatItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatContent: {
    flex: 1,
    minWidth: 0, // Allows text truncation
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  chatName: {
    fontWeight: '600',
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    marginLeft: Spacing.sm,
  },
  chatMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  chatMessage: {
    flex: 1,
    fontSize: 13,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    marginTop: Spacing.xxl,
  },
  emptyTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
});


