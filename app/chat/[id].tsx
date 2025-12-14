/**
 * Chat Detail Screen - Full real-time integration with enhanced UI/UX
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Conversation, Message } from '@/app/types';
import { createInputStyle, createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import {
    createMessage,
    getConversation,
    getCurrentUser,
    getMessages,
    getOnlineStatus,
    getOrCreateConversation,
    markMessagesAsRead,
    setTypingIndicator,
    updateOnlineStatus
} from '@/lib/database';
import {
    subscribeToMessages,
    subscribeToMessageUpdates,
    subscribeToOnlineStatus,
    subscribeToTypingIndicators,
    unsubscribe,
} from '@/lib/realtime';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { RealtimeChannel } from '@supabase/supabase-js';
import { format, isToday, isYesterday } from 'date-fns';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [supporterOnline, setSupporterOnline] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const inputHeight = useRef(new Animated.Value(44)).current;

  // Load conversation and messages
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)' as any);
        }
        return;
      }

      setCurrentUserId(user.id);

      // Update online status
      try {
        await updateOnlineStatus(user.id, true);
      } catch (error) {
        console.warn('Failed to update online status:', error);
      }

      // Get or create conversation
      let conv: Conversation;
      if (id && id !== 'new') {
        conv = await getConversation(id);
      } else {
        conv = await getOrCreateConversation(user.id);
        router.replace(`/chat/${conv.id}`);
      }

      setConversation(conv);

      // Load messages
      const msgs = await getMessages(conv.id);
      setMessages(msgs);

      // Mark messages as read
      try {
        await markMessagesAsRead(conv.id, user.id);
      } catch (error) {
        console.warn('Failed to mark messages as read:', error);
      }

      // Check supporter online status
      if (conv.supporterId) {
        try {
          const isOnline = await getOnlineStatus(conv.supporterId);
          setSupporterOnline(isOnline);
        } catch (error) {
          console.warn('Failed to get online status:', error);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading chat:', error);
      setLoading(false);
    }
  }, [id, router]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!conversation || !currentUserId) return;

    // Clear previous channels
    channelsRef.current.forEach(channel => unsubscribe(channel));
    channelsRef.current = [];

    // Subscribe to new messages
    const messagesChannel = subscribeToMessages(conversation.id, (newMessage) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some(m => m.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });

      // Auto-scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Mark as read if current user received it
      if (newMessage.senderId !== currentUserId) {
        markMessagesAsRead(conversation.id, currentUserId).catch(console.warn);
      }
    });
    channelsRef.current.push(messagesChannel);

    // Subscribe to message updates (status changes)
    const updatesChannel = subscribeToMessageUpdates(conversation.id, ({ eventType, message }) => {
      if (eventType === 'UPDATE' && message) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === message.id ? message : msg))
        );
      } else if (eventType === 'DELETE' && message) {
        setMessages((prev) => prev.filter((msg) => msg.id !== message?.id));
      }
    });
    channelsRef.current.push(updatesChannel);

    // Subscribe to typing indicators
    const typingChannel = subscribeToTypingIndicators(conversation.id, (payload) => {
      if (payload && payload.userId !== currentUserId) {
        setIsTyping(payload.isTyping);
        setTypingUserId(payload.userId);
      } else {
        setIsTyping(false);
        setTypingUserId(null);
      }
    });
    channelsRef.current.push(typingChannel);

    // Subscribe to supporter online status
    if (conversation.supporterId) {
      const onlineChannel = subscribeToOnlineStatus(conversation.supporterId, (isOnline) => {
        setSupporterOnline(isOnline);
      });
      channelsRef.current.push(onlineChannel);
    }

    return () => {
      channelsRef.current.forEach(channel => unsubscribe(channel));
      channelsRef.current = [];
    };
  }, [conversation?.id, currentUserId]);

  // Update online status periodically
  useEffect(() => {
    if (!currentUserId) return;

    const intervalId = setInterval(async () => {
      try {
        await updateOnlineStatus(currentUserId, true);
      } catch (error) {
        console.warn('Failed to update online status:', error);
      }
    }, 15000);

    return () => {
      clearInterval(intervalId);
      updateOnlineStatus(currentUserId, false).catch(console.warn);
    };
  }, [currentUserId]);

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Auto-scroll when messages change
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length, isTyping]);

  const formatMessageTime = (date: Date): string => {
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !conversation || !currentUserId || sending) return;

    setSending(true);
    const messageText = inputText.trim();
    setInputText('');

    try {
      // Send typing indicator stop
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      try {
        await setTypingIndicator(conversation.id, currentUserId, false);
      } catch (error) {
        console.warn('Failed to set typing indicator:', error);
      }

      // Create message
      await createMessage({
        conversationId: conversation.id,
        senderId: currentUserId,
        content: messageText,
        messageType: 'text',
      });

      // Mark messages as read for current user
      try {
        await markMessagesAsRead(conversation.id, currentUserId);
      } catch (error) {
        console.warn('Failed to mark messages as read:', error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore input on error
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = async (text: string) => {
    setInputText(text);

    if (!conversation || !currentUserId) return;

    // Animate input height
    const height = text.length > 0 ? Math.min(44 + (text.split('\n').length - 1) * 20, 100) : 44;
    Animated.spring(inputHeight, {
      toValue: height,
      useNativeDriver: false,
    }).start();

    // Send typing indicator
    try {
      await setTypingIndicator(conversation.id, currentUserId, true);
    } catch (error) {
      console.warn('Failed to set typing indicator:', error);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing indicator after 3 seconds of no typing
    typingTimeoutRef.current = setTimeout(async () => {
      try {
        await setTypingIndicator(conversation.id, currentUserId, false);
      } catch (error) {
        console.warn('Failed to set typing indicator:', error);
      }
    }, 3000);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending':
        return <ActivityIndicator size="small" color={colors.icon} />;
      case 'sent':
        return <Ionicons name="checkmark" size={14} color={colors.icon} />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={14} color={colors.icon} />;
      case 'read':
        return <Ionicons name="checkmark-done" size={14} color={colors.primary} />;
      default:
        return null;
    }
  };

  const getChatName = (): string => {
    if (!conversation) return 'Chat';
    if (conversation.supporterPseudonym) {
      return conversation.supporterPseudonym;
    }
    return conversation.title || 'Support Team';
  };

  const getChatSubtitle = (): string => {
    if (!conversation || !conversation.supporterRole) return '';
    const roleName = conversation.supporterRole.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return roleName;
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    if (!currentUserId) return null;

    const isUser = item.senderId === currentUserId;
    const isSystem = item.messageType === 'system';
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showAvatar = !prevMessage || prevMessage.senderId !== item.senderId;
    const showTime = !prevMessage || 
      Math.abs(item.createdAt.getTime() - prevMessage.createdAt.getTime()) > 5 * 60 * 1000; // 5 minutes

    if (isSystem) {
      return (
        <View style={styles.systemMessageContainer}>
          <View style={[styles.systemMessageBubble, { backgroundColor: colors.surface }]}>
            <ThemedText type="small" style={[styles.systemMessage, { color: colors.icon }]}>
              {item.content}
            </ThemedText>
          </View>
        </View>
      );
    }

    return (
      <View>
        {showTime && (
          <View style={styles.timeDivider}>
            <View style={[styles.timeDividerLine, { backgroundColor: colors.border || '#E0E0E0' }]} />
            <ThemedText type="small" style={[styles.timeText, { color: colors.icon }]}>
              {formatMessageTime(item.createdAt)}
            </ThemedText>
            <View style={[styles.timeDividerLine, { backgroundColor: colors.border || '#E0E0E0' }]} />
          </View>
        )}
        <View
          style={[
            styles.messageContainer,
            isUser ? styles.userMessageContainer : styles.supporterMessageContainer,
          ]}
        >
          {!isUser && (
            <View style={styles.avatarContainer}>
              {showAvatar ? (
                <View style={[styles.avatar, { backgroundColor: colors.secondary + '20' }]}>
                  <Ionicons name="headset" size={20} color={colors.secondary} />
                </View>
              ) : (
                <View style={styles.avatarPlaceholder} />
              )}
            </View>
          )}
          <View
            style={[
              styles.messageBubble,
              {
                backgroundColor: isUser ? colors.primary : colors.surface,
                ...(isUser ? createShadow(2, colors.primary, 0.2) : createShadow(1, '#000', 0.1)),
              },
            ]}
          >
            {!isUser && showAvatar && (
              <ThemedText 
                type="small" 
                style={[styles.senderName, { color: colors.secondary }]}
              >
                {item.senderPseudonym || 'Support'}
              </ThemedText>
            )}
            <ThemedText
              type="body"
              style={[
                styles.messageText,
                { color: isUser ? '#FFFFFF' : colors.text },
              ]}
            >
              {item.content}
            </ThemedText>
            {isUser && item.status && (
              <View style={styles.messageStatus}>
                {getStatusIcon(item.status)}
              </View>
            )}
          </View>
          {isUser && (
            <View style={styles.avatarContainer}>
              {showAvatar ? (
                <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                </View>
              ) : (
                <View style={styles.avatarPlaceholder} />
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText 
            type="body" 
            style={[styles.loadingText, { color: colors.icon }]}
          >
            Loading conversation...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!conversation) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error || colors.primary} />
          <ThemedText type="h3" style={{ color: colors.text, marginTop: Spacing.md }}>
            Conversation not found
          </ThemedText>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/chat' as any);
              }
            }}
          >
            <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
              Go Back
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[
          styles.header, 
          { 
            backgroundColor: colors.background,
            borderBottomColor: colors.border || '#E0E0E0',
          }
        ]}>
          <TouchableOpacity 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/chat' as any);
              }
            }} 
            style={[styles.backButtonHeader, getCursorStyle()]}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerInfo}
            onPress={() => {
              // Could show supporter profile
            }}
            activeOpacity={0.7}
          >
            <View style={[
              styles.headerAvatar, 
              { 
                backgroundColor: supporterOnline 
                  ? colors.success + '20' 
                  : colors.secondary + '20' 
              }
            ]}>
              {supporterOnline ? (
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              ) : (
                <Ionicons name="headset" size={24} color={colors.secondary} />
              )}
            </View>
            <View style={styles.headerTextContainer}>
              <ThemedText type="body" style={[styles.headerTitle, { color: colors.text }]}>
                {getChatName()}
              </ThemedText>
              <View style={styles.headerStatusRow}>
                <View style={[
                  styles.statusDot, 
                  { backgroundColor: supporterOnline ? colors.success : colors.icon }
                ]} />
                <ThemedText 
                  type="small" 
                  style={[
                    styles.headerSubtitle, 
                    { color: supporterOnline ? colors.success : colors.icon }
                  ]}
                >
                  {supporterOnline ? 'Online' : 'Offline'}
                </ThemedText>
                {getChatSubtitle() && (
                  <>
                    <ThemedText type="small" style={{ color: colors.icon, marginHorizontal: 4 }}>
                      •
                    </ThemedText>
                    <ThemedText type="small" style={{ color: colors.icon }}>
                      {getChatSubtitle()}
                    </ThemedText>
                  </>
                )}
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={getCursorStyle()}
            onPress={() => {
              // Show options menu
            }}
          >
            <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item, index }) => renderMessage({ item, index })}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isTyping && typingUserId !== currentUserId ? (
              <View style={[styles.messageContainer, styles.supporterMessageContainer]}>
                <View style={[styles.avatar, { backgroundColor: colors.secondary + '20' }]}>
                  <Ionicons name="headset" size={20} color={colors.secondary} />
                </View>
                <View style={[styles.typingIndicator, { backgroundColor: colors.surface }]}>
                  <Animated.View style={[styles.typingDot, { backgroundColor: colors.icon }]} />
                  <Animated.View style={[styles.typingDot, { backgroundColor: colors.icon }]} />
                  <Animated.View style={[styles.typingDot, { backgroundColor: colors.icon }]} />
                </View>
              </View>
            ) : null
          }
        />

        {/* Input */}
        <View style={[
          styles.inputContainer, 
          { 
            backgroundColor: colors.background, 
            borderTopColor: colors.border || '#E0E0E0',
          }
        ]}>
          <TouchableOpacity
            style={[styles.attachButton, { backgroundColor: colors.surface }]}
            onPress={() => {
              // Handle attachment
              console.log('Attachment pressed');
            }}
          >
            <MaterialIcons name="attach-file" size={22} color={colors.icon} />
          </TouchableOpacity>
          <Animated.View style={{ flex: 1, height: inputHeight }}>
            <TextInput
              style={[
                styles.input,
                createInputStyle(),
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                },
              ]}
              placeholder="Type a message..."
              placeholderTextColor={colors.icon}
              value={inputText}
              onChangeText={handleTyping}
              multiline
              maxLength={500}
              editable={!sending}
              textAlignVertical="center"
            />
          </Animated.View>
          {inputText.trim() ? (
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={handleSend}
              disabled={sending}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.emojiButton, { backgroundColor: colors.surface }]}
              onPress={() => {
                // Handle emoji picker
                console.log('Emoji pressed');
              }}
            >
              <MaterialIcons name="emoji-emotions" size={22} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  backButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
  },
  backButtonHeader: {
    padding: Spacing.xs,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '600',
    fontSize: 16,
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  headerSubtitle: {
    fontSize: 12,
  },
  messagesContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  timeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  timeDividerLine: {
    flex: 1,
    height: 1,
  },
  timeText: {
    fontSize: 11,
    paddingHorizontal: Spacing.xs,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  systemMessageBubble: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  systemMessage: {
    fontSize: 12,
    textAlign: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  supporterMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    marginHorizontal: Spacing.xs,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    lineHeight: 20,
    fontSize: 15,
  },
  messageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    alignSelf: 'flex-end',
  },
  typingIndicator: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: 6,
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: Spacing.sm,
    alignItems: 'flex-end',
    gap: Spacing.sm,
    borderTopWidth: 1,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    maxHeight: 100,
    fontSize: 15,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
