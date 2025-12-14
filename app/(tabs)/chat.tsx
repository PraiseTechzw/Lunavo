/**
 * Chat List Screen - Enhanced UI/UX with modern design
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Conversation } from '@/app/types';
import { createShadow } from '@/app/utils/platform-styles';
import { getConversations, getCurrentUser, getOnlineStatus, updateOnlineStatus } from '@/lib/database';
import { subscribeToConversations, subscribeToOnlineStatus, unsubscribe } from '@/lib/realtime';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { RealtimeChannel } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [chats, setChats] = useState<Conversation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const onlineStatusMap = useState<Map<string, boolean>>(new Map())[0];

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);
      
      // Update online status
      try {
        await updateOnlineStatus(user.id, true);
      } catch (error) {
        console.warn('Failed to update online status:', error);
      }

      // Load conversations
      const conversations = await getConversations(user.id);
      setChats(conversations);

      // Load online status for each conversation's supporter
      for (const conv of conversations) {
        if (conv.supporterId) {
          try {
            const isOnline = await getOnlineStatus(conv.supporterId);
            onlineStatusMap.set(conv.supporterId, isOnline);
          } catch (error) {
            console.warn('Failed to get online status:', error);
          }
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setLoading(false);
    }
  }, []);

  // Update online status when component mounts/unmounts
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const updateStatus = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          await updateOnlineStatus(user.id, true);
        }
      } catch (error) {
        console.warn('Failed to update online status:', error);
      }
    };

    updateStatus();
    // Update every 15 seconds
    intervalId = setInterval(updateStatus, 15000);

    return () => {
      clearInterval(intervalId);
      // Mark as offline when leaving
      getCurrentUser().then(user => {
        if (user) {
          updateOnlineStatus(user.id, false).catch(console.warn);
        }
      });
    };
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!currentUserId) return;

    let conversationChannel: RealtimeChannel | null = null;
    const onlineChannels: RealtimeChannel[] = [];

    // Subscribe to conversation updates
    conversationChannel = subscribeToConversations(currentUserId, (updatedConversation) => {
      setChats((prev) => {
        const index = prev.findIndex(c => c.id === updatedConversation.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = updatedConversation;
          // Re-sort by last message time
          return updated.sort((a, b) => {
            const aTime = a.lastMessageAt?.getTime() || 0;
            const bTime = b.lastMessageAt?.getTime() || 0;
            return bTime - aTime;
          });
        } else {
          // New conversation
          return [updatedConversation, ...prev].sort((a, b) => {
            const aTime = a.lastMessageAt?.getTime() || 0;
            const bTime = b.lastMessageAt?.getTime() || 0;
            return bTime - aTime;
          });
        }
      });
    });

    // Subscribe to online status for supporters in conversations
    chats.forEach(chat => {
      if (chat.supporterId) {
        const channel = subscribeToOnlineStatus(chat.supporterId, (isOnline) => {
          onlineStatusMap.set(chat.supporterId!, isOnline);
          setChats(prev => [...prev]); // Trigger re-render
        });
        onlineChannels.push(channel);
      }
    });

    return () => {
      if (conversationChannel) {
        unsubscribe(conversationChannel);
      }
      onlineChannels.forEach(channel => unsubscribe(channel));
    };
  }, [currentUserId, chats.length]);

  // Load conversations on focus
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  const formatTime = (date?: Date): string => {
    if (!date) return '';
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return format(date, 'h:mm a');
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else if (diffInHours < 168) { // 7 days
      return format(date, 'EEE');
    } else {
      return format(date, 'MMM d');
    }
  };

  const getChatName = (chat: Conversation): string => {
    if (chat.supporterPseudonym) {
      const roleName = chat.supporterRole?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Support';
      return chat.supporterPseudonym;
    }
    return chat.title || 'Support Team';
  };

  const getChatSubtitle = (chat: Conversation): string => {
    if (chat.supporterRole) {
      const roleName = chat.supporterRole.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return roleName;
    }
    return '';
  };

  const getLastMessagePreview = (chat: Conversation): string => {
    if (!chat.lastMessage) return 'Start a conversation...';
    
    // Check message type from content (simple detection)
    if (chat.lastMessage.includes('📷') || chat.lastMessage.includes('Photo')) {
      return '📷 Photo';
    } else if (chat.lastMessage.includes('🎤') || chat.lastMessage.includes('Voice')) {
      return '🎤 Voice message';
    } else if (chat.lastMessage.length > 60) {
      return chat.lastMessage.substring(0, 60) + '...';
    }
    return chat.lastMessage;
  };

  const getUnreadCount = (chat: Conversation, userId: string | null): number => {
    if (!userId) return 0;
    // Check if current user is the student or supporter
    const isStudent = chat.userId === userId;
    return isStudent ? chat.unreadCountUser : chat.unreadCountSupporter;
  };

  const isOnline = (chat: Conversation): boolean => {
    if (!chat.supporterId) return false;
    return onlineStatusMap.get(chat.supporterId) || false;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const renderChatItem = ({ item, index }: { item: Conversation; index: number }) => {
    const unreadCount = getUnreadCount(item, currentUserId);
    const supporterOnline = isOnline(item);

    return (
      <View>
        <TouchableOpacity
          style={[
            styles.chatItem,
            { 
              backgroundColor: unreadCount > 0 ? colors.primary + '08' : colors.card,
              borderLeftWidth: unreadCount > 0 ? 3 : 0,
              borderLeftColor: unreadCount > 0 ? colors.primary : 'transparent',
            },
            createShadow(2, '#000', 0.08),
          ]}
          onPress={() => router.push(`/chat/${item.id}`)}
          activeOpacity={0.6}
        >
          <View style={styles.avatarContainer}>
            <View style={[
              styles.avatar, 
              { 
                backgroundColor: supporterOnline 
                  ? colors.success + '20' 
                  : colors.primary + '15',
              }
            ]}>
              {supporterOnline ? (
                <Ionicons name="checkmark-circle" size={28} color={colors.success} />
              ) : (
                <Ionicons name="headset-outline" size={28} color={colors.primary} />
              )}
            </View>
            {supporterOnline && (
              <View style={[styles.onlineIndicator, { backgroundColor: colors.success }]} />
            )}
          </View>
          <View style={styles.chatContent}>
            <View style={styles.chatHeader}>
              <View style={styles.nameContainer}>
                <ThemedText 
                  type="body" 
                  style={[
                    styles.chatName, 
                    unreadCount > 0 && { fontWeight: '700', color: colors.text }
                  ]}
                  numberOfLines={1}
                >
                  {getChatName(item)}
                </ThemedText>
                {getChatSubtitle(item) && (
                  <ThemedText 
                    type="small" 
                    style={[styles.chatSubtitle, { color: colors.icon }]}
                  >
                    {getChatSubtitle(item)}
                  </ThemedText>
                )}
              </View>
              {item.lastMessageAt && (
                <ThemedText 
                  type="small" 
                  style={[
                    styles.chatTime, 
                    { 
                      color: unreadCount > 0 ? colors.primary : colors.icon,
                      fontWeight: unreadCount > 0 ? '600' : '400',
                    }
                  ]}
                >
                  {formatTime(item.lastMessageAt)}
                </ThemedText>
              )}
            </View>
            <View style={styles.chatMessageRow}>
              <ThemedText 
                type="small" 
                style={[
                  styles.chatMessage, 
                  { 
                    color: unreadCount > 0 ? colors.text : colors.icon,
                  },
                  unreadCount > 0 && { fontWeight: '600' },
                ]} 
                numberOfLines={2}
              >
                {getLastMessagePreview(item)}
              </ThemedText>
            </View>
          </View>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <ThemedText 
                type="small" 
                style={{ 
                  color: '#FFFFFF', 
                  fontWeight: '700', 
                  fontSize: 12,
                  lineHeight: 16,
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount.toString()}
              </ThemedText>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[
          styles.header, 
          { 
            backgroundColor: colors.background,
            borderBottomColor: colors.border || '#E0E0E0',
          }
        ]}>
          <View style={styles.headerContent}>
            <ThemedText type="h2" style={[styles.headerTitle, { color: colors.text }]}>
              Messages
            </ThemedText>
            <ThemedText type="small" style={[styles.headerSubtitle, { color: colors.icon }]}>
              {chats.length} {chats.length === 1 ? 'conversation' : 'conversations'}
            </ThemedText>
          </View>
          <TouchableOpacity 
            style={[styles.searchButton, { backgroundColor: colors.surface }]}
            onPress={() => {
              // TODO: Implement search
            }}
          >
            <MaterialIcons name="search" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText 
              type="body" 
              style={[styles.loadingText, { color: colors.icon }]}
            >
              Loading conversations...
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={chats}
            renderItem={renderChatItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              chats.length === 0 && styles.listContentEmpty
            ]}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface }]}>
                  <Ionicons name="chatbubbles-outline" size={64} color={colors.icon} />
                </View>
                <ThemedText type="h3" style={[styles.emptyTitle, { color: colors.text }]}>
                  No Conversations Yet
                </ThemedText>
                <ThemedText 
                  type="body" 
                  style={[styles.emptyText, { color: colors.icon }]}
                >
                  Start a conversation with a peer supporter or support team member.
                </ThemedText>
                <TouchableOpacity
                  style={[styles.newChatButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    // Navigate to new chat
                    router.push('/chat/new');
                  }}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <ThemedText 
                    type="body" 
                    style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: Spacing.xs }}
                  >
                    New Conversation
                  </ThemedText>
                </TouchableOpacity>
              </View>
            }
          />
        )}
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 24,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    opacity: 0.7,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow(1, '#000', 0.1),
  },
  listContent: {
    padding: Spacing.sm,
  },
  listContentEmpty: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  chatContent: {
    flex: 1,
    minWidth: 0,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  nameContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  chatName: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 2,
  },
  chatSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  chatTime: {
    fontSize: 12,
    marginTop: 2,
  },
  chatMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatMessage: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginLeft: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    flex: 1,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...createShadow(2, '#000', 0.1),
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...createShadow(2, '#000', 0.15),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
});
