/**
 * Analytics Dashboard - For Student Affairs to identify trends
 */

import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import { CATEGORIES } from "@/app/constants/categories";
import { BorderRadius, Colors, Spacing } from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { Analytics as AnalyticsType, PostCategory } from "@/app/types";
import { createShadow, getCursorStyle } from "@/app/utils/platform-styles";
import { getEscalations, getPosts, getUsers } from "@/lib/database";
import { MaterialIcons } from "@expo/vector-icons";
import { endOfDay, format, startOfDay, subDays } from "date-fns";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function AnalyticsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsType | null>(null);
  const [dateRange, setDateRange] = useState<
    "7d" | "30d" | "90d" | "all" | "custom"
  >("30d");
  const [customStartDate] = useState<Date>(subDays(new Date(), 30));
  const [customEndDate] = useState<Date>(new Date());
  // removed unused showDatePicker state

  const loadAnalytics = useCallback(async () => {
    try {
      const { start, end } = getDateRangeDates();
      const [posts, escalations, users] = await Promise.all([
        getPosts(),
        getEscalations(),
        getUsers(),
      ]);

      const filteredPosts = posts.filter((p) => {
        const postDate = new Date(p.createdAt);
        return postDate >= start && postDate <= end;
      });

      const filteredEscalations = escalations.filter((e) => {
        const escDate = new Date(e.createdAt);
        return escDate >= start && escDate <= end;
      });

      const postsByCategory: Record<string, number> = {};
      filteredPosts.forEach((post) => {
        postsByCategory[post.category] =
          (postsByCategory[post.category] || 0) + 1;
      });

      const activeUsers = users.filter((u) => {
        const lastActive = u.lastActive ? new Date(u.lastActive) : new Date(0);
        return lastActive >= start;
      }).length;

      const analyticsData: AnalyticsType = {
        totalPosts: filteredPosts.length,
        escalationCount: filteredEscalations.length,
        activeUsers,
        postsByCategory,
        responseTime: 0,
      };

      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  }, [dateRange, customStartDate, customEndDate]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const getDateRangeDates = () => {
    const now = new Date();
    let start: Date;
    let end: Date = endOfDay(now);

    switch (dateRange) {
      case "7d":
        start = startOfDay(subDays(now, 7));
        break;
      case "30d":
        start = startOfDay(subDays(now, 30));
        break;
      case "90d":
        start = startOfDay(subDays(now, 90));
        break;
      case "custom":
        start = startOfDay(customStartDate);
        end = endOfDay(customEndDate);
        break;
      default: // 'all'
        start = new Date(0);
        end = endOfDay(now);
    }

    return { start, end };
  };

  const loadAnalytics = async () => {
    try {
      const { start, end } = getDateRangeDates();
      const [posts, escalations, users] = await Promise.all([
        getPosts(),
        getEscalations(),
        getUsers(),
      ]);

      // Filter by date range
      const filteredPosts = posts.filter((p) => {
        const postDate = new Date(p.createdAt);
        return postDate >= start && postDate <= end;
      });

      const filteredEscalations = escalations.filter((e) => {
        const escDate = new Date(e.createdAt);
        return escDate >= start && escDate <= end;
      });

      // Calculate analytics
      const postsByCategory: Record<string, number> = {};
      filteredPosts.forEach((post) => {
        postsByCategory[post.category] =
          (postsByCategory[post.category] || 0) + 1;
      });

      const activeUsers = users.filter((u) => {
        const lastActive = u.lastActive ? new Date(u.lastActive) : new Date(0);
        return lastActive >= start;
      }).length;

      const analyticsData: AnalyticsType = {
        totalPosts: filteredPosts.length,
        escalationCount: filteredEscalations.length,
        activeUsers,
        postsByCategory,
        responseTime: 0, // Calculate from replies if needed
      };

      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const getCategoryName = (category: PostCategory) => {
    return CATEGORIES[category]?.name || category;
  };

  const getCategoryColor = (category: PostCategory) => {
    return CATEGORIES[category]?.color || colors.primary;
  };

  const handleExport = async () => {
    try {
      if (!analytics) {
        Alert.alert("Error", "No data to export");
        return;
      }

      // Generate CSV content
      const csvRows: string[] = [];
      csvRows.push("Analytics Report");
      csvRows.push(
        `Date Range: ${dateRange === "custom" ? `${format(customStartDate, "yyyy-MM-dd")} to ${format(customEndDate, "yyyy-MM-dd")}` : dateRange}`,
      );
      csvRows.push(`Generated: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`);
      csvRows.push("");
      csvRows.push("Metric,Value");
      csvRows.push(`Total Posts,${analytics.totalPosts}`);
      csvRows.push(`Escalations,${analytics.escalationCount}`);
      csvRows.push(`Active Users,${analytics.activeUsers}`);
      csvRows.push("");
      csvRows.push("Posts by Category");
      Object.entries(analytics.postsByCategory).forEach(([category, count]) => {
        csvRows.push(`${getCategoryName(category as PostCategory)},${count}`);
      });

      const csvContent = csvRows.join("\n");

      // Share the CSV content
      try {
        await Share.share({
          message: csvContent,
          title: `Analytics Report - ${format(new Date(), "yyyy-MM-dd")}`,
        });
      } catch {
        // Fallback: show content in alert
        Alert.alert(
          "Analytics Report",
          csvContent.substring(0, 500) + (csvContent.length > 500 ? "..." : ""),
          [{ text: "OK" }],
        );
      }
    } catch (error) {
      console.error("Error exporting analytics:", error);
      Alert.alert("Error", "Failed to export analytics");
    }
  };

  const postsByCategory = analytics?.postsByCategory || {};
  const totalPosts = analytics?.totalPosts || 1;
  const maxPosts = Math.max(...Object.values(postsByCategory), 1);

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
            Analytics & Trends
          </ThemedText>
          <TouchableOpacity onPress={handleExport} style={getCursorStyle()}>
            <MaterialIcons name="download" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Date Range Selector */}
          <View style={styles.dateRangeSection}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Date Range
            </ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.dateRangeScroll}
            >
              {(["7d", "30d", "90d", "all", "custom"] as const).map((range) => (
                <TouchableOpacity
                  key={range}
                  style={[
                    styles.dateRangeChip,
                    {
                      backgroundColor:
                        dateRange === range ? colors.primary : colors.surface,
                    },
                  ]}
                  onPress={() => {
                    setDateRange(range);
                    // custom date range UI can be implemented here
                  }}
                >
                  <ThemedText
                    type="small"
                    style={{
                      color: dateRange === range ? "#FFFFFF" : colors.text,
                      fontWeight: "600",
                    }}
                  >
                    {range === "7d"
                      ? "7 Days"
                      : range === "30d"
                        ? "30 Days"
                        : range === "90d"
                          ? "90 Days"
                          : range === "all"
                            ? "All Time"
                            : "Custom"}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {dateRange === "custom" && (
              <View style={styles.customDateInfo}>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  {format(customStartDate, "MMM dd, yyyy")} -{" "}
                  {format(customEndDate, "MMM dd, yyyy")}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Export Button */}
          <TouchableOpacity
            style={[
              styles.exportButton,
              { backgroundColor: colors.primary },
              createShadow(2, "#000", 0.1),
            ]}
            onPress={handleExport}
          >
            <MaterialIcons name="file-download" size={20} color="#FFFFFF" />
            <ThemedText
              type="body"
              style={{
                color: "#FFFFFF",
                marginLeft: Spacing.sm,
                fontWeight: "600",
              }}
            >
              Export Report (CSV)
            </ThemedText>
          </TouchableOpacity>

          {/* Overview Stats */}
          <View style={styles.overviewSection}>
            <View
              style={[
                styles.overviewCard,
                { backgroundColor: colors.card },
                createShadow(3, "#000", 0.1),
              ]}
            >
              <MaterialIcons name="forum" size={48} color={colors.primary} />
              <ThemedText type="h1" style={styles.overviewValue}>
                {analytics?.totalPosts || 0}
              </ThemedText>
              <ThemedText
                type="body"
                style={[styles.overviewLabel, { color: colors.icon }]}
              >
                Total Posts
              </ThemedText>
            </View>

            <View
              style={[
                styles.overviewCard,
                { backgroundColor: colors.card },
                createShadow(3, "#000", 0.1),
              ]}
            >
              <MaterialIcons name="warning" size={48} color={colors.danger} />
              <ThemedText type="h1" style={styles.overviewValue}>
                {analytics?.escalationCount || 0}
              </ThemedText>
              <ThemedText
                type="body"
                style={[styles.overviewLabel, { color: colors.icon }]}
              >
                Escalations
              </ThemedText>
            </View>

            <View
              style={[
                styles.overviewCard,
                { backgroundColor: colors.card },
                createShadow(3, "#000", 0.1),
              ]}
            >
              <MaterialIcons name="people" size={48} color={colors.success} />
              <ThemedText type="h1" style={styles.overviewValue}>
                {analytics?.activeUsers || 0}
              </ThemedText>
              <ThemedText
                type="body"
                style={[styles.overviewLabel, { color: colors.icon }]}
              >
                Active Users
              </ThemedText>
            </View>

            <View
              style={[
                styles.overviewCard,
                { backgroundColor: colors.card },
                createShadow(3, "#000", 0.1),
              ]}
            >
              <MaterialIcons name="schedule" size={48} color={colors.warning} />
              <ThemedText type="h1" style={styles.overviewValue}>
                {analytics?.responseTime || 0}m
              </ThemedText>
              <ThemedText
                type="body"
                style={[styles.overviewLabel, { color: colors.icon }]}
              >
                Avg Response Time
              </ThemedText>
            </View>
          </View>

          {/* Posts by Category */}
          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Posts by Category
            </ThemedText>
            <View
              style={[
                styles.categoryChart,
                { backgroundColor: colors.card },
                createShadow(2, "#000", 0.1),
              ]}
            >
              {Object.entries(postsByCategory).map(([category, count]) => {
                const percentage = (count / totalPosts) * 100;
                const barWidth =
                  (count / maxPosts) *
                  (width - Spacing.xl * 2 - Spacing.md * 4);
                return (
                  <View key={category} style={styles.categoryRow}>
                    <View style={styles.categoryInfo}>
                      <View
                        style={[
                          styles.categoryDot,
                          {
                            backgroundColor: getCategoryColor(
                              category as PostCategory,
                            ),
                          },
                        ]}
                      />
                      <ThemedText type="body" style={styles.categoryName}>
                        {getCategoryName(category as PostCategory)}
                      </ThemedText>
                    </View>
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          {
                            width: barWidth,
                            backgroundColor: getCategoryColor(
                              category as PostCategory,
                            ),
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.categoryCount}>
                      <ThemedText type="body" style={styles.countText}>
                        {count}
                      </ThemedText>
                      <ThemedText
                        type="small"
                        style={[styles.percentageText, { color: colors.icon }]}
                      >
                        {percentage.toFixed(1)}%
                      </ThemedText>
                    </View>
                  </View>
                );
              })}
              {Object.keys(postsByCategory).length === 0 && (
                <View style={styles.emptyState}>
                  <MaterialIcons
                    name="bar-chart"
                    size={48}
                    color={colors.icon}
                  />
                  <ThemedText
                    type="body"
                    style={[styles.emptyText, { color: colors.icon }]}
                  >
                    No data available
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* Common Issues */}
          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Common Issues & Trends
            </ThemedText>
            <View
              style={[
                styles.issuesCard,
                { backgroundColor: colors.card },
                createShadow(2, "#000", 0.1),
              ]}
            >
              {analytics?.commonIssues && analytics.commonIssues.length > 0 ? (
                <View style={styles.issuesList}>
                  {analytics.commonIssues.slice(0, 10).map((issue, index) => (
                    <View key={index} style={styles.issueItem}>
                      <View
                        style={[
                          styles.issueRank,
                          { backgroundColor: colors.primary + "20" },
                        ]}
                      >
                        <ThemedText
                          type="small"
                          style={{ color: colors.primary, fontWeight: "700" }}
                        >
                          #{index + 1}
                        </ThemedText>
                      </View>
                      <ThemedText type="body" style={styles.issueText}>
                        {issue.charAt(0).toUpperCase() + issue.slice(1)}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <MaterialIcons
                    name="trending-up"
                    size={48}
                    color={colors.icon}
                  />
                  <ThemedText
                    type="body"
                    style={[styles.emptyText, { color: colors.icon }]}
                  >
                    No trending issues yet
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* Insights */}
          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Key Insights
            </ThemedText>
            <View
              style={[
                styles.insightsCard,
                { backgroundColor: colors.card },
                createShadow(2, "#000", 0.1),
              ]}
            >
              <View style={styles.insightItem}>
                <MaterialIcons
                  name="insights"
                  size={24}
                  color={colors.primary}
                />
                <View style={styles.insightContent}>
                  <ThemedText type="body" style={styles.insightTitle}>
                    Top Concern Category
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={[styles.insightValue, { color: colors.icon }]}
                  >
                    {Object.entries(postsByCategory).length > 0
                      ? getCategoryName(
                          Object.entries(postsByCategory).sort(
                            (a, b) => b[1] - a[1],
                          )[0][0] as PostCategory,
                        )
                      : "N/A"}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.insightItem}>
                <MaterialIcons name="speed" size={24} color={colors.success} />
                <View style={styles.insightContent}>
                  <ThemedText type="body" style={styles.insightTitle}>
                    Community Response
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={[styles.insightValue, { color: colors.icon }]}
                  >
                    {analytics?.responseTime
                      ? analytics.responseTime < 30
                        ? "Very Fast"
                        : analytics.responseTime < 60
                          ? "Fast"
                          : "Average"
                      : "N/A"}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.insightItem}>
                <MaterialIcons
                  name="priority-high"
                  size={24}
                  color={colors.danger}
                />
                <View style={styles.insightContent}>
                  <ThemedText type="body" style={styles.insightTitle}>
                    Escalation Rate
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={[styles.insightValue, { color: colors.icon }]}
                  >
                    {analytics?.totalPosts
                      ? (
                          (analytics.escalationCount / analytics.totalPosts) *
                          100
                        ).toFixed(1) + "%"
                      : "0%"}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: Spacing.xl }} />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  overviewSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  overviewCard: {
    width: "48%",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  overviewValue: {
    fontSize: 36,
    fontWeight: "700",
    marginVertical: Spacing.xs,
  },
  overviewLabel: {
    fontSize: 14,
    textAlign: "center",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  categoryChart: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    width: 120,
    gap: Spacing.xs,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "500",
  },
  barContainer: {
    flex: 1,
    height: 24,
    backgroundColor: "#F0F0F0",
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: BorderRadius.sm,
  },
  categoryCount: {
    width: 60,
    alignItems: "flex-end",
  },
  countText: {
    fontWeight: "700",
    fontSize: 14,
  },
  percentageText: {
    fontSize: 11,
  },
  issuesCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  issuesList: {
    gap: Spacing.sm,
  },
  issueItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  issueRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  issueText: {
    flex: 1,
    fontSize: 14,
  },
  insightsCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontWeight: "600",
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 13,
  },
  emptyState: {
    alignItems: "center",
    padding: Spacing.xl,
  },
  emptyText: {
    marginTop: Spacing.md,
  },
  dateRangeSection: {
    marginBottom: Spacing.lg,
  },
  dateRangeScroll: {
    marginTop: Spacing.sm,
  },
  dateRangeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  customDateInfo: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
});
