/**
 * Chat Detail Screen
 */

import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { createInputStyle, getCursorStyle } from '@/app/utils/platform-styles';
import { format, isToday, isYesterday } from 'date-fns';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'supporter';
  time: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  type?: 'text' | 'image' | 'voice' | 'system';
  attachmentUrl?: string;
}

const initialMessages: Message[] = [
  {
    id: '1',
    text: 'You are now connected with a peer. Remember to be respectful.',
    sender: 'supporter',
    time: new Date(Date.now() - 1000 * 60 * 60 * 2),
    type: 'system',
  },
  {
    id: '2',
    text: "Hi, I'm struggling with my classes.",
    sender: 'user',
    time: new Date(Date.now() - 1000 * 60 * 30),
    status: 'read',
    type: 'text',
  },
  {
    id: '3',
    text: "I understand. Let's talk about it. What's on your mind?",
    sender: 'supporter',
    time: new Date(Date.now() - 1000 * 60 * 29),
    type: 'text',
  },
  {
    id: '4',
    text: "Take your time. There's no rush. I'm here to listen whenever you're ready.",
    sender: 'supporter',
    time: new Date(Date.now() - 1000 * 60 * 25),
    type: 'text',
  },
];

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  useEffect(() => {
    // Simulate typing indicator
    const simulateTyping = () => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    };

    // Simulate supporter typing after user sends message
    if (messages.length > 0 && messages[messages.length - 1]?.sender === 'user') {
      const timer = setTimeout(simulateTyping, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  const formatMessageTime = (date: Date): string => {
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      time: new Date(),
      status: 'sending',
      type: 'text',
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    // Simulate sending status
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
        )
      );
    }, 500);

    // Simulate delivered status
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
        )
      );
    }, 1000);

    // Simulate read status and response
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: 'read' } : msg
        )
      );

      // Simulate typing indicator
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const response: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Thank you for sharing. How does that make you feel?',
          sender: 'supporter',
          time: new Date(),
          type: 'text',
        };
        setMessages((prev) => [...prev, response]);
      }, 2000);
    }, 2000);
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
    }, 1000);
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={[styles.headerAvatar, { backgroundColor: colors.secondary + '20' }]}>
            <Ionicons name="headset" size={20} color={colors.secondary} />
          </View>
          <View style={styles.headerInfo}>
            <ThemedText type="body" style={styles.headerTitle}>
              Peer Supporter
            </ThemedText>
            <ThemedText type="small" style={[styles.headerSubtitle, { color: colors.success }]}>
              Online
            </ThemedText>
          </View>
          <TouchableOpacity style={getCursorStyle()}>
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
            onPress={() => {
              // Handle attachment
              console.log('Attachment pressed');
            }}
          >
            <MaterialIcons name="attach-file" size={24} color={colors.icon} />
          </TouchableOpacity>
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
          />
          <TouchableOpacity
            style={[styles.emojiButton, { backgroundColor: colors.surface }]}
            onPress={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <MaterialIcons name="emoji-emotions" size={24} color={colors.icon} />
          </TouchableOpacity>
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
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});






