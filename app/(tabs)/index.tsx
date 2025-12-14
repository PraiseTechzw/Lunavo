/**
 * Home Dashboard Screen - Enhanced Version
 */

import { DrawerHeader } from '@/components/navigation/drawer-header';
import { DrawerMenu } from '@/components/navigation/drawer-menu';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCurrentUser } from '@/lib/database';
import { UserRole } from '@/lib/permissions';
import { getRecommendedResources } from '@/lib/recommendations';
import { Resource } from '@/types';
import { createShadow, getCursorStyle } from '@/utils/platform-styles';
import { getResourceIcon, getResourceTypeColor, getResourceTypeLabel } from '@/utils/resource-utils';
import {
  getCheckInStreak,
  getPosts,
  getPseudonym,
  hasCheckedInToday
} from '@/utils/storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Motivational quotes
const motivationalQuotes = [
  "You're stronger than you think. Keep going!",
  "Every small step forward is progress. Celebrate it!",
  "Your mental health matters. Take care of yourself.",
  "It's okay not to be okay. You're not alone.",
  "Tomorrow is a fresh start. You've got this!",
  "Self-care isn't selfish. It's essential.",
  "You're doing better than you think. Keep going!",
];

// Quick tips
const quickTips = [
  { iconName: 'water-outline', title: 'Stay Hydrated', tip: 'Drink water regularly to keep your mind sharp' },
  { iconName: 'leaf-outline', title: 'Take Breaks', tip: 'Short breaks help improve focus and reduce stress' },
  { iconName: 'body-outline', title: 'Breathe Deeply', tip: 'Deep breathing can calm your nervous system' },
  { iconName: 'document-text-outline', title: 'Journal Your Thoughts', tip: 'Writing helps process emotions effectively' },
  { iconName: 'walk-outline', title: 'Move Your Body', tip: 'Even a short walk can boost your mood' },
  { iconName: 'moon-outline', title: 'Prioritize Sleep', tip: 'Quality sleep is crucial for mental health' },
];

/**
 * Validate if a URL is a supported image format for thumbnails
 * Filters out SVG and other unsupported formats to prevent loading errors
 */
function isValidImageUrl(url: string | undefined): boolean {
  if (!url) return false;
  
  // Check if URL is valid format
  if (!url.startsWith('http') && !url.startsWith('file://') && !url.startsWith('data:')) {
    return false;
  }
  
  // Filter out unsupported formats (SVG, etc.)
  const urlLower = url.toLowerCase();
  const unsupportedFormats = ['.svg', 'svg+xml', 'image/svg'];
  if (unsupportedFormats.some(format => urlLower.includes(format))) {
    return false;
  }
  
  // Check for common image extensions
  const supportedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
  const hasSupportedExtension = supportedExtensions.some(ext => urlLower.includes(ext));
  
  // If it's a data URI, check the mime type
  if (url.startsWith('data:')) {
    const mimeType = url.split(';')[0].split(':')[1];
    return mimeType?.startsWith('image/') && !mimeType.includes('svg') || false;
  }
  
  // For URLs without clear extension, allow if it's from a known image host
  return hasSupportedExtension || urlLower.includes('image') || urlLower.includes('thumbnail');
}

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const [userName, setUserName] = useState('Student');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [checkInStreak, setCheckInStreak] = useState(0);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [postCount, setPostCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [currentQuote] = useState(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<any>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [recommendedResources, setRecommendedResources] = useState<Resource[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  
  // Calculate FAB position: tab bar height (80) + spacing (8) + safe area bottom
  const fabBottom = Platform.OS === 'web' ? 24 : 80 + 8 + insets.bottom;

  useEffect(() => {
    loadUserData();
    
    // Redirect to role-specific dashboards if needed
    if (userRole) {
      if (userRole === 'counselor' || userRole === 'life-coach') {
        // Counselors should use their dashboard, not student home
        // But we'll show student home with counselor-specific content
      } else if (userRole === 'admin') {
        // Admin can access admin dashboard via sidebar
      } else if (userRole === 'student-affairs') {
        // Student Affairs should be redirected (handled in _layout.tsx)
      }
    }
  }, [userRole]);

  useEffect(() => {
    // Reload recommendations when user changes
    if (user?.id) {
      loadRecommendedResources();
    } else {
      // Clear recommendations if no user
      setRecommendedResources([]);
    }
  }, [user?.id]);

  useEffect(() => {
    // Rotate tips every 5 seconds
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % quickTips.length);
    }, 5000);
    return () => clearInterval(tipInterval);
  }, []);

  const loadRecommendedResources = async () => {
    try {
      const currentUser = user || await getCurrentUser();
      if (!currentUser?.id) {
        setRecommendedResources([]);
        return;
      }
      
      setLoadingRecommendations(true);
      const recommendations = await getRecommendedResources(currentUser.id, 6);
      
      // Extract resources from recommendations (they're already mapped in the recommendation function)
      // Filter out any invalid resources
      const mappedResources = recommendations
        .map((rec) => rec.resource)
        .filter((resource): resource is Resource => 
          resource != null && 
          resource.id != null && 
          resource.title != null &&
          resource.resourceType != null
        );
      
      setRecommendedResources(mappedResources);
    } catch (error) {
      console.error('Error loading recommended resources:', error);
      // Set empty array on error to prevent UI issues
      setRecommendedResources([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const loadUserData = async () => {
    await Promise.all([
      loadUserInfo(),
      loadStats(),
    ]);
    // Load recommendations after user info is loaded
    if (user?.id) {
      await loadRecommendedResources();
    }
  };

  const loadUserInfo = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setUserRole(currentUser.role as UserRole);
        
        // Priority: username (user input) > pseudonym > 'Student'
        if (currentUser.username && currentUser.username.trim()) {
          // Use the actual username the user input during registration
          setUserName(currentUser.username.trim());
        } else {
          // Fall back to pseudonym if username is not available
          const savedPseudonym = await getPseudonym();
          if (savedPseudonym) {
            setUserName(savedPseudonym.split(/(?=[A-Z])/)[0] || 'Student');
          } else if (currentUser.pseudonym) {
            setUserName(currentUser.pseudonym);
          } else {
            setUserName('Student');
          }
        }
      } else {
        // If no user found, try to get pseudonym from storage
        const pseudonym = await getPseudonym();
        if (pseudonym) {
          setUserName(pseudonym.split(/(?=[A-Z])/)[0] || 'Student');
        } else {
          setUserName('Student');
        }
      }
    } catch (error) {
      console.error('Error loading user info:', error);
      // Fallback: try to get pseudonym from storage
      const pseudonym = await getPseudonym();
      if (pseudonym) {
        setUserName(pseudonym.split(/(?=[A-Z])/)[0] || 'Student');
      } else {
        setUserName('Student');
      }
    }
  };

  const loadStats = async () => {
    const [streak, checkedIn, posts] = await Promise.all([
      getCheckInStreak(),
      hasCheckedInToday(),
      getPosts(),
    ]);
    setCheckInStreak(streak);
    setHasCheckedIn(checkedIn);
    setPostCount(posts.length);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getFormattedDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return today.toLocaleDateString('en-US', options);
  };

  const moods = [
    { id: 'happy', iconName: 'sentiment-very-satisfied', iconFamily: 'MaterialIcons', label: 'Happy', color: '#FBBF24' }, // sentiment_very_satisfied - yellow
    { id: 'calm', iconName: 'sentiment-satisfied', iconFamily: 'MaterialIcons', label: 'Calm', color: '#10B981' }, // sentiment_calm - green
    { id: 'okay', iconName: 'sentiment-neutral', iconFamily: 'MaterialIcons', label: 'Okay', color: '#F97316' }, // sentiment_neutral - orange
    { id: 'sad', iconName: 'sentiment-dissatisfied', iconFamily: 'MaterialIcons', label: 'Sad', color: '#3B82F6' }, // sentiment_sad - blue
    { id: 'anxious', iconName: 'sentiment-very-dissatisfied', iconFamily: 'MaterialIcons', label: 'Anxious', color: '#8B5CF6' }, // sentiment_stressed - purple
  ];

  const currentTip = quickTips[currentTipIndex];

  const isWeb = Platform.OS === 'web';
  const isMobile = Platform.OS !== 'web';

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
      <ThemedView style={styles.container}>
        {/* Drawer Header - Mobile Only */}
        {isMobile && (
          <DrawerHeader
            title={`${getGreeting()}, ${userName}`}
            onMenuPress={() => setDrawerVisible(true)}
            rightAction={{
              icon: 'settings',
              onPress: () => router.push('/profile-settings'),
            }}
          />
        )}
        
        {/* Fixed Header - Desktop/Web Only */}
        {isWeb && (
          <View style={[styles.header, { backgroundColor: colors.background }]}>
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#A2D2FF' + '20' }]}>
                  <MaterialIcons name="support-agent" size={24} color="#A2D2FF" />
                </View>
                <View>
                  <ThemedText type="h2" style={styles.greeting}>
                    {getGreeting()}, {userName}
                  </ThemedText>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/profile-settings')}
                style={[styles.iconButton, getCursorStyle()]}
              >
                <MaterialIcons name="settings" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >

        {/* Urgent Support Card */}
        <View style={[
          styles.urgentCard,
          { backgroundColor: colors.card },
          createShadow(3, '#000', 0.08),
        ]}>
          <View style={styles.urgentContent}>
            <View style={styles.urgentLeft}>
              <ThemedText type="h3" style={[styles.urgentTitle, { color: colors.text }]}>
                Urgent Support
              </ThemedText>
              <ThemedText type="caption" style={[styles.urgentDescription, { color: colors.icon }]}>
                Access counsellors and crisis lines now.
              </ThemedText>
              <TouchableOpacity
                style={[styles.accessButton, { backgroundColor: colors.danger }]}
                onPress={() => router.push('/urgent-support')}
                activeOpacity={0.8}
              >
                <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                  Access Now
                </ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.sosContainer}>
              <MaterialIcons name="sos" size={48} color={colors.danger} />
            </View>
          </View>
        </View>

        {/* Mood Check-in */}
        <View style={styles.section}>
          <ThemedText type="h2" style={[styles.moodSectionTitle, { marginBottom: Spacing.md }]}>
            How are you feeling today?
          </ThemedText>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodContainer}
          >
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodChip,
                  {
                    backgroundColor: mood.color + '15', // 15% opacity background
                    borderColor: mood.color,
                    borderWidth: 2,
                  },
                  createShadow(2, mood.color, 0.2),
                ]}
                onPress={() => {
                  setSelectedMood(mood.id);
                  router.push('/check-in');
                }}
                activeOpacity={0.7}
              >
                {mood.iconFamily === 'MaterialIcons' ? (
                  <MaterialIcons name={mood.iconName as any} size={24} color={mood.color} />
                ) : (
                  <Ionicons name={mood.iconName as any} size={24} color={mood.color} />
                )}
                <ThemedText type="small" style={[styles.moodChipLabel, { color: mood.color, fontWeight: '600' }]}>
                  {mood.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Support Modalities */}
        <View style={styles.cardRow}>
          <TouchableOpacity
            style={[
              styles.supportCard,
              { backgroundColor: colors.card },
              createShadow(1, '#000', 0.05),
            ]}
            onPress={() => router.push('/(tabs)/forum')}
            activeOpacity={0.8}
          >
              <MaterialIcons name="forum" size={32} color="#A2D2FF" />
            <View style={styles.supportCardContent}>
              <ThemedText type="body" style={styles.cardTitle}>
                Peer Support Forum
              </ThemedText>
              <ThemedText type="small" style={[styles.cardDescription, { color: colors.icon }]}>
                Connect with the community
              </ThemedText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.supportCard,
              { backgroundColor: colors.card },
              createShadow(1, '#000', 0.05),
            ]}
            onPress={() => router.push('/(tabs)/chat')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="chat" size={32} color="#BDE0FE" />
            <View style={styles.supportCardContent}>
              <ThemedText type="body" style={styles.cardTitle}>
                Anonymous Chat
              </ThemedText>
              <ThemedText type="small" style={[styles.cardDescription, { color: colors.icon }]}>
                Talk one-on-one with a peer
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recommended Resources Section */}
        {recommendedResources.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <ThemedText type="h2" style={[styles.sectionTitle, { color: colors.text }]}>
                  Recommended for You
                </ThemedText>
                <ThemedText type="small" style={[styles.sectionSubtitle, { color: colors.icon }]}>
                  Based on your interests and activity
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/resources')}
                style={getCursorStyle()}
              >
                <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600' }}>
                  See All
                </ThemedText>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendedResourcesContent}
            >
              {recommendedResources.map((resource) => {
                // Safety checks
                if (!resource || !resource.id || !resource.resourceType) {
                  return null;
                }

                const typeColor = getResourceTypeColor(resource.resourceType, colors);
                const isImageType = resource.resourceType === 'image' || resource.resourceType === 'infographic';
                const isVideoType = resource.resourceType === 'video' || resource.resourceType === 'short-video';
                const isPDF = resource.resourceType === 'pdf' && 
                              !resource.tags?.some((tag: string) => tag.startsWith('type:image') || tag.startsWith('type:infographic'));
                
                const hasThumbnail = 
                  !isPDF && 
                  isValidImageUrl(resource.thumbnailUrl) &&
                  (isImageType || isVideoType);

                return (
                  <TouchableOpacity
                    key={resource.id}
                    style={[
                      styles.recommendedResourceCard,
                      { backgroundColor: colors.card },
                      createShadow(2, '#000', 0.08),
                    ]}
                    onPress={() => {
                      if (resource.id) {
                        router.push(`/resource/${resource.id}`);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    {/* Thumbnail or Icon */}
                    <View style={styles.recommendedResourceHeader}>
                      {hasThumbnail && resource.thumbnailUrl ? (
                        <ExpoImage
                          source={{ uri: resource.thumbnailUrl }}
                          style={styles.recommendedResourceThumbnail}
                          contentFit="cover"
                          transition={200}
                          cachePolicy="memory-disk"
                          onError={() => {
                            // Silently fail - fallback to icon is automatic
                          }}
                        />
                      ) : (
                        <LinearGradient
                          colors={[typeColor + '20', typeColor + '10']}
                          style={styles.recommendedResourceIconContainer}
                        >
                          <Ionicons name={getResourceIcon(resource.resourceType) as any} size={32} color={typeColor} />
                        </LinearGradient>
                      )}
                      
                      {/* Type Badge */}
                      <View style={[styles.recommendedResourceBadge, { backgroundColor: typeColor }]}>
                        <Ionicons name={getResourceIcon(resource.resourceType) as any} size={10} color="#FFFFFF" />
                        <ThemedText type="small" style={styles.recommendedResourceBadgeText}>
                          {getResourceTypeLabel(resource.resourceType)}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Content */}
                    <View style={styles.recommendedResourceContent}>
                      <ThemedText 
                        type="body" 
                        style={[styles.recommendedResourceTitle, { color: colors.text }]} 
                        numberOfLines={2}
                      >
                        {resource.title || 'Untitled Resource'}
                      </ThemedText>
                      {resource.description && (
                        <ThemedText 
                          type="small" 
                          style={[styles.recommendedResourceDescription, { color: colors.icon }]} 
                          numberOfLines={2}
                        >
                          {resource.description}
                        </ThemedText>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Resources Card */}
        <TouchableOpacity
          style={[
            styles.resourceCard,
            { backgroundColor: colors.card },
            createShadow(1, '#000', 0.05),
          ]}
          onPress={() => router.push('/(tabs)/resources')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="book" size={32} color="#CDB4DB" />
          <View style={styles.resourceContent}>
            <ThemedText type="body" style={styles.cardTitle}>
              Explore Resources
            </ThemedText>
            <ThemedText type="small" style={[styles.cardDescription, { color: colors.icon }]}>
              Find mental health and academic tips.
            </ThemedText>
          </View>
          <MaterialIcons name="arrow-forward-ios" size={20} color={colors.icon} />
        </TouchableOpacity>

        {/* Peer Educator Dashboard Card - Only for Peer Educators */}
        {(userRole === 'peer-educator' || userRole === 'peer-educator-executive') && (
          <TouchableOpacity
            style={[
              styles.resourceCard,
              { backgroundColor: colors.primary + '10', borderWidth: 2, borderColor: colors.primary + '30' },
              createShadow(2, colors.primary, 0.15),
            ]}
            onPress={() => router.push('/peer-educator/dashboard' as any)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="volunteer-activism" size={32} color={colors.primary} />
            <View style={styles.resourceContent}>
              <ThemedText type="body" style={[styles.cardTitle, { color: colors.primary, fontWeight: '700' }]}>
                Peer Educator Dashboard
              </ThemedText>
              <ThemedText type="small" style={[styles.cardDescription, { color: colors.icon }]}>
                View posts needing support and manage your responses
              </ThemedText>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Join Peer Educator Club Card - For Students */}
        {userRole === 'student' && (
          <TouchableOpacity
            style={[
              styles.resourceCard,
              { backgroundColor: '#4CAF50' + '10', borderWidth: 2, borderColor: '#4CAF50' + '30' },
              createShadow(2, '#4CAF50', 0.15),
            ]}
            onPress={() => router.push('/join-peer-educator' as any)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="people" size={32} color="#4CAF50" />
            <View style={styles.resourceContent}>
              <ThemedText type="body" style={[styles.cardTitle, { color: '#4CAF50', fontWeight: '700' }]}>
                Join Peer Educator Club
              </ThemedText>
              <ThemedText type="small" style={[styles.cardDescription, { color: colors.icon }]}>
                Become a peer educator and help support fellow students
              </ThemedText>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={20} color="#4CAF50" />
          </TouchableOpacity>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Floating Action Button - Role-based */}
      {userRole === 'peer-educator' || userRole === 'peer-educator-executive' ? (
        <TouchableOpacity
          style={[
            styles.fab,
            { 
              backgroundColor: colors.primary,
              bottom: fabBottom,
            },
            createShadow(8, colors.primary, 0.3),
          ]}
          onPress={() => router.push('/peer-educator/posts' as any)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="reply" size={20} color="#FFFFFF" />
          <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '500', marginLeft: Spacing.xs }}>
            Respond
          </ThemedText>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.fab,
            { 
              backgroundColor: '#136dec',
              bottom: fabBottom,
            },
            createShadow(8, '#136dec', 0.3),
          ]}
          onPress={() => router.push('/create-post')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={20} color="#FFFFFF" />
          <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '500', marginLeft: Spacing.xs }}>
            Ask for Help
          </ThemedText>
        </TouchableOpacity>
      )}
      
      {/* Drawer Menu */}
      <DrawerMenu
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        role={userRole || undefined}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  greeting: {
    fontWeight: '700',
  },
  dateText: {
    marginTop: 2,
    fontSize: 13,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    minHeight: 100,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  quoteCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  quoteIcon: {
    marginBottom: Spacing.xs,
  },
  quoteText: {
    fontStyle: 'italic',
    lineHeight: 22,
  },
  tipCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tipTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipTitle: {
    fontWeight: '600',
  },
  tipIndicators: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  tipDot: {
    borderRadius: 4,
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  tipIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTextContainer: {
    flex: 1,
  },
  tipHeading: {
    fontWeight: '600',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  urgentCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  urgentContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  urgentLeft: {
    flex: 2,
    marginRight: Spacing.md,
  },
  urgentTitle: {
    marginBottom: Spacing.xs,
    fontWeight: '700',
  },
  urgentDescription: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  accessButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  sosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
    flex: 1,
  },
  sosText: {
    fontSize: 48,
    fontWeight: '900',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 20,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
  },
  moodSectionTitle: {
    fontWeight: '700',
    fontSize: 24,
    marginTop: Spacing.lg,
  },
  moodContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingRight: Spacing.md,
    paddingLeft: 0,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    minHeight: 48,
    gap: Spacing.sm,
  },
  moodChipLabel: {
    fontWeight: '500',
    fontSize: 14,
  },
  cardRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  supportCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    minHeight: 150,
    justifyContent: 'space-between',
  },
  supportCardContent: {
    marginTop: 'auto',
    gap: 4,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  resourceContent: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: '700',
    marginBottom: 4,
    fontSize: 16,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  actionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 56,
    justifyContent: 'center',
    zIndex: 1000,
  },
  recommendedResourcesContent: {
    gap: Spacing.md,
    paddingRight: Spacing.md,
  },
  recommendedResourceCard: {
    width: 200,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  recommendedResourceHeader: {
    position: 'relative',
    width: '100%',
    height: 120,
  },
  recommendedResourceThumbnail: {
    width: '100%',
    height: '100%',
  },
  recommendedResourceIconContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendedResourceBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 3,
  },
  recommendedResourceBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
  },
  recommendedResourceContent: {
    padding: Spacing.md,
  },
  recommendedResourceTitle: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
    fontSize: 14,
    lineHeight: 18,
  },
  recommendedResourceDescription: {
    fontSize: 11,
    lineHeight: 15,
    opacity: 0.7,
  },
});
