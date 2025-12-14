/**
 * Resource Library - All resources for peer educators
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PostCategory } from '@/types';
import { createInputStyle, createShadow, getCursorStyle } from '@/utils/platform-styles';
import { getResourceIconMaterial, mapResourceFromDB } from '@/utils/resource-utils';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { getResources } from '@/lib/database';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: PostCategory;
  resourceType: 'article' | 'video' | 'pdf' | 'link' | 'training' | 'short-article' | 'short-video' | 'infographic' | 'image';
  url?: string;
  filePath?: string;
  thumbnailUrl?: string;
  tags: string[];
  bookmarked: boolean;
}

const BOOKMARKS_KEY = '@lunavo:bookmarked_resources';

export default function ResourcesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user, loading: authLoading } = useRoleGuard(
    ['peer-educator', 'peer-educator-executive', 'admin'],
    '/(tabs)'
  );
  
  const [refreshing, setRefreshing] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadResources();
      loadBookmarks();
    }
  }, [user]);

  useEffect(() => {
    filterResources();
  }, [resources, selectedCategory, searchQuery]);

  const loadResources = async () => {
    try {
      const allResources = await getResources({ approved: true });
      
      // Map database resources to app format using shared utility
      const mappedResources: Resource[] = allResources.map((r: any) => {
        const mapped = mapResourceFromDB(r);
        return {
          ...mapped,
          description: mapped.description ?? '',
          bookmarked: bookmarkedIds.has(r.id),
        } as Resource;
      });

      setResources(mappedResources);
    } catch (error) {
      console.error('Error loading resources:', error);
    }
  };

  const loadBookmarks = async () => {
    try {
      const bookmarksJson = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (bookmarksJson) {
        const bookmarks = JSON.parse(bookmarksJson);
        setBookmarkedIds(new Set(bookmarks));
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  const filterResources = () => {
    let filtered = resources;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((r) => r.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query) ||
          r.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    setFilteredResources(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadResources();
    setRefreshing(false);
  };

  const handleBookmark = async (resourceId: string) => {
    try {
      const newBookmarks = new Set(bookmarkedIds);
      if (newBookmarks.has(resourceId)) {
        newBookmarks.delete(resourceId);
      } else {
        newBookmarks.add(resourceId);
      }
      setBookmarkedIds(newBookmarks);
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(Array.from(newBookmarks)));

      // Update resource bookmarked status
      setResources((prev) =>
        prev.map((r) => (r.id === resourceId ? { ...r, bookmarked: newBookmarks.has(resourceId) } : r))
      );
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleDownload = (resource: Resource) => {
    // TODO: Implement download functionality
    Alert.alert('Download', `Downloading ${resource.title}...`);
  };

  const handleResourcePress = (resource: Resource) => {
    // Navigate to resource detail screen which handles all viewing
    router.push(`/resource/${resource.id}`);
  };

  // Use shared utility function for MaterialIcons
  const getResourceIcon = (type: string) => getResourceIconMaterial(type);

  const getResourceColor = (type: string) => {
    switch (type) {
      case 'video':
        return '#3B82F6';
      case 'pdf':
        return '#EF4444';
      case 'link':
        return '#10B981';
      case 'training':
        return '#F59E0B';
      default:
        return colors.primary;
    }
  };

  const renderResource = ({ item }: { item: Resource }) => (
    <TouchableOpacity
      style={[styles.resourceCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}
      onPress={() => handleResourcePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.resourceHeader}>
        <View
          style={[
            styles.resourceIcon,
            { backgroundColor: getResourceColor(item.resourceType) + '20' },
          ]}
        >
          <MaterialIcons
            name={getResourceIcon(item.resourceType) as any}
            size={24}
            color={getResourceColor(item.resourceType)}
          />
        </View>
        <View style={styles.resourceInfo}>
          <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }}>
            {item.title}
          </ThemedText>
          <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }} numberOfLines={2}>
            {item.description}
          </ThemedText>
          {item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.surface }]}>
                  <ThemedText type="small" style={{ color: colors.text, fontSize: 10 }}>
                    {tag}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => handleBookmark(item.id)}
          style={getCursorStyle()}
        >
          <MaterialIcons
            name={item.bookmarked ? 'bookmark' : 'bookmark-border'}
            size={24}
            color={item.bookmarked ? colors.primary : colors.icon}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.resourceActions}>
        {item.url && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={() => handleDownload(item)}
          >
            <MaterialIcons name="download" size={18} color={colors.text} />
            <ThemedText type="small" style={{ color: colors.text, marginLeft: Spacing.xs }}>
              Download
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  if (authLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const categories: Array<{ id: PostCategory | 'all'; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'mental-health', label: 'Mental Health' },
    { id: 'crisis', label: 'Crisis' },
    { id: 'substance-abuse', label: 'Substance Abuse' },
    { id: 'sexual-health', label: 'Sexual Health' },
    { id: 'academic', label: 'Academic' },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h2" style={styles.headerTitle}>
            Resource Library
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
          <TextInput
            style={[
              styles.searchInput,
              createInputStyle(),
              { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="Search resources..."
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Category Filters */}
        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            data={categories}
            renderItem={({ item }) => {
              const isSelected = selectedCategory === item.id;
              return (
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                    },
                  ]}
                  onPress={() => setSelectedCategory(item.id)}
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

        {/* Resources List */}
        <FlatList
          data={filteredResources}
          renderItem={renderResource}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="folder-open" size={64} color={colors.icon} />
              <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
                No resources found
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
  headerTitle: {
    fontWeight: '700',
    fontSize: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    position: 'absolute',
    left: Spacing.lg,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    paddingLeft: Spacing.xxl,
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
  resourceCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  resourceIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  resourceInfo: {
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  resourceActions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
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


