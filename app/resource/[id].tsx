/**
 * Resource Detail Screen
 */

import { PDFViewer } from '@/app/components/resource-viewers/pdf-viewer';
import { VideoPlayer } from '@/app/components/resource-viewers/video-player';
import { WebViewer } from '@/app/components/resource-viewers/web-viewer';
import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Resource } from '@/app/types';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { getResource } from '@/lib/database';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FAVORITES_KEY = 'resource_favorites';
const DOWNLOADS_KEY = 'resource_downloads';

export default function ResourceDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  // Handle array values from useLocalSearchParams (expo-router can return arrays)
  const id = Array.isArray(params.id) ? params.id[0] : (params.id || '');
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [showWebViewer, setShowWebViewer] = useState(false);

  useEffect(() => {
    if (id) {
      loadResource();
      checkFavoriteStatus();
      checkDownloadStatus();
    }
  }, [id]);

  const loadResource = async () => {
    try {
      if (!id) return;
      const resourceData = await getResource(id);
      setResource(resourceData);
    } catch (error) {
      console.error('Error loading resource:', error);
      Alert.alert('Error', 'Failed to load resource. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const favoritesJson = await AsyncStorage.getItem(FAVORITES_KEY);
      if (favoritesJson) {
        const favorites = JSON.parse(favoritesJson);
        setIsFavorite(favorites.includes(id));
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const checkDownloadStatus = async () => {
    try {
      const downloadsJson = await AsyncStorage.getItem(DOWNLOADS_KEY);
      if (downloadsJson) {
        const downloads = JSON.parse(downloadsJson);
        setIsDownloaded(downloads.some((d: any) => d.id === id));
      }
    } catch (error) {
      console.error('Error checking download status:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      const favoritesJson = await AsyncStorage.getItem(FAVORITES_KEY);
      let favorites = favoritesJson ? JSON.parse(favoritesJson) : [];

      if (isFavorite) {
        favorites = favorites.filter((fid: string) => fid !== id);
      } else {
        if (!favorites.includes(id)) {
          favorites.push(id);
        }
      }

      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDownload = async () => {
    if (!resource) return;

    try {
      // Record download
      const downloadsJson = await AsyncStorage.getItem(DOWNLOADS_KEY);
      let downloads = downloadsJson ? JSON.parse(downloadsJson) : [];

      const downloadRecord = {
        id: resource.id,
        title: resource.title,
        url: resource.url || resource.filePath || '',
        resourceType: resource.resourceType,
        description: resource.description || '',
        category: resource.category,
        downloadedAt: new Date().toISOString(),
      };

      const existingIndex = downloads.findIndex((d: any) => d.id === resource.id);
      if (existingIndex >= 0) {
        downloads[existingIndex] = downloadRecord;
      } else {
        downloads.push(downloadRecord);
      }

      await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));
      setIsDownloaded(true);
      Alert.alert('Downloaded', 'Resource has been saved to your downloads.');
    } catch (error) {
      console.error('Error downloading resource:', error);
      Alert.alert('Error', 'Failed to download resource. Please try again.');
    }
  };

  const handleViewInApp = () => {
    if (!resource) return;

    const resourceType = resource.resourceType;
    const resourceUrl = resource.url || resource.filePath;

    if (!resourceUrl) {
      Alert.alert('Error', 'No content URL available for this resource.');
      return;
    }

    // Open appropriate in-app viewer based on resource type
    if (resourceType === 'video' || resourceType === 'short-video') {
      setShowVideoPlayer(true);
    } else if (resourceType === 'pdf') {
      setShowPDFViewer(true);
    } else if (resourceType === 'link' || resourceType === 'article' || resourceType === 'short-article') {
      setShowWebViewer(true);
    } else {
      Alert.alert('Info', 'This resource type is displayed directly in the app.');
    }
  };

  const handleShare = async () => {
    if (!resource) return;

    try {
      await Share.share({
        message: `Check out this resource: ${resource.title}\n${resource.description || ''}`,
        title: resource.title,
      });
    } catch (error) {
      console.error('Error sharing resource:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText>Loading resource...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (!resource) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText>Resource not found</ThemedText>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <ThemedText style={{ color: '#FFFFFF' }}>Go Back</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </SafeAreaView>
    );
  }

  // Get resource type color
  const getResourceTypeColor = (resourceType: string): string => {
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
  };

  const getResourceIcon = () => {
    const resourceType = resource.resourceType || 'link';
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
  };

  const getResourceTypeLabel = (resourceType: string | undefined): string => {
    if (!resourceType) return 'Resource';
    switch (resourceType) {
      case 'short-article':
        return 'Short Article';
      case 'short-video':
        return 'Short Video';
      default:
        return resourceType.charAt(0).toUpperCase() + resourceType.slice(1);
    }
  };

  const typeColor = getResourceTypeColor(resource.resourceType || 'link');
  const resourceUrl = resource.url || resource.filePath || '';
  const hasThumbnail = resource.thumbnailUrl;
  const { width } = Dimensions.get('window');

  // Render resource content based on type
  const renderResourceContent = () => {
    if (!resourceUrl) {
      return (
        <View style={[styles.noContentContainer, { backgroundColor: colors.surface }]}>
          <MaterialIcons name={getResourceIcon() as any} size={64} color={colors.icon} />
          <ThemedText type="body" style={{ color: colors.icon, marginTop: Spacing.md, textAlign: 'center' }}>
            No content available for this resource
          </ThemedText>
        </View>
      );
    }

    // Images and Infographics - display directly (use thumbnail if available, otherwise use URL)
    if (resource.resourceType === 'image' || resource.resourceType === 'infographic') {
      const imageUrl = hasThumbnail ? resource.thumbnailUrl : resourceUrl;
      return (
        <View style={styles.imageContainer}>
          <ExpoImage
            source={{ uri: imageUrl }}
            style={styles.resourceImage}
            contentFit="contain"
            transition={200}
            cachePolicy="memory-disk"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
          />
          {imageLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        </View>
      );
    }

    // Videos - show thumbnail with play button, opens in-app video player
    if (resource.resourceType === 'video' || resource.resourceType === 'short-video') {
      return (
        <>
          <TouchableOpacity
            style={styles.videoContainer}
            onPress={handleViewInApp}
            activeOpacity={0.9}
          >
            {hasThumbnail ? (
              <ExpoImage
                source={{ uri: resource.thumbnailUrl }}
                style={styles.videoThumbnail}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            ) : (
              <LinearGradient
                colors={[typeColor + '40', typeColor + '20']}
                style={styles.videoPlaceholder}
              >
                <MaterialIcons name="play-circle-filled" size={80} color={typeColor} />
              </LinearGradient>
            )}
            <View style={styles.playButtonOverlay}>
              <View style={[styles.playButton, { backgroundColor: colors.primary + 'E6' }]}>
                <MaterialIcons name="play-arrow" size={48} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
          {showVideoPlayer && (
            <Modal
              visible={showVideoPlayer}
              animationType="slide"
              presentationStyle="fullScreen"
              onRequestClose={() => setShowVideoPlayer(false)}
            >
              <VideoPlayer
                uri={resourceUrl}
                thumbnailUri={resource.thumbnailUrl}
                title={resource.title}
                onClose={() => setShowVideoPlayer(false)}
              />
            </Modal>
          )}
        </>
      );
    }

    // PDFs - show preview with open button, opens in-app PDF viewer
    if (resource.resourceType === 'pdf') {
      return (
        <>
          <View style={[styles.documentContainer, { backgroundColor: colors.surface }]}>
            <View style={[styles.documentIconContainer, { backgroundColor: typeColor + '20' }]}>
              <MaterialIcons name={getResourceIcon() as any} size={64} color={typeColor} />
            </View>
            <ThemedText type="h3" style={[styles.documentTitle, { color: colors.text }]}>
              {resource.title}
            </ThemedText>
            <ThemedText type="body" style={[styles.documentSubtitle, { color: colors.icon }]}>
              {getResourceTypeLabel(resource.resourceType)}
            </ThemedText>
            <TouchableOpacity
              style={[styles.openButton, { backgroundColor: colors.primary }]}
              onPress={handleViewInApp}
            >
              <MaterialIcons name="description" size={24} color="#FFFFFF" />
              <ThemedText type="body" style={{ color: '#FFFFFF', marginLeft: Spacing.sm, fontWeight: '600' }}>
                View PDF
              </ThemedText>
            </TouchableOpacity>
          </View>
          {showPDFViewer && (
            <Modal
              visible={showPDFViewer}
              animationType="slide"
              presentationStyle="fullScreen"
              onRequestClose={() => setShowPDFViewer(false)}
            >
              <PDFViewer
                uri={resourceUrl}
                title={resource.title}
                onClose={() => setShowPDFViewer(false)}
              />
            </Modal>
          )}
        </>
      );
    }

    // Articles and Links - show preview with open button, opens in-app web viewer
    if (resource.resourceType === 'link' || resource.resourceType === 'article' || resource.resourceType === 'short-article') {
      return (
        <>
          <View style={[styles.documentContainer, { backgroundColor: colors.surface }]}>
            <View style={[styles.documentIconContainer, { backgroundColor: typeColor + '20' }]}>
              <MaterialIcons name={getResourceIcon() as any} size={64} color={typeColor} />
            </View>
            <ThemedText type="h3" style={[styles.documentTitle, { color: colors.text }]}>
              {resource.title}
            </ThemedText>
            <ThemedText type="body" style={[styles.documentSubtitle, { color: colors.icon }]}>
              {getResourceTypeLabel(resource.resourceType)}
            </ThemedText>
            <TouchableOpacity
              style={[styles.openButton, { backgroundColor: colors.primary }]}
              onPress={handleViewInApp}
            >
              <MaterialIcons name="open-in-new" size={24} color="#FFFFFF" />
              <ThemedText type="body" style={{ color: '#FFFFFF', marginLeft: Spacing.sm, fontWeight: '600' }}>
                View Content
              </ThemedText>
            </TouchableOpacity>
          </View>
          {showWebViewer && (
            <Modal
              visible={showWebViewer}
              animationType="slide"
              presentationStyle="fullScreen"
              onRequestClose={() => setShowWebViewer(false)}
            >
              <WebViewer
                uri={resourceUrl}
                title={resource.title}
                onClose={() => setShowWebViewer(false)}
                allowExternalRedirects={false}
              />
            </Modal>
          )}
        </>
      );
    }

    // Default fallback
    return (
      <View style={[styles.documentContainer, { backgroundColor: colors.surface }]}>
        <View style={[styles.documentIconContainer, { backgroundColor: typeColor + '20' }]}>
          <MaterialIcons name={getResourceIcon() as any} size={64} color={typeColor} />
        </View>
        <ThemedText type="h3" style={[styles.documentTitle, { color: colors.text }]}>
          {resource.title}
        </ThemedText>
        <ThemedText type="body" style={[styles.documentSubtitle, { color: colors.icon }]}>
          {getResourceTypeLabel(resource.resourceType)}
        </ThemedText>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h2" style={styles.headerTitle}>
            Resource Details
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Resource Content - Displayed First */}
          <View style={[styles.resourceContentContainer, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            {renderResourceContent()}
          </View>

          {/* Resource Header with Title and Meta */}
          <View style={[styles.resourceHeader, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h2" style={styles.resourceTitle}>
              {resource.title}
            </ThemedText>
            <View style={styles.resourceMeta}>
              <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
                <MaterialIcons name={getResourceIcon() as any} size={14} color="#FFFFFF" />
                <ThemedText type="small" style={styles.typeBadgeText}>
                  {getResourceTypeLabel(resource.resourceType)}
                </ThemedText>
              </View>
              <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                {resource.category}
              </ThemedText>
            </View>
          </View>

          {/* Description */}
          {resource.description && (
            <View style={[styles.section, { backgroundColor: colors.card }, createShadow(1, '#000', 0.05)]}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Description
              </ThemedText>
              <ThemedText type="body" style={styles.description}>
                {resource.description}
              </ThemedText>
            </View>
          )}

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Tags
              </ThemedText>
              <View style={styles.tagsContainer}>
                {resource.tags.map((tag, index) => (
                  <View
                    key={index}
                    style={[styles.tag, { backgroundColor: colors.surface }]}
                  >
                    <ThemedText type="small" style={{ color: colors.text }}>
                      {tag}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: isFavorite ? colors.primary : colors.surface },
                createShadow(2, '#000', 0.1),
              ]}
              onPress={toggleFavorite}
            >
              <MaterialIcons
                name={isFavorite ? 'favorite' : 'favorite-border'}
                size={24}
                color={isFavorite ? '#FFFFFF' : colors.text}
              />
              <ThemedText
                type="body"
                style={{
                  color: isFavorite ? '#FFFFFF' : colors.text,
                  marginLeft: Spacing.sm,
                  fontWeight: '600',
                }}
              >
                {isFavorite ? 'Favorited' : 'Add to Favorites'}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.primary },
                createShadow(2, '#000', 0.1),
              ]}
              onPress={handleDownload}
            >
              <MaterialIcons name={isDownloaded ? "check-circle" : "download"} size={24} color="#FFFFFF" />
              <ThemedText
                type="body"
                style={{ color: '#FFFFFF', marginLeft: Spacing.sm, fontWeight: '600' }}
              >
                {isDownloaded ? 'Downloaded' : 'Download'}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.surface },
                createShadow(2, '#000', 0.1),
              ]}
              onPress={handleShare}
            >
              <MaterialIcons name="share" size={24} color={colors.text} />
              <ThemedText
                type="body"
                style={{ color: colors.text, marginLeft: Spacing.sm, fontWeight: '600' }}
              >
                Share
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Metadata */}
          <View style={[styles.metadataSection, { backgroundColor: colors.card }, createShadow(1, '#000', 0.05)]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Information
            </ThemedText>
            <View style={styles.metadataRow}>
              <ThemedText type="body" style={{ color: colors.icon }}>
                Category:
              </ThemedText>
              <ThemedText type="body" style={{ color: colors.text, fontWeight: '600' }}>
                {resource.category}
              </ThemedText>
            </View>
            <View style={styles.metadataRow}>
              <ThemedText type="body" style={{ color: colors.icon }}>
                Type:
              </ThemedText>
              <ThemedText type="body" style={{ color: colors.text, fontWeight: '600' }}>
                {getResourceTypeLabel(resource.resourceType)}
              </ThemedText>
            </View>
            {resource.createdAt && (
              <View style={styles.metadataRow}>
                <ThemedText type="body" style={{ color: colors.icon }}>
                  Added:
                </ThemedText>
                <ThemedText type="body" style={{ color: colors.text, fontWeight: '600' }}>
                  {format(new Date(resource.createdAt), 'MMM dd, yyyy')}
                </ThemedText>
              </View>
            )}
          </View>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  resourceContentContainer: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    minHeight: 300,
  },
  imageContainer: {
    width: '100%',
    minHeight: 300,
    position: 'relative',
  },
  resourceImage: {
    width: '100%',
    minHeight: 300,
    maxHeight: 600,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  videoContainer: {
    width: '100%',
    minHeight: 300,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoThumbnail: {
    width: '100%',
    minHeight: 300,
    maxHeight: 400,
  },
  videoPlaceholder: {
    width: '100%',
    minHeight: 300,
    maxHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    minHeight: 300,
    justifyContent: 'center',
  },
  documentIconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  documentTitle: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
    fontWeight: '700',
  },
  documentSubtitle: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  noContentContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  resourceHeader: {
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  resourceIcon: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  resourceThumbnail: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
    alignSelf: 'center',
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  resourceTitle: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
    fontWeight: '700',
  },
  resourceMeta: {
    marginTop: Spacing.xs,
  },
  section: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  description: {
    lineHeight: 22,
  },
  tagsSection: {
    marginBottom: Spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  tag: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  actionsSection: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  metadataSection: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  button: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  fullscreenViewer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: '#000',
  },
});

