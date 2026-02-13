/**
 * Resource Detail Screen
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { getResource } from '@/lib/database';
import { Resource } from '@/app/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

const FAVORITES_KEY = 'resource_favorites';
const DOWNLOADS_KEY = 'resource_downloads';

export default function ResourceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const loadResource = useCallback(async () => {
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
  }, [id]);

  const checkFavoriteStatus = useCallback(async () => {
    try {
      const favoritesJson = await AsyncStorage.getItem(FAVORITES_KEY);
      if (favoritesJson) {
        const favorites = JSON.parse(favoritesJson);
        setIsFavorite(favorites.includes(id));
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  }, [id]);

  const checkDownloadStatus = useCallback(async () => {
    try {
      const downloadsJson = await AsyncStorage.getItem(DOWNLOADS_KEY);
      if (downloadsJson) {
        const downloads = JSON.parse(downloadsJson);
        setIsDownloaded(downloads.some((d: any) => d.id === id));
      }
    } catch (error) {
      console.error('Error checking download status:', error);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadResource();
      checkFavoriteStatus();
      checkDownloadStatus();
    }
  }, [id, loadResource, checkFavoriteStatus, checkDownloadStatus]);

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

      // Open resource URL if available
      if (resource.url) {
        const canOpen = await Linking.canOpenURL(resource.url);
        if (canOpen) {
          await Linking.openURL(resource.url);
        } else {
          Alert.alert('Error', 'Cannot open this resource URL.');
        }
      } else {
        Alert.alert('Downloaded', 'Resource saved to your downloads.');
      }
    } catch (error) {
      console.error('Error downloading resource:', error);
      Alert.alert('Error', 'Failed to download resource.');
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

  const getResourceIcon = () => {
    switch (resource.resourceType) {
      case 'article':
        return 'article';
      case 'video':
        return 'video-library';
      case 'pdf':
        return 'picture-as-pdf';
      case 'link':
        return 'link';
      default:
        return 'description';
    }
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
          {/* Resource Header */}
          <View style={[styles.resourceHeader, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <View style={[styles.resourceIcon, { backgroundColor: colors.primary + '20' }]}>
              <MaterialIcons name={getResourceIcon() as any} size={48} color={colors.primary} />
            </View>
            <ThemedText type="h2" style={styles.resourceTitle}>
              {resource.title}
            </ThemedText>
            <View style={styles.resourceMeta}>
              <ThemedText type="small" style={{ color: colors.icon }}>
                {resource.category} • {resource.resourceType}
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
              <MaterialIcons name="download" size={24} color="#FFFFFF" />
              <ThemedText
                type="body"
                style={{ color: '#FFFFFF', marginLeft: Spacing.sm, fontWeight: '600' }}
              >
                {isDownloaded ? 'Open' : 'Download'}
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
                {resource.resourceType}
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
  resourceHeader: {
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  resourceIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
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
});

