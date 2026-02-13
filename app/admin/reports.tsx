/**
 * Reports Management Screen - Review and handle reports
 */

import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import { BorderRadius, Colors, Spacing } from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { Report } from "@/app/types";
import { createShadow, getCursorStyle } from "@/app/utils/platform-styles";
import { getReports, updateReport } from "@/app/utils/storage";
import { MaterialIcons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReportsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<
    "all" | "pending" | "reviewed" | "resolved" | "dismissed"
  >("all");

  const loadReports = useCallback(async () => {
    const allReports = await getReports();
    let filtered = allReports;

    if (filter !== "all") {
      filtered = allReports.filter((r) => r.status === filter);
    }

    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    setReports(filtered);
  }, [filter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const handleStatusUpdate = async (
    reportId: string,
    status: Report["status"],
  ) => {
    await updateReport(reportId, { status });
    await loadReports();
    Alert.alert("Success", `Report marked as ${status}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return colors.warning;
      case "reviewed":
        return colors.info;
      case "resolved":
        return colors.success;
      case "dismissed":
        return colors.icon;
      default:
        return colors.icon;
    }
  };

  const filters: ("all" | "pending" | "reviewed" | "resolved" | "dismissed")[] =
    ["all", "pending", "reviewed", "resolved", "dismissed"];

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
            Reports
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((filterOption) => (
            <TouchableOpacity
              key={filterOption}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    filter === filterOption ? colors.primary : colors.surface,
                },
              ]}
              onPress={() => setFilter(filterOption)}
              activeOpacity={0.7}
            >
              <ThemedText
                type="small"
                style={{
                  color: filter === filterOption ? "#FFFFFF" : colors.text,
                  fontWeight: "600",
                }}
              >
                {filterOption === "all"
                  ? "All"
                  : filterOption.charAt(0).toUpperCase() +
                    filterOption.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {reports.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <MaterialIcons
                name="check-circle"
                size={64}
                color={colors.success}
              />
              <ThemedText type="h3" style={styles.emptyTitle}>
                No Reports
              </ThemedText>
              <ThemedText
                type="body"
                style={[styles.emptyText, { color: colors.icon }]}
              >
                All reports have been handled
              </ThemedText>
            </View>
          ) : (
            reports.map((report) => (
              <View
                key={report.id}
                style={[
                  styles.reportCard,
                  { backgroundColor: colors.card },
                  createShadow(3, "#000", 0.1),
                ]}
              >
                <View style={styles.reportHeader}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(report.status) + "20" },
                    ]}
                  >
                    <ThemedText
                      type="small"
                      style={{
                        color: getStatusColor(report.status),
                        fontWeight: "700",
                      }}
                    >
                      {report.status.toUpperCase()}
                    </ThemedText>
                  </View>
                  <View
                    style={[
                      styles.typeBadge,
                      { backgroundColor: colors.primary + "20" },
                    ]}
                  >
                    <MaterialIcons
                      name="description"
                      size={14}
                      color={colors.primary}
                    />
                    <ThemedText
                      type="small"
                      style={{
                        color: colors.primary,
                        fontWeight: "600",
                        marginLeft: 4,
                      }}
                    >
                      {report.targetType.toUpperCase()}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.reportBody}>
                  <ThemedText type="body" style={styles.reasonLabel}>
                    Reason:
                  </ThemedText>
                  <ThemedText type="body" style={styles.reasonText}>
                    {report.reason}
                  </ThemedText>

                  {report.description && (
                    <>
                      <ThemedText
                        type="body"
                        style={[
                          styles.descriptionLabel,
                          { color: colors.icon },
                        ]}
                      >
                        Description:
                      </ThemedText>
                      <ThemedText type="body" style={styles.descriptionText}>
                        {report.description}
                      </ThemedText>
                    </>
                  )}

                  <TouchableOpacity
                    style={styles.viewTargetButton}
                    onPress={() => {
                      if (report.targetType === "post") {
                        router.push(`/post/${report.targetId}`);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons
                      name="visibility"
                      size={16}
                      color={colors.primary}
                    />
                    <ThemedText
                      type="small"
                      style={{
                        color: colors.primary,
                        fontWeight: "600",
                        marginLeft: 4,
                      }}
                    >
                      View {report.targetType}
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                <View style={styles.reportFooter}>
                  <ThemedText type="small" style={{ color: colors.icon }}>
                    {formatDistanceToNow(report.createdAt, { addSuffix: true })}
                  </ThemedText>

                  {report.status === "pending" && (
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          { backgroundColor: colors.success + "20" },
                        ]}
                        onPress={() =>
                          handleStatusUpdate(report.id, "resolved")
                        }
                        activeOpacity={0.7}
                      >
                        <MaterialIcons
                          name="check"
                          size={16}
                          color={colors.success}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          { backgroundColor: colors.icon + "20" },
                        ]}
                        onPress={() =>
                          handleStatusUpdate(report.id, "dismissed")
                        }
                        activeOpacity={0.7}
                      >
                        <MaterialIcons
                          name="close"
                          size={16}
                          color={colors.icon}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}

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
  filtersScroll: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  filtersContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  emptyCard: {
    padding: Spacing.xl * 2,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: Spacing.md,
    fontWeight: "700",
  },
  emptyText: {
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  reportCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  reportBody: {
    marginBottom: Spacing.md,
  },
  reasonLabel: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  reasonText: {
    marginBottom: Spacing.sm,
  },
  descriptionLabel: {
    fontWeight: "600",
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  descriptionText: {
    opacity: 0.8,
  },
  viewTargetButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  reportFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
