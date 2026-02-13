/**
 * Resource Library Screen
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Resource } from '@/app/types';
import { createInputStyle, createShadow } from '@/app/utils/platform-styles';
import { getResources } from '@/lib/database';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FAVORITES_KEY = 'resource_favorites';

const categories = [
  'All',
  'Mental Health',
  'Substance Abuse',
  'SRH',
  'HIV/Safe Sex',
  'Family/Home',
  'Academic',
  'Relationships',
  'Articles',
  'Videos',
  'PDFs'
];

// removed unused featuredResources

const copingStrategies: any[] = [
  {
    id: '1',
    title: 'Mindfulness Exercises',
    resourceType: 'article',
    category: 'mental-health',
    iconName: 'body-outline',
    color: '#90EE90',
  },
  {
    id: '2',
    title: 'Breathing Techniques',
    resourceType: 'article',
    category: 'mental-health',
    iconName: 'leaf-outline',
    color: '#DDA0DD',
  },
  {
    id: '3',
    title: 'Stress Management',
    resourceType: 'video',
    category: 'mental-health',
    iconName: 'medical-outline',
    color: '#87CEEB',
  },
];

const academicResources: any[] = [
  {
    id: '1',
    title: 'Effective Study Habits',
    resourceType: 'article',
    category: 'academic',
    iconName: 'book-outline',
  },
  {
    id: '2',
    title: 'Time Management',
    resourceType: 'video',
    category: 'academic',
    iconName: 'time',
  },
];

export default function ResourcesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResources();
    loadFavorites();
  }, []);

  const filterResources = useCallback(() => {
    let filtered = resources;

    // Filter by category or resource type
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((r) => {
        const categoryMap: Record<string, { cat?: string; type?: string }> = {
          'Mental Health': { cat: 'mental-health' },
          'Substance Abuse': { cat: 'substance-abuse' },
          'SRH': { cat: 'sexual-health' },
          'HIV/Safe Sex': { cat: 'stis-hiv' },
          'Family/Home': { cat: 'family-home' },
          'Academic': { cat: 'academic' },
          'Relationships': { cat: 'relationships' },
          'Articles': { type: 'article' },
          'Videos': { type: 'video' },
          'PDFs': { type: 'pdf' },
        };

        const mapped = categoryMap[selectedCategory];
        if (!mapped) return true;

        if (mapped.cat) return r.category === mapped.cat;
        if (mapped.type) return r.resourceType === mapped.type;
        return true;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by favorites
    if (showFavoritesOnly) {
      filtered = filtered.filter((r) => favorites.has(r.id));
    }

    setFilteredResources(filtered);
  }, [resources, selectedCategory, searchQuery, showFavoritesOnly, favorites]);

  useEffect(() => {
    filterResources();
  }, [filterResources]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const allResources = await getResources();
      setResources(allResources);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const favoritesJson = await AsyncStorage.getItem(FAVORITES_KEY);
      if (favoritesJson) {
        setFavorites(new Set(JSON.parse(favoritesJson)));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const filterResources = () => {
    let filtered = resources;

    // Filter by category or resource type
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((r) => {
        const categoryMap: Record<string, { cat?: string; type?: string }> = {
          'Mental Health': { cat: 'mental-health' },
          'Substance Abuse': { cat: 'substance-abuse' },
          'SRH': { cat: 'sexual-health' },
          'HIV/Safe Sex': { cat: 'stis-hiv' },
          'Family/Home': { cat: 'family-home' },
          'Academic': { cat: 'academic' },
          'Relationships': { cat: 'relationships' },
          'Articles': { type: 'article' },
          'Videos': { type: 'video' },
          'PDFs': { type: 'pdf' },
        };

        const mapped = categoryMap[selectedCategory];
        if (!mapped) return true;

        if (mapped.cat) return r.category === mapped.cat;
        if (mapped.type) return r.resourceType === mapped.type;
        return true;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by favorites
    if (showFavoritesOnly) {
      filtered = filtered.filter((r) => favorites.has(r.id));
    }

    setFilteredResources(filtered);
  };

  const toggleFavorite = async (resourceId: string) => {
    try {
      const newFavorites = new Set(favorites);
      if (newFavorites.has(resourceId)) {
        newFavorites.delete(resourceId);
      } else {
        newFavorites.add(resourceId);
      }
      setFavorites(newFavorites);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(newFavorites)));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const renderResourceCard = ({ item }: { item: Resource }) => {
    const isFavorite = favorites.has(item.id);
    const getResourceIcon = () => {
      switch (item.resourceType) {
        case 'article':
          return 'library-outline';
        case 'video':
          return 'videocam-outline';
        case 'pdf':
          return 'document-text-outline';
        case 'link':
          return 'link-outline';
        default:
          return 'document-outline';
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.resourceCard,
          { backgroundColor: colors.card },
          createShadow(2, '#000', 0.1),
        ]}
        activeOpacity={0.8}
        onPress={() => router.push(`/resource/${item.id}`)}
      >
        <View style={[styles.resourceImage, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name={getResourceIcon() as any} size={40} color={colors.primary} />
        </View>
        <View style={styles.resourceContent}>
          <ThemedText type="body" style={styles.resourceTitle} numberOfLines={2}>
            {item.title}
          </ThemedText>
          <ThemedText type="small" style={styles.resourceMeta}>
            {item.category} • {item.resourceType}
          </ThemedText>
        </View>
        <TouchableOpacity
          style={styles.bookmarkButton}
          onPress={(e) => {
            e.stopPropagation();
            toggleFavorite(item.id);
          }}
        >
          <Ionicons
            name={isFavorite ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={isFavorite ? colors.primary : colors.icon}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // removed unused renderCopingCard

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
            <Ionicons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, createInputStyle(), { color: colors.text }]}
              placeholder="Search for articles, videos..."
              placeholderTextColor={colors.icon}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Favorites Toggle */}
          <TouchableOpacity
            style={[
              styles.favoritesToggle,
              {
                backgroundColor: showFavoritesOnly ? colors.primary : colors.surface,
              },
              createShadow(1, '#000', 0.05),
            ]}
            onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <MaterialIcons
              name={showFavoritesOnly ? 'favorite' : 'favorite-border'}
              size={20}
              color={showFavoritesOnly ? '#FFFFFF' : colors.text}
            />
            <ThemedText
              type="body"
              style={{
                color: showFavoritesOnly ? '#FFFFFF' : colors.text,
                marginLeft: Spacing.sm,
                fontWeight: '600',
              }}
            >
              {showFavoritesOnly ? 'Show All' : 'Show Favorites'}
            </ThemedText>
          </TouchableOpacity>

          {/* Category Filters */}
          <View style={styles.filtersContainer}>
            <FlatList
              horizontal
              data={categories}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor:
                        selectedCategory === item ? colors.primary : colors.surface,
                    },
                  ]}
                  onPress={() => setSelectedCategory(item)}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    type="small"
                    style={{
                      color: selectedCategory === item ? '#FFFFFF' : colors.text,
                      fontWeight: '600',
                    }}
                  >
                    {item}
                  </ThemedText>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersContent}
            />
          </View>

          {/* Resources List */}
          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              {showFavoritesOnly ? 'Favorite Resources' : 'All Resources'} ({filteredResources.length})
            </ThemedText>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ThemedText>Loading resources...</ThemedText>
              </View>
            ) : filteredResources.length > 0 ? (
              <FlatList
                data={filteredResources}
                renderItem={renderResourceCard}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.gridList}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="inbox" size={48} color={colors.icon} />
                <ThemedText type="body" style={{ color: colors.icon, marginTop: Spacing.md }}>
                  {showFavoritesOnly ? 'No favorite resources yet' : 'No resources found'}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Coping Strategies */}
          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Coping Strategies
            </ThemedText>
            {copingStrategies.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.copingCard,
                  { backgroundColor: colors.card },
                  createShadow(1, '#000', 0.05),
                ]}
                activeOpacity={0.8}
              >
                <View style={[styles.copingIcon, { backgroundColor: item.color + '30' }]}>
                  <Ionicons name={item.iconName as any} size={28} color={item.color} />
                </View>
                <View style={styles.copingContent}>
                  <ThemedText type="body" style={styles.copingTitle}>
                    {item.title}
                  </ThemedText>
                  <ThemedText type="small" style={styles.copingMeta}>
                    {item.duration || item.type}
                  </ThemedText>
                </View>
                <TouchableOpacity>
                  <Ionicons name="bookmark-outline" size={20} color={colors.icon} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>

          {/* Academic Support */}
          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Academic Support
            </ThemedText>
            <FlatList
              horizontal
              data={academicResources as any}
              renderItem={renderResourceCard}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  filtersContainer: {
    marginBottom: Spacing.lg,
  },
  filtersContent: {
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: '700',
  },
  horizontalList: {
    gap: Spacing.md,
  },
  resourceCard: {
    width: 200,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  resourceImage: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceTitle: {
    fontWeight: '600',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  resourceMeta: {
    opacity: 0.7,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  bookmarkButton: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
  },
  copingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  copingIcon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  copingContent: {
    flex: 1,
  },
  copingTitle: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  copingMeta: {
    opacity: 0.7,
  },
  resourceContent: {
    padding: Spacing.sm,
    flex: 1,
  },
  copingEmoji: {
    fontSize: 24,
  },
  favoritesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridList: {
    paddingBottom: Spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    opacity: 0.5,
  },
});

