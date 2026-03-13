/**
 * Report Detail Screen - Admin view of a specific report
 */

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Post, Report } from "@/types";
import { createShadow, getCursorStyle } from "@/utils/platform-styles";
import { getReport, getPost, updateReport, deletePost } from "@/utils/storage";
import { MaterialIcons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<Report | null>(null);
  const [targetPost, setTargetPost] = useState<Post | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const allReports = await import("@/utils/storage").then(m => m.getReports());
      const foundReport = allReports.find(r => r.id === id);
      
      if (!foundReport) {
        Alert.alert("Error", "Report not found");
        router.back();
        return;
      }
      
      setReport(foundReport);
      
      if (foundReport.targetType === 'post') {
        const post = await getPost(foundReport.targetId);
        setTargetPost(post);
      }
    } catch (error) {
      console.error("Error loading report detail:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = async (action: 'resolve' | 'dismiss' | 'delete') => {
    if (!report) return;

    if (action === 'delete' && targetPost) {
      Alert.alert(
        "Delete Post",
        "Are you sure you want to delete this post? This cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Delete", 
            style: "destructive",
            onPress: async () => {
              await deletePost(targetPost.id);
              await updateReport(report.id, { status: 'resolved' });
              Alert.alert("Success", "Post deleted and report resolved");
              router.back();
            }
          }
        ]
      );
      return;
    }

    const newStatus = action === 'resolve' ? 'resolved' : 'dismissed';
    await updateReport(report.id, { status: newStatus });
    Alert.alert("Success", `Report ${newStatus}`);
    router.back();
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (!report) return null;

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h2" style={styles.headerTitle}>Review Report</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.card, { backgroundColor: colors.card }, createShadow(3, "#000", 0.05)]}>
            <View style={styles.reportMeta}>
              <View style={[styles.badge, { backgroundColor: colors.warning + "15" }]}>
                <ThemedText style={{ color: colors.warning, fontWeight: "700", fontSize: 12 }}>
                  {report.status.toUpperCase()}
                </ThemedText>
              </View>
              <ThemedText type="small" style={{ color: colors.icon }}>
                {formatDistanceToNow(report.createdAt, { addSuffix: true })}
              </ThemedText>
            </View>

            <ThemedText type="h3" style={styles.reasonTitle}>{report.reason}</ThemedText>
            {report.description && (
              <ThemedText type="body" style={styles.descriptionText}>{report.description}</ThemedText>
            )}
          </View>

          <ThemedText type="h3" style={styles.sectionTitle}>Target Content</ThemedText>
          
          {targetPost ? (
            <View style={[styles.card, { backgroundColor: colors.card }, createShadow(3, "#000", 0.05)]}>
              <ThemedText type="h3" style={styles.postTitle}>{targetPost.title}</ThemedText>
              <ThemedText type="body" style={styles.postContent}>{targetPost.content}</ThemedText>
              <View style={styles.postMeta}>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  By: {targetPost.isAnonymous ? "Anonymous" : targetPost.authorPseudonym}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  {targetPost.category}
                </ThemedText>
              </View>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <ThemedText style={{ color: colors.icon, textAlign: 'center' }}>
                Target content could not be found (may have already been deleted).
              </ThemedText>
            </View>
          )}

          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: colors.success }]}
              onPress={() => handleAction('resolve')}
            >
              <MaterialIcons name="check" size={20} color="#FFF" />
              <ThemedText style={styles.btnText}>Mark Resolved</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: colors.danger }]}
              onPress={() => handleAction('delete')}
            >
              <MaterialIcons name="delete" size={20} color="#FFF" />
              <ThemedText style={styles.btnText}>Delete & Resolve</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: colors.surface }]}
              onPress={() => handleAction('dismiss')}
            >
              <MaterialIcons name="close" size={20} color={colors.text} />
              <ThemedText style={[styles.btnText, { color: colors.text }]}>Dismiss Report</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: { fontWeight: "700" },
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.md },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  reportMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  reasonTitle: { marginBottom: Spacing.sm },
  descriptionText: { opacity: 0.8 },
  sectionTitle: {
    fontWeight: "700",
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  postTitle: { marginBottom: Spacing.sm },
  postContent: { marginBottom: Spacing.lg, lineHeight: 20 },
  postMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: Spacing.sm,
  },
  actionContainer: { gap: Spacing.md, marginTop: Spacing.xl },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  btnText: { color: "#FFF", fontWeight: "700" },
});
