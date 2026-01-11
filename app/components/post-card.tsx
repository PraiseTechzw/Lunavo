/**
 * Post card component for displaying posts in the feed
 */

import { CATEGORIES } from '@/app/constants/categories';
import { Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Post, PostCategory } from '@/app/types';
import { getCursorStyle } from '@/app/utils/platform-styles';
import { MaterialIcons } from '@expo/vector-icons';
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
  const category = CATEGORIES[post.category as PostCategory] || CATEGORIES.general;
  // Use category color for background with low opacity, and full color for text
  const categoryBgColor = category.color + '15'; // 15 = ~8% opacity
  const categoryTextColor = category.color;

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
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: avatarColor + '30' }]}>
              <ThemedText style={[styles.avatarText, { color: avatarColor }]}>
                {post.authorPseudonym?.[0]?.toUpperCase() || 'A'}
              </ThemedText>
            </View>
            <View>
              <ThemedText type="body" style={styles.userName}>
                {post.authorPseudonym || 'Anonymous Student'}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                just now
              </ThemedText>
            </View>
          </View>

          <View style={[styles.categoryBadge, { backgroundColor: categoryBgColor }]}>
            <ThemedText style={[styles.categoryText, { color: categoryTextColor }]}>
              {category.name}
            </ThemedText>
          </View>
        </View>

        <View style={styles.cardBody}>
          <ThemedText type="h3" style={styles.title}>
            {post.title}
          </ThemedText>

          <ThemedText type="body" numberOfLines={3} style={[styles.content, { color: colors.text + 'CC' }]}>
            {post.content}
          </ThemedText>
        </View>

        <View style={[styles.cardFooter, { borderTopColor: colors.border + '30' }]}>
          <View style={styles.engagement}>
            <TouchableOpacity style={styles.engagementItem}>
              <View style={[styles.iconCircle, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="favorite-border" size={16} color={colors.icon} />
              </View>
              <ThemedText style={styles.engagementText}>
                {likeCount}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.engagementItem}>
              <View style={[styles.iconCircle, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="chat-bubble-outline" size={16} color={colors.icon} />
              </View>
              <ThemedText style={styles.engagementText}>
                {replyCount}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.shareIcon}>
            <MaterialIcons name="share" size={18} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  userName: {
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: -0.2,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  cardBody: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  title: {
    marginBottom: 6,
    fontWeight: '800',
    fontSize: 17,
    letterSpacing: -0.3,
  },
  content: {
    fontSize: 14,
    lineHeight: 22,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  engagement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  engagementText: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.7,
  },
  shareIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
});

