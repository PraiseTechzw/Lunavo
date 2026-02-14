import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import { Colors, Spacing } from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { Resource } from "@/app/types";
import { createShadow } from "@/app/utils/platform-styles";
import { getResources } from "@/lib/database";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResourceListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; cat?: string }>();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [resources, setResources] = useState<Resource[]>([]);
  const [filtered, setFiltered] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState(params.q ?? "");

  const slugToLabel: Record<string, string> = {
    "mental-health": "Mental Health",
    "substance-abuse": "Substance Abuse",
    "sexual-health": "SRH",
    "stis-hiv": "HIV/Safe Sex",
    "family-home": "Family/Home",
    academic: "Academic",
    relationships: "Relationships",
  };

  const initialCat =
    params.cat && typeof params.cat === "string"
      ? slugToLabel[params.cat] || params.cat
      : "All";

  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [loading, setLoading] = useState(true);

  const categories = useMemo(
    () => [
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
    ],
    [],
  );

  const categoryMap: Record<string, { cat?: string; type?: string }> = useMemo(
    () => ({
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
    }),
    [],
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const all = await getResources();
        setResources(all);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filter = useCallback(() => {
    let items = resources;
    if (selectedCategory !== "All") {
      const mapped = categoryMap[selectedCategory] || undefined;
      const slug = Object.entries(categoryMap).find(
        ([label]) => label === selectedCategory,
      )?.[1]?.cat;
      const catRule = mapped?.cat || slug;
      const typeRule = mapped?.type;
      if (catRule || typeRule) {
        items = items.filter((r) => {
          if (catRule) return r.category === catRule;
          if (typeRule) return r.resourceType === typeRule;
          return true;
        });
      }
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q),
      );
    }
    setFiltered(items);
  }, [resources, selectedCategory, searchQuery, categoryMap]);

  useEffect(() => {
    filter();
  }, [filter]);

  const isImageUrl = (u?: string) =>
    !!u &&
    ["png", "jpg", "jpeg", "webp", "gif"].some((ext) =>
      u.toLowerCase().includes(`.${ext}`),
    );

  const renderItem = ({ item, index }: { item: Resource, index: number }) => {
    const getIcon = () => {
      switch (item.resourceType) {
        case "article":
          return "book-open-variant";
        case "video":
          return "play-circle-outline";
        case "pdf":
          return "file-pdf-box";
        case "link":
          return "link-variant";
        default:
          return "file-document-outline";
      }
    };

    const typeColors: Record<string, string> = {
      article: "#6366F1",
      video: "#10B981",
      pdf: "#EF4444",
      link: "#8B5CF6",
      training: "#F59E0B"
    };

    const typeColor = typeColors[item.resourceType] || colors.primary;

    return (
      <Animated.View entering={FadeInDown.delay(index * 50)} layout={Layout.springify()}>
        <TouchableOpacity
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            createShadow(4, "#000", 0.05),
          ]}
          activeOpacity={0.8}
          onPress={() => router.push(`/resource/${item.id}`)}
        >
          <View
            style={[styles.thumb, { backgroundColor: typeColor + "15" }]}
          >
            {isImageUrl(item.url || (item as any).filePath) ? (
              <Image
                source={{ uri: (item.url || (item as any).filePath) as string }}
                style={styles.thumbImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <MaterialCommunityIcons
                name={getIcon() as any}
                size={32}
                color={typeColor}
              />
            )}
          </View>
          <View style={styles.content}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.typeBadge, { backgroundColor: typeColor + "10" }]}>
                <ThemedText style={[styles.typeBadgeText, { color: typeColor }]}>
                  {item.resourceType}
                </ThemedText>
              </View>
              <ThemedText style={styles.categoryLabel}>
                {slugToLabel[item.category] || item.category}
              </ThemedText>
            </View>
            <ThemedText
              type="h3"
              style={styles.title}
              numberOfLines={2}
            >
              {item.title}
            </ThemedText>
            <ThemedText type="small" style={styles.description} numberOfLines={1}>
              {item.description || "No description available"}
            </ThemedText>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.icon} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <ThemedText type="h2" style={styles.headerTitle}>
              Library
            </ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              {filtered.length} resources found
            </ThemedText>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={22}
            color={colors.icon}
            style={styles.searchIcon}
          />
          <TextInput
            style={[
              styles.searchInput,
              { color: colors.text },
            ]}
            placeholder="Search by title or topic..."
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearBtn}
            >
              <MaterialIcons name="cancel" size={20} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            data={categories}
            renderItem={({ item }) => {
              const active = selectedCategory === item;
              return (
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? colors.primary : colors.surface,
                      borderColor: active ? colors.primary : colors.border,
                    },
                    active ? createShadow(4, colors.primary, 0.2) : {},
                  ]}
                  onPress={() => setSelectedCategory(item)}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    type="small"
                    style={{
                      color: active ? "#FFFFFF" : colors.text,
                      fontWeight: active ? "800" : "600",
                    }}
                  >
                    {item}
                  </ThemedText>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
          />
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ThemedText>Fetching resources...</ThemedText>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons name="book-search-outline" size={64} color={colors.icon} />
            <ThemedText type="h3" style={styles.emptyTitle}>No resources found</ThemedText>
            <ThemedText style={styles.emptySubtitle}>Try changing your search or category filter</ThemedText>
            <TouchableOpacity
              style={[styles.resetBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
            >
              <ThemedText style={styles.resetBtnText}>Clear All Filters</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filtered}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontWeight: "900",
  },
  headerSubtitle: {
    fontSize: 12,
    opacity: 0.5,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 54,
    borderRadius: 20,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    fontWeight: "500",
  },
  clearBtn: {
    padding: 4,
  },
  filtersContainer: {
    marginBottom: Spacing.md,
  },
  filterList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  listContent: {
    paddingBottom: 40,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    padding: Spacing.sm,
    borderWidth: 1,
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    gap: 4,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  categoryLabel: {
    fontSize: 10,
    opacity: 0.4,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 20,
  },
  description: {
    fontSize: 12,
    opacity: 0.6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  emptyTitle: {
    marginTop: 16,
    fontWeight: "800",
  },
  emptySubtitle: {
    textAlign: "center",
    opacity: 0.5,
    marginTop: 4,
    marginBottom: 24,
  },
  resetBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  resetBtnText: {
    color: "#FFF",
    fontWeight: "800",
  }
});
