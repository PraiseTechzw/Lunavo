/**
 * Resource Library Screen
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { WebCard, WebContainer } from '@/app/components/web';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { createShadow, getCursorStyle, createInputStyle } from '@/app/utils/platform-styles';
import { getResources } from '@/lib/database';
import { Resource } from '@/app/types';
import { getCurrentUser } from '@/lib/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Dimensions } from 'react-native';

const FAVORITES_KEY = 'resource_favorites';
const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const categories = ['All', 'Articles', 'Videos', 'Coping Skills', 'Academic', 'Mental Health'];

const featuredResources = [
  {
    id: '1',
    title: 'Exam Stress Tips',
    type: 'Article',
    duration: '5 min read',
    iconName: 'library-outline',
    gradient: ['#9B59B6', '#3498DB'],
  },
  {
    id: '2',
    title: 'Guided Meditation',
    type: 'Video',
    duration: '10 min',
    iconName: 'body-outline',
    gradient: ['#E74C3C', '#F39C12'],
  },
];

const copingStrategies = [
  {
    id: '1',
    title: 'Mindfulness Exercises',
    type: 'Article',
    iconName: 'body-outline',
    color: '#90EE90',
  },
  {
    id: '2',
    title: 'Breathing Techniques',
    type: 'Article',
    duration: '2 min read',
    iconName: 'leaf-outline',
    color: '#DDA0DD',
  },
  {
    id: '3',
    title: 'Stress Management',
    type: 'Video',
    duration: '15 min',
    iconName: 'medical-outline',
    color: '#87CEEB',
  },
];

const academicResources = [
  {
    id: '1',
    title: 'Effective Study Habits',
    type: 'Article',
    iconName: 'book-outline',
  },
  {
    id: '2',
    title: 'Time Management',
    type: 'Video',
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
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setUserRole(user.role);
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  useEffect(() => {
    filterResources();
  }, [resources, selectedCategory, searchQuery, showFavoritesOnly, favorites]);

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

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((r) => {
        const categoryMap: Record<string, string> = {
          'Articles': 'article',
          'Videos': 'video',
          'Coping Skills': 'mental-health',
          'Academic': 'academic',
          'Mental Health': 'mental-health',
        };
        return r.resourceType === categoryMap[selectedCategory] || r.category === categoryMap[selectedCategory];
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
      <WebCard
        hoverable
        onPress={() => router.push(`/resource/${item.id}`)}
        style={[
          styles.resourceCard,
          { backgroundColor: colors.card },
        ]}
      >
        <View style={[styles.resourceImage, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name={getResourceIcon() as any} size={40} color={colors.primary} />
        </View>
        <View style={styles.resourceContent}>
          <ThemedText type="body" style={[styles.resourceTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </ThemedText>
          <ThemedText type="small" style={[styles.resourceMeta, { color: colors.icon }]}>
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
      </WebCard>
    );
  };

  const renderCopingCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.copingCard,
        { backgroundColor: colors.card },
        createShadow(1, '#000', 0.05),
      ]}
      activeOpacity={0.8}
    >
      <View style={[styles.copingIcon, { backgroundColor: item.color + '30' }]}>
        <Text style={styles.copingEmoji}>{item.icon}</Text>
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
  );

  const content = (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Page Header - Web optimized */}
      {(isWeb && isStudentAffairs) && (
        <View style={styles.pageHeader}>
          <View>
            <ThemedText type="h1" style={[styles.pageTitle, { color: colors.text }]}>
              Resource Library
            </ThemedText>
            <ThemedText type="body" style={[styles.pageSubtitle, { color: colors.icon }]}>
              Support resources and educational materials
            </ThemedText>
          </View>
        </View>
      )}

      {/* Search Bar */}
      <WebCard style={styles.searchCard}>
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
      </WebCard>

      {/* Filters Section */}
      <WebCard style={styles.filtersCard}>
        <View style={styles.filtersRow}>
          {/* Favorites Toggle */}
          <TouchableOpacity
            style={[
              styles.favoritesToggle,
              {
                backgroundColor: showFavoritesOnly ? colors.primary : colors.surface,
                borderColor: showFavoritesOnly ? colors.primary : colors.border,
              },
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
              {showFavoritesOnly ? 'Show All' : 'Favorites Only'}
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
                      borderColor: selectedCategory === item ? colors.primary : colors.border,
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
        </View>
      </WebCard>

      {/* Resources List */}
      <WebCard style={styles.resourcesCard}>
        <View style={styles.sectionHeader}>
          <View>
            <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
              {showFavoritesOnly ? 'Favorite Resources' : 'All Resources'}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
              {filteredResources.length} {filteredResources.length === 1 ? 'resource' : 'resources'} available
            </ThemedText>
          </View>
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <MaterialIcons name="hourglass-empty" size={48} color={colors.icon} />
            <ThemedText type="body" style={{ color: colors.icon, marginTop: Spacing.md }}>
              Loading resources...
            </ThemedText>
          </View>
        ) : filteredResources.length > 0 ? (
          <View style={styles.resourcesGrid}>
            {filteredResources.map((item) => (
              <View key={item.id} style={styles.resourceCardWrapper}>
                {renderResourceCard({ item })}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inbox" size={48} color={colors.icon} />
            <ThemedText type="body" style={{ color: colors.icon, marginTop: Spacing.md }}>
              {showFavoritesOnly ? 'No favorite resources yet' : 'No resources found'}
            </ThemedText>
          </View>
        )}
      </WebCard>

      {/* Coping Strategies */}
      <WebCard style={styles.copingCard}>
        <View>
          <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
            Coping Strategies
          </ThemedText>
          <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
            Quick access to stress management resources
          </ThemedText>
        </View>
        <View style={styles.copingList}>
          {copingStrategies.map((item) => (
            <WebCard
              key={item.id}
              hoverable
              style={[
                styles.copingCardItem,
                { backgroundColor: colors.card },
              ]}
            >
              <View style={[styles.copingIcon, { backgroundColor: item.color + '30' }]}>
                <Ionicons name={item.iconName as any} size={28} color={item.color} />
              </View>
              <View style={styles.copingContent}>
                <ThemedText type="body" style={[styles.copingTitle, { color: colors.text }]}>
                  {item.title}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  {item.duration || item.type}
                </ThemedText>
              </View>
              <TouchableOpacity>
                <Ionicons name="bookmark-outline" size={20} color={colors.icon} />
              </TouchableOpacity>
            </WebCard>
          ))}
        </View>
      </WebCard>
    </ScrollView>
  );

const styles = StyleSheet.create({
  safeAreaTop: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: isWeb ? 0 : Spacing.md,
    paddingBottom: isWeb ? Spacing.xxl : 80,
  },
  pageHeader: {
    marginBottom: Spacing.xl,
    ...(isWeb ? {
      marginTop: Spacing.lg,
    } : {}),
  },
  pageTitle: {
    fontWeight: '700',
    fontSize: isWeb ? 32 : 24,
    marginBottom: Spacing.xs,
  },
  pageSubtitle: {
    fontSize: isWeb ? 16 : 14,
  },
  searchCard: {
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  filtersCard: {
    marginBottom: Spacing.lg,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    flexWrap: 'wrap',
  },
  filtersContainer: {
    flex: 1,
    minWidth: 200,
  },
  filtersContent: {
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    borderWidth: 1,
    ...getCursorStyle(),
  },
  favoritesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    ...getCursorStyle(),
  },
  sectionHeader: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: isWeb ? 20 : 18,
  },
  resourcesCard: {
    marginBottom: Spacing.xl,
  },
  resourcesGrid: {
    ...(isWeb ? {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: Spacing.lg,
    } : {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    }),
  },
  resourceCardWrapper: {
    ...(isWeb ? {} : {
      width: '47%',
    }),
  },
  resourceCard: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    height: '100%',
    ...(isWeb ? {
      minHeight: 200,
    } : {}),
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
    marginBottom: Spacing.xl,
  },
  copingList: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  copingCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
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
  loadingContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

