import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { getResources } from '@/lib/database';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const ITEM_SPACING = Spacing.sm;
const NUM_COLUMNS = 3;
const ITEM_SIZE = (width - ITEM_SPACING * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

type GalleryItem = {
  id: string;
  url: string;
  type: 'image' | 'video';
};

function isImageUrl(url?: string | null): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return u.endsWith('.png') || u.endsWith('.jpg') || u.endsWith('.jpeg') || u.endsWith('.webp') || u.endsWith('.gif');
}

function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return u.endsWith('.mp4') || u.endsWith('.mov') || u.endsWith('.webm') || u.endsWith('.mkv');
}

export default function GalleryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    loadResourcesForGallery();
  }, []);

  const loadResourcesForGallery = async () => {
    try {
      setLoading(true);
      const resources = await getResources();
      const galleryItems: GalleryItem[] = resources
        .map((r: any) => {
          const url = r.url || r.file_path || null;
          if (!url) return null;
          if (isImageUrl(url)) {
            return { id: r.id, url, type: 'image' as const };
          }
          if (isVideoUrl(url)) {
            return { id: r.id, url, type: 'video' as const };
          }
          return null;
        })
        .filter(Boolean) as GalleryItem[];
      setItems(galleryItems);
    } catch (error) {
      console.error('Error loading gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const images = useMemo(() => items.filter(i => i.type === 'image'), [items]);
  const videos = useMemo(() => items.filter(i => i.type === 'video'), [items]);

  const renderImageItem = ({ item }: { item: GalleryItem }) => (
    <TouchableOpacity
      style={[styles.gridItem, { backgroundColor: colors.surface }]}
      activeOpacity={0.8}
      onPress={() => router.push(`/resource/${item.id}`)}
    >
      <Image
        source={{ uri: item.url }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
    </TouchableOpacity>
  );

  const renderVideoItem = ({ item }: { item: GalleryItem }) => (
    <TouchableOpacity
      style={[styles.gridItem, { backgroundColor: colors.surface }]}
      activeOpacity={0.8}
      onPress={() => router.push(`/resource/${item.id}`)}
    >
      <View style={[styles.videoThumb, { backgroundColor: colors.card }]}>
        <MaterialIcons name="play-circle-outline" size={48} color={colors.icon} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="h2" style={styles.title}>Gallery</ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: colors.icon }]}>
            Uploaded images and videos from the Resource Center
          </ThemedText>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ThemedText>Loading gallery...</ThemedText>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="image-not-supported" size={64} color={colors.icon} />
            <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
              No media found
            </ThemedText>
          </View>
        ) : (
          <View style={styles.section}>
            {images.length > 0 && (
              <>
                <ThemedText type="h3" style={styles.sectionTitle}>
                  Images ({images.length})
                </ThemedText>
                <FlatList
                  data={images}
                  renderItem={renderImageItem}
                  keyExtractor={(i) => i.id}
                  numColumns={NUM_COLUMNS}
                  columnWrapperStyle={styles.row}
                  contentContainerStyle={styles.gridList}
                />
              </>
            )}

            {videos.length > 0 && (
              <>
                <ThemedText type="h3" style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
                  Videos ({videos.length})
                </ThemedText>
                <FlatList
                  data={videos}
                  renderItem={renderVideoItem}
                  keyExtractor={(i) => `v-${i.id}`}
                  numColumns={NUM_COLUMNS}
                  columnWrapperStyle={styles.row}
                  contentContainerStyle={styles.gridList}
                />
              </>
            )}
          </View>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontWeight: '700',
    fontSize: 20,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  section: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  sectionTitle: {
    marginLeft: Spacing.sm,
    marginBottom: Spacing.sm,
    fontWeight: '700',
  },
  gridList: {
    paddingBottom: Spacing.md,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: ITEM_SPACING,
    paddingHorizontal: ITEM_SPACING,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  videoThumb: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.xxl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.xxl,
  },
  emptyText: {
    marginTop: Spacing.md,
  },
});
