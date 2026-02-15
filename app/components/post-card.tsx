/**
 * Post card component for displaying posts in the feed
 */

import { CATEGORIES } from '@/app/constants/categories';
import { Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Post, PostCategory } from '@/app/types';
import { getCursorStyle } from '@/app/utils/platform-styles';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

// Generate consistent color for avatar based on post ID
const getAvatarColor = (id: string): string => {
  const colors = ['#CDB4DB', '#BDE0FE', '#A2D2FF', '#FFC8DD', '#FFAFCC'];
  const index = id.charCodeAt(0) % colors.length;
  return colors[index];
};

interface PostCardProps {
  post: Post;
  onPress: () => void;
}

export function PostCard({ post, onPress }: PostCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const isEscalated = post.escalationLevel !== 'none';
  const replyCount = post.replies?.length || 0;
  const likeCount = post.upvotes || 0;
  const avatarColor = getAvatarColor(post.id);

  // Get category info from constants
  const categoryData = CATEGORIES[post.category as PostCategory] || CATEGORIES.general || {
    name: 'Peer Circle',
    color: colors.primary,
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }).replace('about ', '');

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[getCursorStyle(), styles.container]}
    >
      <ThemedView
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderLeftColor: isEscalated ? colors.danger : colors.border,
          },
        ]}
      >
        {isEscalated && (
          <View style={[styles.escalationStrip, { backgroundColor: colors.danger }]} />
        )}

        <View style={styles.cardContent}>
          <View style={styles.header}>
            <View style={styles.authorRow}>
              <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                <ThemedText style={styles.avatarText}>
                  {post.authorPseudonym?.[0]?.toUpperCase() || 'A'}
                </ThemedText>
              </View>
              <View style={styles.authorInfo}>
                <ThemedText type="defaultSemiBold" style={styles.authorName}>
                  {post.authorPseudonym || 'Anonymous'}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  {timeAgo}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.categoryBadge, { backgroundColor: categoryData.color + '15' }]}>
              <ThemedText style={[styles.categoryText, { color: categoryData.color }]}>
                {categoryData.name}
              </ThemedText>
            </View>
          </View>

          <View style={styles.body}>
            <ThemedText type="subtitle" numberOfLines={2} style={styles.title}>
              {post.title}
            </ThemedText>
            <ThemedText
              type="default"
              numberOfLines={3}
              style={[styles.previewText, { color: colors.text + 'CC' }]}
            >
              {post.content}
            </ThemedText>
          </View>

          <View style={[styles.footer, { borderTopColor: colors.border + '40' }]}>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Ionicons name="chatbubble-outline" size={18} color={colors.icon} />
                <ThemedText style={[styles.statText, { color: colors.icon }]}>
                  {replyCount} {replyCount === 1 ? 'Reply' : 'Replies'}
                </ThemedText>
              </View>
              <View style={styles.stat}>
                <Ionicons name="heart-outline" size={18} color={colors.icon} />
                <ThemedText style={[styles.statText, { color: colors.icon }]}>
                  {likeCount}
                </ThemedText>
              </View>
            </View>

            <View style={styles.readMore}>
              <ThemedText style={[styles.readMoreText, { color: colors.primary }]}>Read Thread</ThemedText>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </View>
          </View>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    ...PlatformStyles.premiumShadow,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  escalationStrip: {
    height: 4,
    width: '100%',
  },
  cardContent: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  authorInfo: {
    gap: 2,
  },
  authorName: {
    fontSize: 15,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  body: {
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: 6,
    lineHeight: 24,
  },
  previewText: {
    lineHeight: 22,
    fontSize: 15,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: '700',
  }
});

