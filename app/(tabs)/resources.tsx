/**
 * Enhanced Resource Library Screen
 * Matches design with dark blue theme and handwritten-style fonts
 * Full support for all resource types: PDFs, Articles, Infographics, Videos, Images, and more
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Resource } from '@/app/types';
import { createInputStyle, createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { getCurrentUser, getResources } from '@/lib/database';
import { UserRole, canCreateResources } from '@/lib/permissions';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FAVORITES_KEY = 'resource_favorites';
const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const CARD_WIDTH = (width - Spacing.md * 3) / 2; // 2 columns with spacing

// Professional resource categories for Peer Educator platform
// Organized by content type and purpose
const resourceTypeCategories = [
  { id: 'all', label: 'All', icon: 'apps-outline' },
  { id: 'articles', label: 'Articles', icon: 'newspaper-outline' },
  { id: 'videos', label: 'Videos', icon: 'play-circle-outline' },
  { id: 'pdfs', label: 'PDFs', icon: 'document-text-outline' },
  { id: 'infographics', label: 'Infographics', icon: 'stats-chart-outline' },
  { id: 'images', label: 'Images', icon: 'images-outline' },
  { id: 'short-articles', label: 'Short Articles', icon: 'document-text-outline' },
  { id: 'short-videos', label: 'Short Videos', icon: 'videocam-outline' },
];

// Content organization categories - as specified in requirements
const contentCategories = [
  {
    id: 'mental-health',
    label: 'Mental Health & Well-Being',
    icon: 'heart-outline',
    description: 'Resources for mental wellness and emotional support',
  },
  {
    id: 'peer-educator-toolkit',
    label: 'Peer Educator Toolkit',
    icon: 'school-outline',
    description: 'Training materials and resources for peer educators',
  },
  {
    id: 'crisis',
    label: 'Crisis & Emergency Support',
    icon: 'warning-outline',
    description: 'Immediate help and crisis intervention resources',
  },
  {
    id: 'sexual-health',
    label: 'Sexual & Reproductive Health',
    icon: 'heart-circle-outline',
    description: 'SRH education and support resources',
  },
  {
    id: 'substance-abuse',
    label: 'Substance Abuse Awareness',
    icon: 'medical-outline',
    description: 'Drug and alcohol awareness and support',
  },
  {
    id: 'academic',
    label: 'Academic & Life Skills',
    icon: 'library-outline',
    description: 'Study skills, time management, and academic support',
  },
  {
    id: 'campus',
    label: 'University Support & Policies',
    icon: 'business-outline',
    description: 'Campus resources, policies, and student services',
  },
];

// Map database resource to Resource interface
function mapResourceFromDB(data: any): Resource {
  return {
    id: data.id,
    title: data.title,
    description: data.description || '',
    category: data.category,
    resourceType: data.resource_type,
    url: data.url || undefined,
    filePath: data.file_path || undefined,
    thumbnailUrl: data.thumbnail_url || data.url || undefined,
    tags: data.tags || [],
    createdBy: data.created_by,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

// Get resource type color
function getResourceTypeColor(resourceType: string, colors: any): string {
  switch (resourceType) {
    case 'article':
    case 'short-article':
      return colors.academic || '#3B82F6';
    case 'video':
    case 'short-video':
      return colors.danger || '#EF4444';
    case 'pdf':
      return colors.warning || '#F59E0B';
    case 'infographic':
      return colors.secondary || '#8B5CF6';
    case 'image':
      return colors.info || '#06B6D4';
    case 'link':
      return colors.success || '#10B981';
    case 'training':
      return colors.mentalHealth || '#A855F7';
    default:
      return colors.primary || '#6366F1';
  }
}

// Get resource type icon
function getResourceIcon(resourceType: string): string {
  switch (resourceType) {
    case 'article':
    case 'short-article':
      return 'newspaper-outline';
    case 'video':
    case 'short-video':
      return 'play-circle-outline';
    case 'pdf':
      return 'document-text-outline';
    case 'infographic':
      return 'stats-chart-outline';
    case 'image':
      return 'image-outline';
    case 'link':
      return 'link-outline';
    case 'training':
      return 'school-outline';
    default:
      return 'document-outline';
  }
}

// Get resource type label
function getResourceTypeLabel(resourceType: string): string {
  switch (resourceType) {
    case 'short-article':
      return 'Short Article';
    case 'short-video':
      return 'Short Video';
    default:
      return resourceType.charAt(0).toUpperCase() + resourceType.slice(1);
  }
}

export default function ResourcesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedContentCategory, setSelectedContentCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const isStudentAffairs = userRole === 'student-affairs';
  const isAdmin = userRole === 'admin';
  const isCounselor = userRole === 'counselor' || userRole === 'life-coach';
  const isPeerEducator = userRole === 'peer-educator' || userRole === 'peer-educator-executive';

  // Theme-aware colors that adapt to light/dark mode
  const headerBgColor = colorScheme === 'dark' ? colors.surface : colors.primary;
  const headerTextColor = colorScheme === 'dark' ? colors.text : '#FFFFFF';
  const searchBgColor = colorScheme === 'dark' ? colors.surface : colors.primary + '15';
  const filterBgColor = colorScheme === 'dark' ? colors.surface : colors.surface;
  const selectedFilterColor = colors.secondary;

  useEffect(() => {
    loadUserRole();
  }, []);

  useEffect(() => {
    if (userRole) {
      loadResources();
      loadFavorites();
    }
  }, [userRole]);

  useEffect(() => {
    filterResources();
  }, [resources, selectedCategory, selectedContentCategory, searchQuery, showFavoritesOnly, favorites]);

  const loadUserRole = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setUserRole(user.role as UserRole);
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  const loadResources = async () => {
    if (!userRole) return;
    
    try {
      setLoading(true);
      
      // Role-based filtering at database level
      let filters: any = {};
      
      // Students: Only approved curated resources
      if (userRole === 'student') {
        filters.approved = true;
        filters.sourceType = 'curated';
      }
      
      // Peer Educators & Executives: Curated + Community resources (limited & supervised)
      if (isPeerEducator) {
        filters.approved = true;
      }
      
      // Counselors, Student Affairs, Admins: All resources (no filters)
      
      const allResourcesData = await getResources(filters);
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

    // Filter by content category (Mental Health, Peer Educator Toolkit, etc.)
    if (selectedContentCategory) {
      filtered = filtered.filter((r) => r.category === selectedContentCategory);
    }

    // Filter by resource type category (Articles, Videos, PDFs, etc.)
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((r) => {
        if (selectedCategory === 'articles') {
          return r.resourceType === 'article';
        }
        if (selectedCategory === 'short-articles') {
          return r.resourceType === 'short-article';
        }
        if (selectedCategory === 'videos') {
          return r.resourceType === 'video';
        }
        if (selectedCategory === 'short-videos') {
          return r.resourceType === 'short-video';
        }
        if (selectedCategory === 'pdfs') {
          return r.resourceType === 'pdf';
        }
        if (selectedCategory === 'infographics') {
          return r.resourceType === 'infographic';
        }
        if (selectedCategory === 'images') {
          return r.resourceType === 'image';
        }
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

  const renderResourceCard = ({ item }: { item: Resource }) => {
    const isFavorite = favorites.has(item.id);
    const typeColor = getResourceTypeColor(item.resourceType, colors);
    // Enhanced thumbnail detection - check if thumbnail exists and is valid
    const hasThumbnail = 
      item.thumbnailUrl && 
      (item.resourceType === 'image' || 
       item.resourceType === 'infographic' || 
       item.resourceType === 'video' || 
       item.resourceType === 'short-video') &&
      (item.thumbnailUrl.startsWith('http') || item.thumbnailUrl.startsWith('file://'));

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push(`/resource/${item.id}`)}
        style={[
          styles.resourceCard,
          { backgroundColor: colors.card },
          createShadow(2, '#000', 0.08),
        ]}
      >
        {/* Thumbnail or Icon Header */}
        <View style={styles.cardHeader}>
          {hasThumbnail ? (
            <ExpoImage
              source={{ uri: item.thumbnailUrl! }}
              style={styles.cardThumbnail}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
              onError={() => {
                // Fallback handled by ExpoImage automatically
              }}
            />
          ) : (
            <LinearGradient
              colors={[typeColor + '20', typeColor + '10']}
              style={styles.cardIconContainer}
            >
              <Ionicons name={getResourceIcon(item.resourceType) as any} size={48} color={typeColor} />
            </LinearGradient>
          )}
          
          {/* Type Badge */}
          <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
            <Ionicons name={getResourceIcon(item.resourceType) as any} size={12} color="#FFFFFF" />
            <ThemedText type="small" style={styles.typeBadgeText}>
              {getResourceTypeLabel(item.resourceType)}
            </ThemedText>
          </View>

          {/* Favorite Button */}
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

        {/* Card Content */}
        <View style={styles.cardContent}>
          <ThemedText type="body" style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </ThemedText>
          
          {item.description && (
            <ThemedText type="small" style={[styles.cardDescription, { color: colors.icon }]} numberOfLines={2}>
              {item.description}
            </ThemedText>
          )}

          {/* Tags */}
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
      </TouchableOpacity>
    );
  };

  // Get featured resources
  const featuredResources = filteredResources.slice(0, 3);
  
  // Get resources by category for quick access
  const copingStrategies = resources.filter(r => 
    r.category === 'mental-health' || 
    r.tags?.some(tag => ['coping', 'stress', 'mindfulness', 'breathing'].includes(tag.toLowerCase()))
  ).slice(0, 5);

  const academicResources = resources.filter(r => r.category === 'academic').slice(0, 5);

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: headerBgColor, borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <ThemedText 
              type="h1" 
              style={[
                styles.headerTitle, 
                { 
                  color: headerTextColor,
                  fontWeight: '700',
                }
              ]}
            >
              Resource Library
            </ThemedText>
            <ThemedText 
              type="body" 
              style={[
                styles.headerSubtitle, 
                { 
                  color: headerTextColor,
                  opacity: 0.8,
                }
              ]}
            >
              Discover helpful resources and materials
            </ThemedText>
          </View>
          {userRole && canCreateResources(userRole as UserRole) && (
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: headerTextColor + '20' }]}
              onPress={() => router.push('/create-resource')}
              accessibilityLabel="Upload new resource"
            >
              <Ionicons name="add-circle-outline" size={24} color={headerTextColor} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={[styles.scrollView, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Role-based access notice */}
          {isPeerEducator && (
            <View style={[styles.noticeCard, { backgroundColor: colors.info + '15', borderColor: colors.info + '30' }]}>
              <MaterialIcons name="info-outline" size={20} color={colors.info} />
              <ThemedText type="small" style={[styles.noticeText, { color: colors.text }]}>
                You have access to curated resources and limited community resources (supervised).
              </ThemedText>
            </View>
          )}

          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: searchBgColor, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, createInputStyle(), { color: colors.text }]}
              placeholder="Search resources..."
              placeholderTextColor={colors.icon}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.icon} />
              </TouchableOpacity>
            )}
          </View>

          {/* Content Organization Categories - Professional sections */}
          <View style={styles.section}>
            <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
              Browse by Topic
            </ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.contentCategoriesContent}
            >
              {contentCategories.map((cat) => {
                const isSelected = selectedContentCategory === cat.id;
                const categoryResources = resources.filter((r) => r.category === cat.id);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.contentCategoryCard,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.card,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                      createShadow(2, '#000', 0.08),
                    ]}
                    onPress={() => {
                      setSelectedContentCategory(isSelected ? null : cat.id);
                      setSelectedCategory('all'); // Reset type filter when selecting content category
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.contentCategoryIcon,
                        {
                          backgroundColor: isSelected
                            ? '#FFFFFF'
                            : colors.primary + '20',
                        },
                      ]}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={24}
                        color={isSelected ? colors.primary : colors.primary}
                      />
                    </View>
                    <ThemedText
                      type="body"
                      style={{
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontWeight: '700',
                        marginTop: Spacing.sm,
                        fontSize: 13,
                      }}
                      numberOfLines={2}
                    >
                      {cat.label}
                    </ThemedText>
                    <ThemedText
                      type="small"
                      style={{
                        color: isSelected ? '#FFFFFF' : colors.icon,
                        marginTop: Spacing.xs,
                        fontSize: 11,
                      }}
                    >
                      {categoryResources.length} resources
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Resource Type Filters - Pill-shaped buttons */}
          <View style={styles.categoriesContainer}>
            <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text, marginBottom: Spacing.sm }]}>
              Filter by Type
            </ThemedText>
            <FlatList
              horizontal
              data={resourceTypeCategories}
              renderItem={({ item }) => {
                const isSelected = selectedCategory === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected ? selectedFilterColor : filterBgColor,
                        borderColor: isSelected ? selectedFilterColor : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setSelectedCategory(item.id);
                      if (item.id !== 'all') {
                        setSelectedContentCategory(null); // Reset content category when selecting type
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={16}
                      color={isSelected ? '#FFFFFF' : colors.icon}
                    />
                    <ThemedText
                      type="small"
                      style={{
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontWeight: '600',
                        marginLeft: Spacing.xs,
                      }}
                    >
                      {item.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContent}
            />
          </View>

          {/* Favorites Toggle */}
          <TouchableOpacity
            style={[
              styles.favoritesToggle,
              {
                backgroundColor: showFavoritesOnly ? colors.primary : filterBgColor,
                borderColor: showFavoritesOnly ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <MaterialIcons
              name={showFavoritesOnly ? 'favorite' : 'favorite-border'}
              size={20}
              color={showFavoritesOnly ? '#FFFFFF' : colors.icon}
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

          {/* Featured Resources */}
          {featuredResources.length > 0 && !showFavoritesOnly && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
                  Featured Resources
                </ThemedText>
                <TouchableOpacity onPress={() => setSelectedCategory('all')}>
                  <ThemedText type="small" style={{ color: colors.primary }}>
                    See All
                  </ThemedText>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredScroll}>
                {featuredResources.map((item) => (
                  <View key={item.id} style={styles.featuredCardWrapper}>
                    {renderResourceCard({ item })}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Resources Grid */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
                  {showFavoritesOnly ? 'Favorite Resources' : 'All Resources'}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                  {filteredResources.length} {filteredResources.length === 1 ? 'resource' : 'resources'}
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
                <MaterialIcons name="inbox" size={64} color={colors.icon} />
                <ThemedText type="h3" style={{ color: colors.text, marginTop: Spacing.md }}>
                  No resources found
                </ThemedText>
                <ThemedText type="body" style={{ color: colors.icon, marginTop: Spacing.sm, textAlign: 'center' }}>
                  {showFavoritesOnly 
                    ? 'You haven\'t favorited any resources yet' 
                    : 'Try adjusting your search or filters'}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Coping Strategies */}
          {copingStrategies.length > 0 && !showFavoritesOnly && selectedCategory === 'all' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
                  Coping Strategies
                </ThemedText>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {copingStrategies.map((item) => {
                  const isFavorite = favorites.has(item.id);
                  const typeColor = getResourceTypeColor(item.resourceType, colors);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.horizontalCard, { backgroundColor: colors.card }, createShadow(1, '#000', 0.05)]}
                      onPress={() => router.push(`/resource/${item.id}`)}
                    >
                      <View style={[styles.horizontalIcon, { backgroundColor: typeColor + '20' }]}>
                        <Ionicons name={getResourceIcon(item.resourceType) as any} size={28} color={typeColor} />
                      </View>
                      <ThemedText type="body" style={[styles.horizontalTitle, { color: colors.text }]} numberOfLines={2}>
                        {item.title}
                      </ThemedText>
                      <TouchableOpacity
                        style={styles.horizontalFavorite}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.id);
                        }}
                      >
                        <Ionicons
                          name={isFavorite ? 'heart' : 'heart-outline'}
                          size={18}
                          color={isFavorite ? colors.danger : colors.icon}
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Academic Resources */}
          {academicResources.length > 0 && !showFavoritesOnly && selectedCategory === 'all' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
                  Academic Support
                </ThemedText>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {academicResources.map((item) => {
                  const isFavorite = favorites.has(item.id);
                  const typeColor = getResourceTypeColor(item.resourceType, colors);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.horizontalCard, { backgroundColor: colors.card }, createShadow(1, '#000', 0.05)]}
                      onPress={() => router.push(`/resource/${item.id}`)}
                    >
                      <View style={[styles.horizontalIcon, { backgroundColor: typeColor + '20' }]}>
                        <Ionicons name={getResourceIcon(item.resourceType) as any} size={28} color={typeColor} />
                      </View>
                      <ThemedText type="body" style={[styles.horizontalTitle, { color: colors.text }]} numberOfLines={2}>
                        {item.title}
                      </ThemedText>
                      <TouchableOpacity
                        style={styles.horizontalFavorite}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.id);
                        }}
                      >
                        <Ionicons
                          name={isFavorite ? 'heart' : 'heart-outline'}
                          size={18}
                          color={isFavorite ? colors.danger : colors.icon}
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
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
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    ...PlatformStyles.shadow,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    ...PlatformStyles.shadow,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.xs,
    fontSize: 16,
  },
  categoriesContainer: {
    marginBottom: Spacing.lg,
  },
  categoriesContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  contentCategoriesContent: {
    gap: Spacing.md,
    paddingRight: Spacing.md,
  },
  contentCategoryCard: {
    width: 140,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  contentCategoryIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    ...getCursorStyle(),
  },
  favoritesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    marginBottom: Spacing.lg,
    ...getCursorStyle(),
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 20,
  },
  featuredScroll: {
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  featuredCardWrapper: {
    width: width * 0.75,
    marginRight: Spacing.md,
  },
  resourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  resourceCardWrapper: {
    width: CARD_WIDTH,
  },
  resourceCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  cardHeader: {
    position: 'relative',
    width: '100%',
    height: 160,
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
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  favoriteButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...PlatformStyles.shadow,
  },
  cardContent: {
    padding: Spacing.md,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
    fontSize: 15,
    lineHeight: 20,
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: Spacing.sm,
    opacity: 0.7,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: 10,
  },
  horizontalScroll: {
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  horizontalCard: {
    width: 140,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  horizontalIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  horizontalTitle: {
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  horizontalFavorite: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
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
