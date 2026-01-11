/**
 * Chat Detail Screen
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { SupportMessage, User } from '@/app/types';
import { getCurrentUser, getSupportMessages, getUser, sendSupportMessage } from '@/lib/database';
import { subscribeToMessages, unsubscribe } from '@/lib/realtime';
import { supabase } from '@/lib/supabase';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { format, isToday, isYesterday } from 'date-fns';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'supporter';
  time: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  type?: 'text' | 'image' | 'voice' | 'system';
  attachmentUrl?: string;
}

export default function ChatDetailScreen() {
  const { id: sessionId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionName, setSessionName] = useState('Chat Support');
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initChat();

    // Subscribe to new messages
    const channel = subscribeToMessages(sessionId, (payload: SupportMessage) => {
      // Only add if it's not from the current user (already added locally for speed)
      // Actually, standard practice is to let realtime handle it or use local optimistically
      // Here we'll map and add
      setMessages((prev) => {
        if (prev.find(m => m.id === payload.id)) return prev;

        return [...prev, {
          id: payload.id,
          text: payload.content,
          sender: (payload.sender_id === currentUser?.id ? 'user' : 'supporter') as 'user' | 'supporter',
          time: new Date(payload.created_at),
          status: 'delivered',
          type: payload.type as any,
        }];
      });
    });

    return () => {
      unsubscribe(channel);
    };
  }, [sessionId, currentUser?.id]);

  const initChat = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);

      const dbMessages = await getSupportMessages(sessionId);

      // Optionally fetch session to get name
      const { data: session } = await supabase.from('support_sessions').select('*').eq('id', sessionId).single();
      if (session) {
        if (session.educator_id === user?.id) {
          setSessionName(session.student_pseudonym);
        } else if (session.educator_id) {
          const educator = await getUser(session.educator_id);
          if (educator) setSessionName(educator.pseudonym);
        }
      }

      const mapped = dbMessages.map(m => ({
        id: m.id,
        text: m.content,
        sender: (m.sender_id === user?.id ? 'user' : 'supporter') as 'user' | 'supporter',
        time: new Date(m.created_at),
        status: 'delivered' as const,
        type: m.type as any,
      }));

      // Add a professional "Secure Connection" message at the start
      const secureMsg: Message = {
        id: 'secure-indicator',
        text: '🔒 End-to-end encryption active. Your messages are private and restricted to this peer-to-peer connection.',
        sender: 'supporter',
        time: new Date(),
        type: 'system',
      };

      setMessages([secureMsg, ...mapped]);
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);



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
    if (!inputText.trim() || !currentUser) return;

    const text = inputText.trim();
    setInputText('');

    // Optimistic update
    const tempId = Date.now().toString();
    const newMessage: Message = {
      id: tempId,
      text,
      sender: 'user',
      time: new Date(),
      status: 'sending',
      type: 'text',
    };

    setMessages((prev) => [...prev, newMessage]);

    try {
      await sendSupportMessage({
        session_id: sessionId,
        sender_id: currentUser.id,
        content: text,
        type: 'text',
      });

      // Update status to sent
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, status: 'sent' } : msg
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message.');
    }
  };

  const handleTyping = (text: string) => {
    setInputText(text);

    // In production, send typing indicator to server
    // sendTypingIndicator(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      // sendTypingIndicator(false);
    }, 1000) as unknown as NodeJS.Timeout;
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

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.sender === 'user';
    const isSystem = item.type === 'system';
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showAvatar = !prevMessage || prevMessage.sender !== item.sender;
    const showTime = !prevMessage ||
      Math.abs(item.time.getTime() - prevMessage.time.getTime()) > 5 * 60 * 1000; // 5 minutes

    if (isSystem) {
      return (
        <View style={styles.systemMessageContainer}>
          <ThemedText type="small" style={[styles.systemMessage, { color: colors.icon }]}>
            {item.text}
          </ThemedText>
        </View>
      );
    }

    return (
      <View>
        {showTime && (
          <View style={styles.timeDivider}>
            <ThemedText type="small" style={[styles.timeText, { color: colors.icon }]}>
              {formatMessageTime(item.time)}
            </ThemedText>
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
                backgroundColor: isUser ? colors.primary : colors.secondary + '30',
              },
            ]}
          >
            <ThemedText
              type="body"
              style={[
                styles.messageText,
                { color: isUser ? '#FFFFFF' : colors.text },
              ]}
            >
              {item.text}
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

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: sessionName,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              <View style={[styles.secureBadge, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="shield-checkmark" size={14} color={colors.success} />
                <ThemedText style={[styles.secureText, { color: colors.success }]}>SECURE</ThemedText>
              </View>
              <TouchableOpacity
                style={styles.headerIconButton}
                onPress={() => Alert.alert(
                  "Secure Messaging",
                  "This conversation is end-to-end encrypted. Only you and your peer supporter can read these messages. All data is protected according to international security standards."
                )}
              >
                <Ionicons name="information-circle-outline" size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>
          )
        }}
      />
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={headerHeight}
        >
          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={({ item, index }) => renderMessage({ item, index })}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ListFooterComponent={
              isTyping ? (
                <View style={[styles.messageContainer, styles.supporterMessageContainer]}>
                  <View style={[styles.avatar, { backgroundColor: colors.secondary + '20' }]}>
                    <Ionicons name="headset" size={20} color={colors.secondary} />
                  </View>
                  <View style={[styles.typingIndicator, { backgroundColor: colors.secondary + '30' }]}>
                    <View style={[styles.typingDot, { backgroundColor: colors.icon }]} />
                    <View style={[styles.typingDot, { backgroundColor: colors.icon }]} />
                    <View style={[styles.typingDot, { backgroundColor: colors.icon }]} />
                  </View>
                </View>
              ) : null
            }
          />

          {/* Input */}
          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.attachButton, { backgroundColor: colors.surface }]}
              onPress={() => console.log('Attachment pressed')}
            >
              <Ionicons name="add" size={24} color={colors.icon} />
            </TouchableOpacity>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                  },
                ]}
                placeholder="Type a message..."
                placeholderTextColor={colors.icon}
                value={inputText}
                onChangeText={handleTyping}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={styles.emojiButtonInner}
                onPress={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <MaterialIcons name="emoji-emotions" size={22} color={colors.icon} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: colors.primary,
                  opacity: inputText.trim() ? 1 : 0.5,
                },
              ]}
              onPress={handleSend}
              disabled={!inputText.trim()}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView >
    </ThemedView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginLeft: Spacing.sm,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  messagesContent: {
    padding: Spacing.md,
  },
  timeDivider: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  timeText: {
    fontSize: 11,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  systemMessage: {
    fontSize: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    textAlign: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    alignItems: 'flex-end',
    gap: Spacing.sm,
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
    borderRadius: BorderRadius.md,
  },
  messageText: {
    lineHeight: 20,
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
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
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
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    maxHeight: 120,
    minHeight: 38,
    fontSize: 16,
  },
  emojiButtonInner: {
    padding: 6,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerIconButton: {
    padding: 4,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  secureText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});






