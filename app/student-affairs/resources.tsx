/**
 * Student Affairs Resources Screen
 * Web-only - Focused on Drug & Substance Abuse and Life Skills resources
 * Division of Student Affairs - Drug and Substance Abuse and Life Skills Section
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebCard, WebContainer } from '@/components/web';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getResources } from '@/lib/database';
import { Resource } from '@/types';
import { createShadow, getCursorStyle } from '@/utils/platform-styles';
import { getResourceIcon, getResourceTypeColor, getResourceTypeLabel, mapResourceFromDB } from '@/utils/resource-utils';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const FAVORITES_KEY = 'student_affairs_resource_favorites';
const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Student Affairs focused categories - Drug & Substance Abuse and Life Skills
const studentAffairsCategories = [
  {
    id: 'substance-abuse',
    label: 'Drug & Substance Abuse',
    icon: 'medical-outline',
    description: 'Resources for drug and alcohol awareness, prevention, and support',
    priority: 1,
  },
  {
    id: 'academic',
    label: 'Life Skills & Academic Support',
    icon: 'library-outline',
    description: 'Study skills, time management, and life skills development',
    priority: 2,
  },
  {
    id: 'mental-health',
    label: 'Mental Health & Well-Being',
    icon: 'heart-outline',
    description: 'Resources for mental wellness and emotional support',
    priority: 3,
  },
  {
    id: 'crisis',
    label: 'Crisis Intervention',
    icon: 'warning-outline',
    description: 'Immediate help and crisis intervention resources',
    priority: 4,
  },
  {
    id: 'campus',
    label: 'University Policies & Support',
    icon: 'business-outline',
    description: 'Campus resources, policies, and student services',
    priority: 5,
  },
];

const resourceTypeCategories = [
  { id: 'all', label: 'All', icon: 'apps-outline' },
  { id: 'articles', label: 'Articles', icon: 'newspaper-outline' },
  { id: 'videos', label: 'Videos', icon: 'play-circle-outline' },
  { id: 'pdfs', label: 'PDFs', icon: 'document-text-outline' },
  { id: 'infographics', label: 'Infographics', icon: 'stats-chart-outline' },
  { id: 'images', label: 'Images', icon: 'images-outline' },
];

function isValidImageUrl(url: string | undefined): boolean {
  if (!url) return false;
  if (!url.startsWith('http') && !url.startsWith('file://') && !url.startsWith('data:')) {
    return false;
  }
  const urlLower = url.toLowerCase();
  const unsupportedFormats = ['.svg', 'svg+xml', 'image/svg'];
  if (unsupportedFormats.some(format => urlLower.includes(format))) {
    return false;
  }
  const supportedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
  const hasSupportedExtension = supportedExtensions.some(ext => urlLower.includes(ext));
  if (url.startsWith('data:')) {
    const mimeType = url.split(';')[0].split(':')[1];
    return mimeType?.startsWith('image/') && !mimeType.includes('svg') || false;
  }
  return hasSupportedExtension || urlLower.includes('image') || urlLower.includes('thumbnail');
}

export default function StudentAffairsResourcesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user, loading: authLoading } = useRoleGuard(['student-affairs', 'admin'], '/(tabs)');
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedContentCategory, setSelectedContentCategory] = useState<string | null>('substance-abuse');
  const [searchQuery, setSearchQuery] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadResources();
      loadFavorites();
    }
  }, [user]);

  useEffect(() => {
    filterResources();
  }, [resources, selectedCategory, selectedContentCategory, searchQuery, showFavoritesOnly, favorites]);

  const loadResources = async () => {
    try {
      setLoading(true);
      // Student Affairs can access all resources
      const allResourcesData = await getResources({});
      const allResources = allResourcesData.map(mapResourceFromDB);
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

    // Filter by Student Affairs relevant categories
    if (selectedContentCategory) {
      filtered = filtered.filter((r) => r.category === selectedContentCategory);
    }

    // Filter by resource type
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((r) => {
        if (selectedCategory === 'articles') return r.resourceType === 'article';
        if (selectedCategory === 'videos') return r.resourceType === 'video';
        if (selectedCategory === 'pdfs') {
          return r.resourceType === 'pdf' && 
                 !r.tags?.some((tag: string) => tag.startsWith('type:image') || tag.startsWith('type:infographic'));
        }
        if (selectedCategory === 'infographics') return r.resourceType === 'infographic';
        if (selectedCategory === 'images') return r.resourceType === 'image';
        return r.resourceType === selectedCategory;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadResources();
    setRefreshing(false);
  };

  const renderResourceCard = ({ item }: { item: Resource }) => {
    const isFavorite = favorites.has(item.id);
    const typeColor = getResourceTypeColor(item.resourceType, colors);
    const isImageType = item.resourceType === 'image' || item.resourceType === 'infographic';
    const isVideoType = item.resourceType === 'video' || item.resourceType === 'short-video';
    const isPDF = item.resourceType === 'pdf' && 
                  !item.tags?.some((tag: string) => tag.startsWith('type:image') || tag.startsWith('type:infographic'));
    const hasThumbnail = !isPDF && isValidImageUrl(item.thumbnailUrl) && (isImageType || isVideoType);

    return (
      <WebCard
        hoverable
        style={styles.resourceCard}
        onPress={() => router.push(`/resource/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          {hasThumbnail ? (
            <ExpoImage
              source={{ uri: item.thumbnailUrl! }}
              style={styles.cardThumbnail}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
            />
          ) : (
            <LinearGradient
              colors={[typeColor + '20', typeColor + '10']}
              style={styles.cardIconContainer}
            >
              <Ionicons name={getResourceIcon(item.resourceType) as any} size={48} color={typeColor} />
            </LinearGradient>
          )}
          
          <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
            <Ionicons name={getResourceIcon(item.resourceType) as any} size={12} color="#FFFFFF" />
            <ThemedText type="small" style={styles.typeBadgeText}>
              {getResourceTypeLabel(item.resourceType)}
            </ThemedText>
          </View>

          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? colors.danger : colors.icon}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.cardContent}>
          <ThemedText type="body" style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </ThemedText>
          
          {item.description && (
            <ThemedText type="small" style={[styles.cardDescription, { color: colors.icon }]} numberOfLines={2}>
              {item.description}
            </ThemedText>
          )}

          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.slice(0, 2).map((tag, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: colors.surface }]}>
                  <ThemedText type="small" style={[styles.tagText, { color: colors.icon }]}>
                    {tag}
                  </ThemedText>
                </View>
              ))}
              {item.tags.length > 2 && (
                <ThemedText type="small" style={{ color: colors.icon }}>
                  +{item.tags.length - 2}
                </ThemedText>
              )}
            </View>
          )}
        </View>
      </WebCard>
    );
  };

  // Web-only check
  if (Platform.OS !== 'web') {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }}>
        <MaterialIcons name="computer" size={64} color={colors.icon} />
        <ThemedText type="h3" style={{ color: colors.text, marginTop: Spacing.lg, textAlign: 'center' }}>
          Web Only
        </ThemedText>
        <ThemedText type="body" style={{ color: colors.icon, marginTop: Spacing.sm, textAlign: 'center' }}>
          This page is only available on web browsers.
        </ThemedText>
      </ThemedView>
    );
  }

  if (authLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={{ marginTop: Spacing.md, color: colors.icon }}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  // Get featured resources for substance abuse and life skills
  const substanceAbuseResources = resources.filter(r => r.category === 'substance-abuse').slice(0, 5);
  const lifeSkillsResources = resources.filter(r => r.category === 'academic').slice(0, 5);

  return (
    <ThemedView style={styles.container}>
      <WebContainer maxWidth={1600} padding={24}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          {/* Page Header */}
          <View style={styles.pageHeader}>
            <View style={styles.headerContent}>
              <ThemedText type="h1" style={[styles.pageTitle, { color: colors.text }]}>
                Student Affairs Resources
              </ThemedText>
              <ThemedText type="body" style={[styles.pageSubtitle, { color: colors.icon }]}>
                Division of Student Affairs - Drug and Substance Abuse and Life Skills Section
              </ThemedText>
            </View>
            <View style={styles.headerStats}>
              <View style={[styles.statBadge, { backgroundColor: colors.primary + '15' }]}>
                <MaterialIcons name="book" size={20} color={colors.primary} />
                <ThemedText type="body" style={[styles.statText, { color: colors.primary }]}>
                  {resources.length} Total
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Search Bar */}
          <WebCard style={styles.searchCard} padding={Spacing.lg}>
            <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search" size={22} color={colors.icon} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search resources by title, description, or tags..."
                placeholderTextColor={colors.icon}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                  {...getCursorStyle()}
                >
                  <Ionicons name="close-circle" size={22} color={colors.icon} />
                </TouchableOpacity>
              )}
            </View>
          </WebCard>

          {/* Category Filters - Student Affairs Focus */}
          <WebCard style={styles.categoriesCard} padding={Spacing.xl}>
            <View style={styles.sectionHeader}>
              <View style={{ flex: 1 }}>
                <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
                  Browse by Category
                </ThemedText>
              </View>
              <ThemedText type="small" style={{ color: colors.icon, textAlign: 'right' }}>
                Select a category to filter resources
              </ThemedText>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContent}
            >
              {studentAffairsCategories.map((cat) => {
                const isSelected = selectedContentCategory === cat.id;
                const categoryResources = resources.filter((r) => r.category === cat.id);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryCard,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.card,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                      createShadow(isSelected ? 4 : 2, '#000', isSelected ? 0.15 : 0.08),
                    ]}
                    onPress={() => {
                      setSelectedContentCategory(isSelected ? null : cat.id);
                      setSelectedCategory('all');
                    }}
                    activeOpacity={0.7}
                    {...getCursorStyle()}
                  >
                    <View
                      style={[
                        styles.categoryIcon,
                        {
                          backgroundColor: isSelected ? '#FFFFFF' : colors.primary + '20',
                        },
                      ]}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={28}
                        color={isSelected ? colors.primary : colors.primary}
                      />
                    </View>
                    <ThemedText
                      type="body"
                      style={[
                        styles.categoryLabel,
                        {
                          color: isSelected ? '#FFFFFF' : colors.text,
                          fontWeight: '700',
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {cat.label}
                    </ThemedText>
                    <ThemedText
                      type="small"
                      style={[
                        styles.categoryCount,
                        {
                          color: isSelected ? 'rgba(255, 255, 255, 0.9)' : colors.icon,
                        },
                      ]}
                    >
                      {categoryResources.length} {categoryResources.length === 1 ? 'resource' : 'resources'}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </WebCard>

          {/* Resource Type Filters */}
          <WebCard style={styles.typeFiltersCard} padding={Spacing.xl}>
            <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text, marginBottom: Spacing.lg }]}>
              Filter by Resource Type
            </ThemedText>
            <View style={styles.typeFiltersContainer}>
              {resourceTypeCategories.map((item) => {
                const isSelected = selectedCategory === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: isSelected ? colors.secondary : colors.surface,
                        borderColor: isSelected ? colors.secondary : colors.border,
                      },
                      createShadow(isSelected ? 2 : 1, '#000', isSelected ? 0.1 : 0.05),
                    ]}
                    onPress={() => {
                      setSelectedCategory(item.id);
                      if (item.id !== 'all') {
                        setSelectedContentCategory(null);
                      }
                    }}
                    activeOpacity={0.7}
                    {...getCursorStyle()}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={18}
                      color={isSelected ? '#FFFFFF' : colors.icon}
                    />
                    <ThemedText
                      type="small"
                      style={[
                        styles.typeChipText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.text,
                          fontWeight: '600',
                        },
                      ]}
                    >
                      {item.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </WebCard>

          {/* Favorites Toggle */}
          <View style={styles.filtersRow}>
            <TouchableOpacity
              style={[
                styles.favoritesToggle,
                {
                  backgroundColor: showFavoritesOnly ? colors.primary : colors.card,
                  borderColor: showFavoritesOnly ? colors.primary : colors.border,
                },
                createShadow(showFavoritesOnly ? 3 : 1, '#000', showFavoritesOnly ? 0.15 : 0.05),
              ]}
              onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
              {...getCursorStyle()}
            >
              <MaterialIcons
                name={showFavoritesOnly ? 'favorite' : 'favorite-border'}
                size={22}
                color={showFavoritesOnly ? '#FFFFFF' : colors.icon}
              />
              <ThemedText
                type="body"
                style={[
                  styles.favoritesToggleText,
                  {
                    color: showFavoritesOnly ? '#FFFFFF' : colors.text,
                    fontWeight: '600',
                  },
                ]}
              >
                {showFavoritesOnly ? 'Show All Resources' : 'Show Favorites Only'}
              </ThemedText>
              {favorites.size > 0 && (
                <View style={[styles.favoritesBadge, { backgroundColor: showFavoritesOnly ? '#FFFFFF' : colors.primary }]}>
                  <ThemedText type="small" style={[styles.favoritesBadgeText, { color: showFavoritesOnly ? colors.primary : '#FFFFFF' }]}>
                    {favorites.size}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Featured: Substance Abuse Resources */}
          {substanceAbuseResources.length > 0 && !showFavoritesOnly && selectedContentCategory !== 'academic' && (
            <WebCard style={styles.featuredCard} padding={Spacing.xl}>
              <View style={styles.sectionHeader}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
                    Drug & Substance Abuse Resources
                  </ThemedText>
                  <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                    Essential resources for awareness, prevention, and support
                  </ThemedText>
                </View>
                <TouchableOpacity 
                  onPress={() => setSelectedContentCategory('substance-abuse')}
                  style={styles.viewAllButton}
                  {...getCursorStyle()}
                >
                  <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600' }}>
                    View All
                  </ThemedText>
                  <MaterialIcons name="chevron-right" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.featuredScrollContent}
              >
                {substanceAbuseResources.map((item) => (
                  <View key={item.id} style={styles.featuredCardWrapper}>
                    {renderResourceCard({ item })}
                  </View>
                ))}
              </ScrollView>
            </WebCard>
          )}

          {/* Featured: Life Skills Resources */}
          {lifeSkillsResources.length > 0 && !showFavoritesOnly && selectedContentCategory !== 'substance-abuse' && (
            <WebCard style={styles.featuredCard} padding={Spacing.xl}>
              <View style={styles.sectionHeader}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
                    Life Skills & Academic Support
                  </ThemedText>
                  <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                    Resources for academic success and personal development
                  </ThemedText>
                </View>
                <TouchableOpacity 
                  onPress={() => setSelectedContentCategory('academic')}
                  style={styles.viewAllButton}
                  {...getCursorStyle()}
                >
                  <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600' }}>
                    View All
                  </ThemedText>
                  <MaterialIcons name="chevron-right" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.featuredScrollContent}
              >
                {lifeSkillsResources.map((item) => (
                  <View key={item.id} style={styles.featuredCardWrapper}>
                    {renderResourceCard({ item })}
                  </View>
                ))}
              </ScrollView>
            </WebCard>
          )}

          {/* Resources Grid */}
          <WebCard style={styles.resourcesSectionCard} padding={Spacing.xl}>
            <View style={styles.sectionHeader}>
              <View style={{ flex: 1 }}>
                <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
                  {showFavoritesOnly ? 'Favorite Resources' : 'All Resources'}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                  {filteredResources.length} {filteredResources.length === 1 ? 'resource' : 'resources'} found
                  {selectedContentCategory && ` in ${studentAffairsCategories.find(c => c.id === selectedContentCategory)?.label}`}
                </ThemedText>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
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
                <MaterialIcons name="inbox" size={80} color={colors.icon} />
                <ThemedText type="h3" style={{ color: colors.text, marginTop: Spacing.lg }}>
                  No resources found
                </ThemedText>
                <ThemedText type="body" style={{ color: colors.icon, marginTop: Spacing.sm, textAlign: 'center', maxWidth: 400 }}>
                  {showFavoritesOnly 
                    ? 'You haven\'t favorited any resources yet. Click the heart icon on any resource to add it to your favorites.' 
                    : 'Try adjusting your search query or filters to find what you\'re looking for.'}
                </ThemedText>
                {(searchQuery || selectedContentCategory || selectedCategory !== 'all') && (
                  <TouchableOpacity
                    style={[styles.clearFiltersButton, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      setSearchQuery('');
                      setSelectedContentCategory(null);
                      setSelectedCategory('all');
                      setShowFavoritesOnly(false);
                    }}
                    {...getCursorStyle()}
                  >
                    <MaterialIcons name="clear-all" size={18} color="#FFFFFF" />
                    <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: Spacing.xs }}>
                      Clear All Filters
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </WebCard>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </WebContainer>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl * 2,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
    marginTop: 0,
    gap: Spacing.xl,
  },
  headerContent: {
    flex: 1,
  },
  pageTitle: {
    fontWeight: '700',
    fontSize: 36,
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
    lineHeight: 44,
  },
  pageSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: Spacing.xs,
  },
  headerStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statText: {
    fontWeight: '600',
    fontSize: 14,
  },
  searchCard: {
    marginBottom: Spacing.xl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    minHeight: 56,
    ...(Platform.OS === 'web' ? {
      transition: 'border-color 0.2s ease',
    } : {}),
  },
  searchIcon: {
    marginRight: Spacing.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 16,
    minHeight: 24,
    ...(Platform.OS === 'web' ? {
      outline: 'none',
    } : {}),
  },
  clearButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesCard: {
    marginBottom: Spacing.xl,
  },
  categoriesContent: {
    gap: Spacing.md,
    paddingRight: 0,
    paddingLeft: 0,
  },
  categoryCard: {
    width: 180,
    minWidth: 180,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? {
      transition: 'all 0.3s ease',
    } : {}),
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoryLabel: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    lineHeight: 20,
    minHeight: 40,
  },
  categoryCount: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  typeFiltersCard: {
    marginBottom: Spacing.xl,
  },
  typeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    alignItems: 'center',
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    gap: Spacing.sm,
    ...(Platform.OS === 'web' ? {
      transition: 'all 0.2s ease',
    } : {}),
  },
  typeChipText: {
    fontSize: 14,
    lineHeight: 20,
  },
  filtersRow: {
    marginBottom: Spacing.xl,
    width: '100%',
  },
  favoritesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.sm,
    width: '100%',
    ...(Platform.OS === 'web' ? {
      transition: 'all 0.2s ease',
    } : {}),
  },
  favoritesToggleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  favoritesBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  favoritesBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    width: '100%',
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 22,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  featuredCard: {
    marginBottom: Spacing.xl,
  },
  featuredScrollContent: {
    gap: Spacing.lg,
    paddingRight: 0,
    paddingLeft: 0,
  },
  featuredCardWrapper: {
    width: 320,
    minWidth: 320,
  },
  resourcesSectionCard: {
    marginBottom: Spacing.xl,
  },
  resourcesGrid: {
    ...(Platform.OS === 'web' ? {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: `${Spacing.lg}px`,
      width: '100%',
    } as any : {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.lg,
    }),
  },
  resourceCardWrapper: {
    ...(Platform.OS === 'web' ? {
      width: '100%',
      display: 'flex',
    } : {}),
  },
  resourceCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    ...(Platform.OS === 'web' ? {
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    } : {}),
  },
  cardHeader: {
    position: 'relative',
    width: '100%',
    height: 200,
    flexShrink: 0,
  },
  cardThumbnail: {
    width: '100%',
    height: '100%',
  },
  cardIconContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 6,
    zIndex: 2,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    lineHeight: 14,
  },
  favoriteButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    ...createShadow(3, '#000', 0.15),
    ...(Platform.OS === 'web' ? {
      transition: 'transform 0.2s ease',
    } : {}),
  },
  cardContent: {
    padding: Spacing.lg,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  cardTitle: {
    fontWeight: '700',
    marginBottom: Spacing.sm,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md,
    opacity: 0.75,
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    alignItems: 'center',
    marginTop: 'auto',
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: 11,
    lineHeight: 14,
  },
  loadingContainer: {
    padding: Spacing.xxl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  emptyContainer: {
    padding: Spacing.xxl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
    ...(Platform.OS === 'web' ? {
      transition: 'opacity 0.2s ease',
    } : {}),
  },
});
