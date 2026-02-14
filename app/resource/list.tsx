import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import { BorderRadius, Colors, Spacing } from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { Resource } from "@/app/types";
import { createInputStyle, createShadow } from "@/app/utils/platform-styles";
import { getResources } from "@/lib/database";
import { MaterialIcons } from "@expo/vector-icons";
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

  const renderItem = ({ item }: { item: Resource }) => {
    const getIcon = () => {
      switch (item.resourceType) {
        case "article":
          return "library-books";
        case "video":
          return "videocam";
        case "pdf":
          return "picture-as-pdf";
        case "link":
          return "link";
        default:
          return "description";
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: colors.card },
          createShadow(2, "#000", 0.1),
        ]}
        activeOpacity={0.8}
        onPress={() => router.push(`/resource/${item.id}`)}
      >
        <View
          style={[styles.thumb, { backgroundColor: colors.primary + "20" }]}
        >
          {isImageUrl(item.url || (item as any).filePath) ? (
            <Image
              source={{ uri: (item.url || (item as any).filePath) as string }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <MaterialIcons
              name={getIcon() as any}
              size={28}
              color={colors.primary}
            />
          )}
        </View>
        <View style={styles.content}>
          <ThemedText
            type="body"
            style={{ fontWeight: "600" }}
            numberOfLines={2}
          >
            {item.title}
          </ThemedText>
          <ThemedText type="small" style={{ opacity: 0.7 }}>
            {item.category} • {item.resourceType}
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h2" style={styles.headerTitle}>
            Resources
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
            createShadow(2, "#000", 0.08),
          ]}
        >
          <MaterialIcons
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
            placeholder="Search resources..."
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearBtn}
              activeOpacity={0.7}
            >
              <MaterialIcons name="close" size={18} color={colors.icon} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/resource/list",
                params: { q: searchQuery, cat: selectedCategory },
              })
            }
            style={styles.clearBtn}
            activeOpacity={0.7}
          >
            <MaterialIcons name="open-in-full" size={18} color={colors.icon} />
          </TouchableOpacity>
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
                      borderColor: colors.border,
                    },
                    active ? createShadow(2, colors.primary, 0.25) : {},
                  ]}
                  onPress={() => setSelectedCategory(item)}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    type="small"
                    style={{
                      color: active ? "#FFFFFF" : colors.text,
                      fontWeight: "600",
                    }}
                  >
                    {item}
                  </ThemedText>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: Spacing.sm }}
          />
        </View>

        {loading ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: Spacing.xl,
            }}
          >
            <ThemedText>Loading...</ThemedText>
          </View>
        ) : (
          <FlatList
            data={filtered}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingBottom: Spacing.xl,
              paddingHorizontal: Spacing.md,
              gap: Spacing.md,
            }}
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
  headerTitle: {
    fontWeight: "700",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
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
  clearBtn: {
    marginLeft: Spacing.xs,
    padding: 6,
    borderRadius: BorderRadius.sm,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  thumb: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});
