/**
 * Chat List Screen
 */

import { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';

const chats = [
  {
    id: '1',
    name: 'Peer Supporter',
    lastMessage: 'Take your time. There\'s no rush. I\'m here to listen whenever you\'re ready.',
    time: '10:42 AM',
    unread: 0,
  },
  {
    id: '2',
    name: 'Support Team',
    lastMessage: 'We received your message. How can we help?',
    time: 'Yesterday',
    unread: 2,
  },
];

export default function ChatListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const renderChatItem = ({ item }: { item: typeof chats[0] }) => (
    <TouchableOpacity
      style={[
        styles.chatItem,
        { backgroundColor: colors.card },
        createShadow(1, '#000', 0.05),
      ]}
      onPress={() => router.push(`/chat/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
        <Ionicons name="headset" size={24} color={colors.primary} />
      </View>
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <ThemedText type="body" style={styles.chatName}>
            {item.name}
          </ThemedText>
          <ThemedText type="small" style={styles.chatTime}>
            {item.time}
          </ThemedText>
        </View>
        <ThemedText type="small" style={styles.chatMessage} numberOfLines={2}>
          {item.lastMessage}
        </ThemedText>
      </View>
      {item.unread > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '700' }}>
            {item.unread}
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
      <ThemedView style={styles.container}>
        <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.icon} />
            <ThemedText type="h3" style={styles.emptyTitle}>
              No Chats Yet
            </ThemedText>
            <ThemedText type="body" style={styles.emptyText}>
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
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  chatName: {
    fontWeight: '600',
  },
  chatTime: {
    opacity: 0.6,
  },
  chatMessage: {
    opacity: 0.7,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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


