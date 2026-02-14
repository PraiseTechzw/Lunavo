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
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResourceCategoryScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [resources, setResources] = useState<Resource[]>([]);
  const [filtered, setFiltered] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const categoryMap: Record<string, string> = useMemo(
    () => ({
      "mental-health": "Mental Health",
      "substance-abuse": "Substance Abuse",
      "sexual-health": "SRH",
      "stis-hiv": "HIV/Safe Sex",
      "family-home": "Family/Home",
      academic: "Academic",
      relationships: "Relationships",
    }),
    [],
  );

  const title = categoryMap[slug ?? ""] || "Resources";

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
    let items = resources.filter((r) => r.category === slug);
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q),
      );
    }
    setFiltered(items);
  }, [resources, slug, searchQuery]);

  useEffect(() => {
    filter();
  }, [filter]);

  const isImageUrl = (u?: string) =>
    !!u && ["png", "jpg", "jpeg", "webp", "gif"].some((ext) => u.toLowerCase().includes(`.${ext}`));

  const renderItem = ({ item, index }: { item: Resource, index: number }) => {
    const getIcon = () => {
      switch (item.resourceType) {
        case "article": return "book-open-variant";
        case "video": return "play-circle-outline";
        case "pdf": return "file-pdf-box";
        case "link": return "link-variant";
        default: return "file-document-outline";
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
          <View style={[styles.thumb, { backgroundColor: typeColor + "15" }]}>
            {isImageUrl(item.url || (item as any).filePath) ? (
              <Image
                source={{ uri: (item.url || (item as any).filePath) as string }}
                style={styles.thumbImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <MaterialCommunityIcons name={getIcon() as any} size={32} color={typeColor} />
            )}
          </View>
          <View style={styles.content}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.typeBadge, { backgroundColor: typeColor + "10" }]}>
                <ThemedText style={[styles.typeBadgeText, { color: typeColor }]}>
                  {item.resourceType}
                </ThemedText>
              </View>
            </View>
            <ThemedText type="h3" style={styles.title} numberOfLines={2}>
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
            <ThemedText type="h2" style={styles.headerTitle}>{title}</ThemedText>
            <ThemedText style={styles.headerSubtitle}>{filtered.length} resources</ThemedText>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={22} color={colors.icon} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={`Search in ${title}...`}
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearBtn} activeOpacity={0.7}>
              <MaterialIcons name="cancel" size={20} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color={colors.primary} />
            <ThemedText style={{ marginTop: 12 }}>Loading category...</ThemedText>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons name="book-search-outline" size={64} color={colors.icon} />
            <ThemedText type="h3" style={styles.emptyTitle}>Nothing here yet</ThemedText>
            <ThemedText style={styles.emptySubtitle}>No resources found in this category.</ThemedText>
            <TouchableOpacity
              style={[styles.resetBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.back()}
            >
              <ThemedText style={styles.resetBtnText}>Go Back</ThemedText>
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
