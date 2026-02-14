/**
 * Resource Library Screen
 */

import { Skeleton } from "@/app/components/loading-skeleton";
import { FAB as FABButton } from "@/app/components/navigation/fab-button";
import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import { BorderRadius, Colors, Spacing } from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { Resource, UserRole } from "@/app/types";
import { createInputStyle, createShadow } from "@/app/utils/platform-styles";
import { getCurrentUser, getResources } from "@/lib/database";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FAVORITES_KEY = "resource_favorites";

const categories = [
  "All",
  "Mental Health",
  "Substance Abuse",
  "SRH",
  "HIV/Safe Sex",
  "Family/Home",
  "Academic",
  "Relationships",
  "Articles",
  "Videos",
  "PDFs",
];

const copingStrategies: any[] = [
  {
    id: "1",
    title: "Mindfulness Exercises",
    resourceType: "article",
    category: "mental-health",
    iconName: "body-outline",
    color: "#90EE90",
  },
  {
    id: "2",
    title: "Breathing Techniques",
    resourceType: "article",
    category: "mental-health",
    iconName: "leaf-outline",
    color: "#DDA0DD",
  },
  {
    id: "3",
    title: "Stress Management",
    resourceType: "video",
    category: "mental-health",
    iconName: "medical-outline",
    color: "#87CEEB",
  },
];

const academicResources: any[] = [
  {
    id: "1",
    title: "Effective Study Habits",
    resourceType: "article",
    category: "academic",
    iconName: "book-outline",
  },
  {
    id: "2",
    title: "Time Management",
    resourceType: "video",
    category: "academic",
    iconName: "time",
  },
];

export default function ResourcesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [viewMode, setViewMode] = useState<"library" | "gallery">("library");
  const { width } = Dimensions.get("window");
  const ITEM_SPACING = Spacing.sm;
  const NUM_COLUMNS = 2;
  const H_PADDING = Spacing.md;
  const THUMB_SIZE = Math.floor(
    (width - H_PADDING * 2 - ITEM_SPACING * (NUM_COLUMNS - 1)) / NUM_COLUMNS,
  );

  const getCategoryCount = (label: string): number => {
    const map: Record<string, { cat?: string; type?: string }> = {
      "Mental Health": { cat: "mental-health" },
      "Substance Abuse": { cat: "substance-abuse" },
      SRH: { cat: "sexual-health" },
      "HIV/Safe Sex": { cat: "stis-hiv" },
      "Family/Home": { cat: "family-home" },
      Academic: { cat: "academic" },
      Relationships: { cat: "relationships" },
      Articles: { type: "article" },
      Videos: { type: "video" },
      PDFs: { type: "pdf" },
    };
    if (label === "All") return resources.length;
    const rule = map[label];
    if (!rule) return resources.length;
    return resources.filter((r) => {
      if (rule.cat) return r.category === rule.cat;
      if (rule.type) return r.resourceType === rule.type;
      return true;
    }).length;
  };

  useEffect(() => {
    loadResources();
    loadFavorites();
    loadUserRole();
  }, []);

  const filterResources = useCallback(() => {
    let filtered = resources;

    // Filter by category or resource type
    if (selectedCategory !== "All") {
      filtered = filtered.filter((r) => {
        const categoryMap: Record<string, { cat?: string; type?: string }> = {
          "Mental Health": { cat: "mental-health" },
          "Substance Abuse": { cat: "substance-abuse" },
          SRH: { cat: "sexual-health" },
          "HIV/Safe Sex": { cat: "stis-hiv" },
          "Family/Home": { cat: "family-home" },
          Academic: { cat: "academic" },
          Relationships: { cat: "relationships" },
          Articles: { type: "article" },
          Videos: { type: "video" },
          PDFs: { type: "pdf" },
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
          (r.description || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
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
      console.error("Error loading resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRole = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setUserRole(user.role as UserRole);
      }
    } catch (error) {
      console.error("Error loading user role:", error);
    }
  };

  const loadFavorites = async () => {
    try {
      const favoritesJson = await AsyncStorage.getItem(FAVORITES_KEY);
      if (favoritesJson) {
        setFavorites(new Set(JSON.parse(favoritesJson)));
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  // duplicate removed: filterResources defined above with useCallback

  const toggleFavorite = async (resourceId: string) => {
    try {
      const newFavorites = new Set(favorites);
      if (newFavorites.has(resourceId)) {
        newFavorites.delete(resourceId);
      } else {
        newFavorites.add(resourceId);
      }
      setFavorites(newFavorites);
      await AsyncStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(Array.from(newFavorites)),
      );
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const getGalleryItems = (): {
    id: string;
    url: string;
    type: "image" | "video";
  }[] => {
    const isImage = (u?: string) =>
      !!u &&
      ["png", "jpg", "jpeg", "webp", "gif"].some((ext) =>
        u.toLowerCase().includes(`.${ext}`),
      );
    const isVideo = (u?: string) =>
      !!u &&
      ["mp4", "mov", "webm", "mkv"].some((ext) =>
        u.toLowerCase().includes(`.${ext}`),
      );

    return resources
      .map((r) => {
        const url = r.url || r.filePath || "";
        if (!url) return null;
        if (isImage(url)) return { id: r.id, url, type: "image" as const };
        if (isVideo(url)) return { id: r.id, url, type: "video" as const };
        return null;
      })
      .filter(Boolean) as {
      id: string;
      url: string;
      type: "image" | "video";
    }[];
  };

  const renderGalleryItem = ({
    item,
    index,
  }: {
    item: { id: string; url: string; type: "image" | "video" };
    index: number;
  }) => (
    <TouchableOpacity
      style={[
        styles.galleryItem,
        {
          backgroundColor: colors.surface,
          marginRight:
            index % NUM_COLUMNS === NUM_COLUMNS - 1 ? 0 : ITEM_SPACING,
          width: THUMB_SIZE,
          height: THUMB_SIZE,
        },
        createShadow(2, "#000", 0.1),
      ]}
      activeOpacity={0.8}
      onPress={() => router.push(`/resource/${item.id}`)}
    >
      <Image
        source={{ uri: item.url }}
        <View style={styles.galleryOverlay}>
          <View style={[styles.galleryPlayBg, { backgroundColor: "rgba(0,0,0,0.3)" }]} />
          <MaterialIcons name="play-circle-filled" size={36} color="#FFFFFF" />
        </View>
      />
      {item.type === "video" && (
        <View style={styles.galleryOverlay}>

  const isImageUrl = (u?: string) =>
    !!u &&
    ["png", "jpg", "jpeg", "webp", "gif"].some((ext) =>
      u.toLowerCase().includes(`.${ext}`),
    );

  const renderResourceCard = ({
    item,
    index,
  }: {
    item: Resource;
    index: number;
  }) => {
    const isFavorite = favorites.has(item.id);
    const getResourceIcon = () => {
      switch (item.resourceType) {
        case "article":
          return "library-outline";
        case "video":
          return "videocam-outline";
        case "pdf":
          return "document-text-outline";
        case "link":
          return "link-outline";
        default:
          return "document-outline";
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.resourceCard,
          {
            backgroundColor: colors.card,
            marginRight:
              index % NUM_COLUMNS === NUM_COLUMNS - 1 ? 0 : ITEM_SPACING,
          },
          createShadow(2, "#000", 0.1),
        ]}
        activeOpacity={0.8}
        onPress={() => router.push(`/resource/${item.id}`)}
      >
        <View
          style={[
            styles.resourceImage,
            { backgroundColor: colors.primary + "20" },
          ]}
        >
          {isImageUrl(item.url || (item as any).filePath) ? (
            <Image
              source={{ uri: (item.url || (item as any).filePath) as string }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <Ionicons
          <View style={[styles.typeBadge, { backgroundColor: colors.card }]}>
            <MaterialIcons
              name={
                item.resourceType === "video"
                  ? "videocam"
                  : item.resourceType === "pdf"
                  ? "picture-as-pdf"
                  : item.resourceType === "article"
                  ? "library-books"
                  : "insert-link"
              }
              size={14}
              color={colors.text}
            />
            <ThemedText type="small" style={{ marginLeft: 6, fontSize: 10 }}>
              {item.resourceType.toUpperCase()}
            </ThemedText>
          </View>
              name={getResourceIcon() as any}
        <View style={styles.resourceContent}>
          <ThemedText
            type="body"
            style={styles.resourceTitle}
            numberOfLines={2}
          >
            {item.title}
          </ThemedText>
          <ThemedText type="small" style={styles.resourceMeta}>
            {item.category} • {item.resourceType}
          </ThemedText>
          {Array.isArray((item as any).tags) &&
            (item as any).tags.length > 0 && (
              <View style={styles.tagsRow}>
                {(item as any).tags.slice(0, 3).map((tag: string) => (
                  <View
                    key={tag}
                    style={[
                      styles.tagChip,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <ThemedText
                      type="small"
                      style={{ color: colors.text, fontSize: 10 }}
                    >
                      {tag}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}
        </View>
        <TouchableOpacity
          style={styles.bookmarkButton}
          onPress={(e) => {
            e.stopPropagation();
            toggleFavorite(item.id);
          }}
        >
          <Ionicons
            name={isFavorite ? "bookmark" : "bookmark-outline"}
            size={20}
            color={isFavorite ? colors.primary : colors.icon}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeAreaTop}>
      <ThemedView style={styles.container}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <ThemedText type="h1" style={styles.heroTitle}>
            Resource Center
          </ThemedText>
          <ThemedText type="body" style={styles.heroSubtitle}>
            Articles, videos, documents, and media in one beautiful place
          </ThemedText>
          <View style={styles.segmentContainer}>
            {["library", "gallery"].map((mode) => {
              const isActive = viewMode === (mode as any);
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.segmentChip,
                    {
                      backgroundColor: isActive
                        ? "#FFFFFF"
                        : "rgba(255,255,255,0.2)",
                    },
                  ]}
                  onPress={() => setViewMode(mode as any)}
                  activeOpacity={0.8}
                >
                  <ThemedText
                    type="small"
                    style={{
                      color: isActive ? colors.primary : "#FFFFFF",
                      fontWeight: "700",
                    }}
                  >
                    {mode === "library" ? "Library" : "Gallery"}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </LinearGradient>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          stickyHeaderIndices={[0]}
          showsVerticalScrollIndicator={false}
        >
          {/* Sticky Header (Search + Favorites + Filters) */}
          <View
            style={[
              styles.stickyHeader,
              {
                backgroundColor: colors.background,
                borderBottomColor: colors.border,
              },
              createShadow(1, "#000", 0.04),
            ]}
          >
            {/* Search Bar */}
            <View
              style={[
                styles.searchContainer,
                { backgroundColor: colors.surface, borderColor: colors.border },
                createShadow(2, "#000", 0.08),
              ]}
            >
              <Ionicons
                name="search"
                size={20}
                color={colors.icon}
                style={styles.searchIcon}
              />
              <TextInput
                style={[
                  styles.searchInput,
                  createInputStyle(),
                  { color: colors.text },
                ]}
                placeholder="Search for articles, videos..."
                placeholderTextColor={colors.icon}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  style={styles.searchClearBtn}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="close" size={18} color={colors.icon} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.favoritesToggle,
                {
                  backgroundColor: showFavoritesOnly
                    ? colors.primary
                    : colors.surface,
                },
                createShadow(1, "#000", 0.05),
              ]}
              onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={showFavoritesOnly ? "favorite" : "favorite-border"}
                size={20}
                color={showFavoritesOnly ? "#FFFFFF" : colors.text}
              />
              <ThemedText
                type="body"
                style={{
                  color: showFavoritesOnly ? "#FFFFFF" : colors.text,
                  marginLeft: Spacing.sm,
                  fontWeight: "600",
                }}
              >
                {showFavoritesOnly ? "Show All" : "Show Favorites"}
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
                          selectedCategory === item
                            ? colors.primary
                            : colors.surface,
                        borderColor: colors.border,
                      },
                      selectedCategory === item
                        ? createShadow(2, colors.primary, 0.25)
                        : {},
                    ]}
                    onPress={() => setSelectedCategory(item)}
                    activeOpacity={0.7}
                  >
                    <ThemedText
                      type="small"
                      style={{
                        color:
                          selectedCategory === item ? "#FFFFFF" : colors.text,
                        fontWeight: "600",
                      }}
                    >
                    {item !== "All" && (
                      <View style={[styles.countBadge, { backgroundColor: selectedCategory === item ? "#FFFFFF22" : colors.surface }]}>
                        <ThemedText
                          type="small"
                          style={{
                            color: selectedCategory === item ? "#FFFFFF" : colors.icon,
                            fontSize: 10,
                            fontWeight: "700",
                          }}
                        >
                          {getCategoryCount(item)}
                        </ThemedText>
                      </View>
                    )}
                      {item}
                    </ThemedText>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersContent}
              />

          {/* Content */}
          {viewMode === "library" ? (
            <View style={styles.section}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                {showFavoritesOnly ? "Favorite Resources" : "All Resources"} (
                {filteredResources.length})
              </ThemedText>
              {loading ? (
                <View>
                  <View style={styles.row}>
                    <View
                      style={[
                        styles.resourceCard,
                        { backgroundColor: colors.card },
                        createShadow(2, "#000", 0.08),
                      ]}
                    >
                      <Skeleton
                        width="100%"
                        height={120}
                        borderRadius={BorderRadius.md}
                      />
                      <View style={styles.resourceContent}>
                        <Skeleton width="80%" height={16} />
                        <Skeleton
                          width="50%"
                          height={12}
                          style={{ marginTop: Spacing.xs }}
                        />
                      </View>
                    </View>
                    <View
                      style={[
                        styles.resourceCard,
                        { backgroundColor: colors.card },
                        createShadow(2, "#000", 0.08),
                      ]}
                    >
                      <Skeleton
                        width="100%"
                        height={120}
                        borderRadius={BorderRadius.md}
                      />
                      <View style={styles.resourceContent}>
                        <Skeleton width="75%" height={16} />
                        <Skeleton
                          width="60%"
                          height={12}
                          style={{ marginTop: Spacing.xs }}
                        />
                      </View>
                    </View>
                  </View>
                  <View style={styles.row}>
                    <View
                      style={[
                        styles.resourceCard,
                        { backgroundColor: colors.card },
                        createShadow(2, "#000", 0.08),
                      ]}
                    >
                      <Skeleton
                        width="100%"
                        height={120}
                        borderRadius={BorderRadius.md}
                      />
                      <View style={styles.resourceContent}>
                        <Skeleton width="85%" height={16} />
                        <Skeleton
                          width="40%"
                          height={12}
                          style={{ marginTop: Spacing.xs }}
                        />
                      </View>
                    </View>
                    <View
                      style={[
                        styles.resourceCard,
                        { backgroundColor: colors.card },
                        createShadow(2, "#000", 0.08),
                      ]}
                    >
                      <Skeleton
                        width="100%"
                        height={120}
                        borderRadius={BorderRadius.md}
                      />
                      <View style={styles.resourceContent}>
                        <Skeleton width="70%" height={16} />
                        <Skeleton
                          width="55%"
                          height={12}
                          style={{ marginTop: Spacing.xs }}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              ) : filteredResources.length > 0 ? (
                <FlatList
                  data={filteredResources}
                  renderItem={({ item, index }) =>
                    renderResourceCard({ item, index })
                  }
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  numColumns={2}
                  columnWrapperStyle={styles.row}
                  contentContainerStyle={styles.gridList}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="inbox" size={48} color={colors.icon} />
                  <ThemedText
                    type="body"
                    style={{ color: colors.icon, marginTop: Spacing.md }}
                  >
                    {showFavoritesOnly
                      ? "No favorite resources yet"
                      : "No resources found"}
                  </ThemedText>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.section}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Gallery ({getGalleryItems().length})
              </ThemedText>
              {loading ? (
                <View>
                  <View style={styles.row}>
                    <View
                      style={[
                        styles.galleryItem,
                        createShadow(2, "#000", 0.08),
                        { width: THUMB_SIZE, height: THUMB_SIZE },
                      ]}
                    >
                      <Skeleton
                        width="100%"
                        height={THUMB_SIZE}
                        borderRadius={BorderRadius.md}
                      />
                    </View>
                    <View
                      style={[
                        styles.galleryItem,
                        createShadow(2, "#000", 0.08),
                        { width: THUMB_SIZE, height: THUMB_SIZE },
                      ]}
                    >
                      <Skeleton
                        width="100%"
                        height={THUMB_SIZE}
                        borderRadius={BorderRadius.md}
                      />
                    </View>
                  </View>
                  <View style={styles.row}>
                    <View
                      style={[
                        styles.galleryItem,
                        createShadow(2, "#000", 0.08),
                        { width: THUMB_SIZE, height: THUMB_SIZE },
                      ]}
                    >
                      <Skeleton
                        width="100%"
                        height={THUMB_SIZE}
                        borderRadius={BorderRadius.md}
                      />
                    </View>
                    <View
                      style={[
                        styles.galleryItem,
                        createShadow(2, "#000", 0.08),
                        { width: THUMB_SIZE, height: THUMB_SIZE },
                      ]}
                    >
                      <Skeleton
                        width="100%"
                        height={THUMB_SIZE}
                        borderRadius={BorderRadius.md}
                      />
                    </View>
                  </View>
                </View>
              ) : getGalleryItems().length > 0 ? (
                <FlatList
                  data={getGalleryItems()}
                  renderItem={({ item, index }) =>
                    renderGalleryItem({ item, index })
                  }
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  columnWrapperStyle={styles.row}
                  contentContainerStyle={styles.gridList}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <MaterialIcons
                    name="image-not-supported"
                    size={48}
                    color={colors.icon}
                  />
                  <ThemedText
                    type="body"
                    style={{ color: colors.icon, marginTop: Spacing.md }}
                  >
                    No media found
                  </ThemedText>
                </View>
              )}
            </View>
          )}

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
                  createShadow(1, "#000", 0.05),
                ]}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.copingIcon,
                    { backgroundColor: item.color + "30" },
                  ]}
                >
                  <Ionicons
                    name={item.iconName as any}
                    size={28}
                    color={item.color}
                  />
                </View>
                <View style={styles.copingContent}>
                  <ThemedText type="body" style={styles.copingTitle}>
                    {item.title}
                  </ThemedText>
                  <ThemedText type="small" style={styles.copingMeta}>
                    {item.duration || item.resourceType}
                  </ThemedText>
                </View>
                <TouchableOpacity>
                  <Ionicons
                    name="bookmark-outline"
                    size={20}
                    color={colors.icon}
                  />
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
              renderItem={({ item }) => renderResourceCard({ item, index: 0 })}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
          <View style={{ height: 140 }} />
        </ScrollView>
      </ThemedView>
      {userRole === "peer-educator-executive" || userRole === "admin" ? (
        <FABButton
          icon="cloud-upload"
          onPress={() => router.push("/executive/new-resource")}
          position="bottom-right"
          color={colors.primary}
        />
      ) : null}
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
  hero: {
    padding: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.85)",
    marginTop: Spacing.xs,
  },
  segmentContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  segmentChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  searchClearBtn: {
    marginLeft: Spacing.xs,
    padding: 6,
    borderRadius: BorderRadius.sm,
  },
  filtersContainer: {
    marginBottom: Spacing.lg,
  },
  filtersContent: {
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    borderWidth: 1,
    letterSpacing: 0.2,
  },
  countBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  horizontalList: {
    gap: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: "700",
  },
  resourceCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  resourceImage: {
    width: "100%",
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadge: {
    position: "absolute",
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  resourceTitle: {
    fontWeight: "600",
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  resourceMeta: {
    opacity: 0.7,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tagsRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  tagChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  bookmarkButton: {
    position: "absolute",
    bottom: Spacing.sm,
    right: Spacing.sm,
  },
  resourceContent: {
    padding: Spacing.sm,
    flex: 1,
  },
  copingCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  copingIcon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  copingContent: {
    flex: 1,
  },
  copingTitle: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  copingMeta: {
    opacity: 0.7,
  },
  favoritesToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  gridList: {
    paddingBottom: Spacing.xl,
  },
  galleryItem: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  galleryOverlay: {
    position: "absolute",
    right: Spacing.sm,
    bottom: Spacing.sm,
  },
  galleryPlayBg: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    right: 2,
    bottom: 2,
  },
  stickyHeader: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    opacity: 0.5,
  },
});
