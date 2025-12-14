/**
 * Post card component for displaying posts in the feed
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Post } from '@/types';
import { CategoryBadge } from './category-badge';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius, PlatformStyles } from '@/constants/theme';
import { createShadow, getCursorStyle } from '@/utils/platform-styles';
import { formatDistanceToNow } from 'date-fns';

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

  // Map category to display name and color
  const getCategoryInfo = (category: string) => {
    const categoryMap: Record<string, { label: string; bgColor: string; textColor: string }> = {
      'academic': { label: 'Academics', bgColor: '#E8F5E9', textColor: '#4CAF50' },
      'relationships': { label: 'Relationships', bgColor: '#E3F2FD', textColor: '#2196F3' },
      'mental-health': { label: 'Depression', bgColor: '#F3E5F5', textColor: '#9C27B0' },
      'social': { label: 'Social', bgColor: '#FFF3E0', textColor: '#FF9800' },
      'crisis': { label: 'Crisis', bgColor: '#FFEBEE', textColor: '#F44336' },
    };
    return categoryMap[category] || { label: category, bgColor: '#F5F5F5', textColor: '#757575' };
  };

  const categoryInfo = getCategoryInfo(post.category);

  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.7}
      style={getCursorStyle()}
    >
      <ThemedView
        style={[
          styles.card,
          createShadow(2, '#000', 0.1),
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
            borderLeftWidth: isEscalated ? 4 : 1,
            borderLeftColor: isEscalated ? colors.danger : colors.border,
          },
        ]}
      >
        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <MaterialIcons name="person" size={20} color="#FFFFFF" />
          </View>
          <ThemedText type="body" style={styles.userName}>
            Anonymous Student
          </ThemedText>
        </View>

        {/* Title */}
        <ThemedText type="h3" style={styles.title}>
          {post.title}
        </ThemedText>

        {/* Content */}
        <ThemedText type="body" numberOfLines={3} style={styles.content}>
          {post.content}
        </ThemedText>

        {/* Category Tag */}
        <View style={[styles.categoryTag, { backgroundColor: categoryInfo.bgColor }]}>
          <ThemedText type="small" style={[styles.categoryText, { color: categoryInfo.textColor }]}>
            {categoryInfo.label}
          </ThemedText>
        </View>

        {/* Engagement Metrics */}
        <View style={styles.engagement}>
          <View style={styles.engagementItem}>
            <MaterialIcons name="favorite-border" size={18} color={colors.icon} />
            <Text style={[styles.engagementText, { color: colors.icon }]}>
              {likeCount}
            </Text>
          </View>
          <View style={styles.engagementItem}>
            <MaterialIcons name="chat-bubble-outline" size={18} color={colors.icon} />
            <Text style={[styles.engagementText, { color: colors.icon }]}>
              {replyCount} {replyCount === 1 ? 'Reply' : 'Replies'}
            </Text>
          </View>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  userName: {
    fontWeight: '500',
    fontSize: 14,
  },
  title: {
    marginBottom: Spacing.sm,
    fontWeight: '700',
    fontSize: 16,
  },
  content: {
    marginBottom: Spacing.sm,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  engagement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  engagementText: {
    fontSize: 14,
  },
});

