/**
 * Global Search Screen - Search posts, resources, users by pseudonym
 */

import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import { BorderRadius, Colors, Spacing } from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { Post, Resource, User } from "@/app/types";
import {
    createInputStyle,
    createShadow,
    getCursorStyle,
} from "@/app/utils/platform-styles";
import { getPosts, getResources, getUsers } from "@/lib/database";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SearchTab = "all" | "posts" | "resources" | "users";

interface SearchResult {
  type: "post" | "resource" | "user";
  id: string;
  title: string;
  subtitle: string;
  data: Post | Resource | User;
}

export default function SearchScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    loadRecentSearches();
  }, [loadRecentSearches]);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const debounceTimer = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setResults([]);
    }
  }, [searchQuery, activeTab, performSearch]);

  const loadRecentSearches = useCallback(async () => {
    try {
      const recent = await AsyncStorage.getItem("recent_searches");
      if (recent) {
        setRecentSearches(JSON.parse(recent));
      }
    } catch (error) {
      console.error("Error loading recent searches:", error);
    }
  }, []);

  const saveRecentSearch = useCallback(
    async (query: string) => {
      try {
        const updated = [
          query,
          ...recentSearches.filter((s) => s !== query),
        ].slice(0, 10);
        setRecentSearches(updated);
        await AsyncStorage.setItem("recent_searches", JSON.stringify(updated));
      } catch (error) {
        console.error("Error saving recent search:", error);
      }
    },
    [recentSearches],
  );

  const performSearch = useCallback(
    async (query: string) => {
      if (query.trim().length === 0) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const searchResults: SearchResult[] = [];

        // Search posts
        if (activeTab === "all" || activeTab === "posts") {
          const posts = await getPosts();
          const matchingPosts = posts.filter(
            (post) =>
              post.title.toLowerCase().includes(query.toLowerCase()) ||
              post.content.toLowerCase().includes(query.toLowerCase()) ||
              post.tags.some((tag) =>
                tag.toLowerCase().includes(query.toLowerCase()),
              ),
          );

          matchingPosts.forEach((post) => {
            searchResults.push({
              type: "post",
              id: post.id,
              title: post.title,
              subtitle: `${post.category} • ${formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}`,
              data: post,
            });
          });
        }

        // Search resources
        if (activeTab === "all" || activeTab === "resources") {
          const resources = await getResources();
          const matchingResources = resources.filter(
            (resource) =>
              resource.title.toLowerCase().includes(query.toLowerCase()) ||
              (resource.description || "")
                .toLowerCase()
                .includes(query.toLowerCase()) ||
              (resource.tags || []).some((tag) =>
                tag.toLowerCase().includes(query.toLowerCase()),
              ),
          );

          matchingResources.forEach((resource) => {
            searchResults.push({
              type: "resource",
              id: resource.id,
              title: resource.title,
              subtitle: `${resource.category} • ${resource.resourceType}`,
              data: resource,
            });
          });
        }

        // Search users (by pseudonym)
        if (activeTab === "all" || activeTab === "users") {
          const users = await getUsers();
          const matchingUsers = users.filter((user) =>
            user.pseudonym.toLowerCase().includes(query.toLowerCase()),
          );

          matchingUsers.forEach((user) => {
            searchResults.push({
              type: "user",
              id: user.id,
              title: user.pseudonym,
              subtitle: user.role,
              data: user,
            });
          });
        }

        setResults(searchResults);
        if (searchResults.length > 0) {
          await saveRecentSearch(query);
        }
      } catch (error) {
        console.error("Error performing search:", error);
      } finally {
        setLoading(false);
      }
    },
    [activeTab, saveRecentSearch],
  );

  const handleResultPress = (result: SearchResult) => {
    if (result.type === "post") {
      router.push(`/post/${result.id}`);
    } else if (result.type === "resource") {
      router.push(`/resource/${result.id}`);
    } else if (result.type === "user") {
      router.push(`/profile/${result.id}`);
    }
  };

  const handleRecentSearchPress = (query: string) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setResults([]);
  };

  const renderResult = ({ item }: { item: SearchResult }) => {
    let icon: string;
    let iconColor: string;

    if (item.type === "post") {
      icon = "forum";
      iconColor = colors.primary;
    } else if (item.type === "resource") {
      icon = "description";
      iconColor = colors.accent;
    } else {
      icon = "person";
      iconColor = colors.success;
    }

    return (
      <TouchableOpacity
        style={[
          styles.resultItem,
          { backgroundColor: colors.card },
          createShadow(1, "#000", 0.05),
        ]}
        onPress={() => handleResultPress(item)}
        activeOpacity={0.7}
      >
        <View
          style={[styles.resultIcon, { backgroundColor: iconColor + "20" }]}
        >
          <MaterialIcons name={icon as any} size={24} color={iconColor} />
        </View>
        <View style={styles.resultContent}>
          <ThemedText
            type="body"
            style={{ fontWeight: "600", color: colors.text }}
          >
            {item.title}
          </ThemedText>
          <ThemedText
            type="small"
            style={{ color: colors.icon, marginTop: Spacing.xs }}
          >
            {item.subtitle}
          </ThemedText>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={colors.icon} />
      </TouchableOpacity>
    );
  };

  const renderRecentSearches = () => {
    if (recentSearches.length === 0 || searchQuery.length > 0) return null;

    return (
      <View style={styles.recentSearches}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Recent Searches
        </ThemedText>
        {recentSearches.map((search, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.recentSearchItem,
              { backgroundColor: colors.surface },
            ]}
            onPress={() => handleRecentSearchPress(search)}
          >
            <Ionicons name="time-outline" size={18} color={colors.icon} />
            <ThemedText
              type="body"
              style={{ color: colors.text, marginLeft: Spacing.sm }}
            >
              {search}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={getCursorStyle()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h2" style={styles.headerTitle}>
            Search
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <MaterialIcons
            name="search"
            size={24}
            color={colors.icon}
            style={styles.searchIcon}
          />
          <TextInput
            style={[
              styles.searchInput,
              createInputStyle(),
              { color: colors.text },
            ]}
            placeholder="Search posts, resources, users..."
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={getCursorStyle()}>
              <MaterialIcons name="close" size={24} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View
          style={[styles.tabsContainer, { backgroundColor: colors.background }]}
        >
          {(["all", "posts", "resources", "users"] as SearchTab[]).map(
            (tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  {
                    backgroundColor:
                      activeTab === tab ? colors.primary : "transparent",
                    borderBottomColor:
                      activeTab === tab ? colors.primary : "transparent",
                  },
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <ThemedText
                  type="body"
                  style={{
                    color: activeTab === tab ? "#FFFFFF" : colors.text,
                    fontWeight: activeTab === tab ? "600" : "400",
                  }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            ),
          )}
        </View>

        {/* Results */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText
              type="body"
              style={{ color: colors.icon, marginTop: Spacing.md }}
            >
              Searching...
            </ThemedText>
          </View>
        ) : results.length > 0 ? (
          <FlatList
            data={results}
            renderItem={renderResult}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            contentContainerStyle={styles.resultsList}
            ListHeaderComponent={
              <ThemedText
                type="body"
                style={[styles.resultsCount, { color: colors.icon }]}
              >
                {results.length} result{results.length !== 1 ? "s" : ""} found
              </ThemedText>
            }
          />
        ) : searchQuery.length > 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="search-off" size={64} color={colors.icon} />
            <ThemedText
              type="h3"
              style={[styles.emptyTitle, { color: colors.text }]}
            >
              No results found
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.emptyText, { color: colors.icon }]}
            >
              Try different keywords or check your spelling
            </ThemedText>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            {renderRecentSearches()}
            <MaterialIcons name="search" size={64} color={colors.icon} />
            <ThemedText
              type="h3"
              style={[styles.emptyTitle, { color: colors.text }]}
            >
              Start searching
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.emptyText, { color: colors.icon }]}
            >
              Search for posts, resources, or users
            </ThemedText>
          </View>
        )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontWeight: "700",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.sm,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderBottomWidth: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  resultsList: {
    padding: Spacing.md,
  },
  resultsCount: {
    marginBottom: Spacing.md,
    fontSize: 14,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  resultContent: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    textAlign: "center",
  },
  recentSearches: {
    width: "100%",
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  recentSearchItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
});
