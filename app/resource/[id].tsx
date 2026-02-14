import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import { Colors, Spacing } from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { Resource } from "@/app/types";
import { createShadow } from "@/app/utils/platform-styles";
import {
    addResourceRating,
    getResource,
    incrementResourceViews,
} from "@/lib/database";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ImageBackground,
    Linking,
    Modal,
    ScrollView,
    Share,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const FAVORITES_KEY = "resource_favorites";
const DOWNLOADS_KEY = "resource_downloads";

export default function ResourceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);

  const loadResource = useCallback(async () => {
    try {
      if (!id) return;
      incrementResourceViews(id).catch((err) =>
        console.log("View increment failed", err),
      );
      const resourceData = await getResource(id);
      setResource(resourceData);
    } catch (error) {
      console.error("Error loading resource:", error);
      Alert.alert("Error", "Failed to load resource. Please try again.");
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
      console.error("Error checking favorite status:", error);
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
      console.error("Error checking download status:", error);
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
      console.error("Error toggling favorite:", error);
    }
  };

  const handleDownload = async () => {
    if (!resource) return;

    try {
      const downloadsJson = await AsyncStorage.getItem(DOWNLOADS_KEY);
      let downloads = downloadsJson ? JSON.parse(downloadsJson) : [];

      const downloadRecord = {
        id: resource.id,
        title: resource.title,
        downloadedAt: new Date().toISOString(),
      };

      const existingIndex = downloads.findIndex(
        (d: any) => d.id === resource.id,
      );
      if (existingIndex >= 0) {
        downloads[existingIndex] = downloadRecord;
      } else {
        downloads.push(downloadRecord);
      }

      await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));
      setIsDownloaded(true);

      if (resource.url) {
        const canOpen = await Linking.canOpenURL(resource.url);
        if (canOpen) {
          await Linking.openURL(resource.url);
        } else {
          Alert.alert("Error", "Cannot open this resource URL.");
        }
      } else {
        Alert.alert("Downloaded", "Resource saved to your downloads.");
      }
    } catch (error) {
      console.error("Error downloading resource:", error);
      Alert.alert("Error", "Failed to download resource.");
    }
  };

  const handleShare = async () => {
    if (!resource) return;
    try {
      await Share.share({
        message: `Check out this resource: ${resource.title}\n${resource.description || ""}`,
        title: resource.title,
      });
    } catch (error) {
      console.error("Error sharing resource:", error);
    }
  };

  const handleRate = () => {
    setShowRatingModal(true);
  };

  const submitRating = async (rating: number) => {
    if (!resource) return;
    try {
      const {
        data: { user: authUser },
      } = await (await import("@/lib/supabase")).supabase.auth.getUser();
      if (!authUser) {
        Alert.alert(
          "Authentication Required",
          "Please sign in to rate resources.",
        );
        return;
      }

      await addResourceRating(resource.id, authUser.id, rating);
      setUserRating(rating);
      setShowRatingModal(false);
      Alert.alert("Thank You", "Your rating has been submitted.");
      loadResource(); // Reload to update average
    } catch (error) {
      console.error("Error rating resource:", error);
      Alert.alert("Error", "Failed to submit rating.");
    }
  };

  const getResourceIcon = () => {
    if (!resource) return "file-outline";
    switch (resource.resourceType) {
      case "article":
        return "book-open-page-variant-outline";
      case "video":
        return "play-circle-outline";
      case "pdf":
        return "file-pdf-box";
      case "link":
        return "link-variant";
      case "training":
        return "school-outline";
      default:
        return "file-document-outline";
    }
  };

  const getTypeColor = () => {
    if (!resource) return colors.primary;
    switch (resource.resourceType) {
      case "article":
        return "#6366F1";
      case "video":
        return "#10B981";
      case "pdf":
        return "#EF4444";
      case "link":
        return "#8B5CF6";
      case "training":
        return "#F59E0B";
      default:
        return colors.primary;
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={{ marginTop: 16 }}>Loading resource...</ThemedText>
      </ThemedView>
    );
  }

  if (!resource) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={64}
          color={colors.danger}
        />
        <ThemedText type="h2" style={{ marginTop: 16 }}>
          Not Found
        </ThemedText>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <ThemedText style={{ color: "#FFF", fontWeight: "bold" }}>
            Go Back
          </ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const accentColor = getTypeColor();

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Immersive Header */}
        <View style={styles.heroSection}>
          {resource.filePath &&
          (resource.filePath.endsWith(".jpg") ||
            resource.filePath.endsWith(".png") ||
            resource.filePath.endsWith(".jpeg")) ? (
            <ImageBackground
              source={{
                uri: `https://gqdpylrhlzpsjxjxymcn.supabase.co/storage/v1/object/public/system-resources/${resource.filePath}`,
              }}
              style={styles.heroBackground}
              resizeMode="cover"
            >
              <LinearGradient
                colors={[
                  accentColor + "90",
                  accentColor + "60",
                  colors.background,
                ]}
                style={styles.heroGradient}
              />
            </ImageBackground>
          ) : resource.url &&
            (resource.url.includes("images.unsplash.com") ||
              resource.url.endsWith(".jpg") ||
              resource.url.endsWith(".png")) ? (
            <ImageBackground
              source={{ uri: resource.url }}
              style={styles.heroBackground}
              resizeMode="cover"
            >
              <LinearGradient
                colors={[
                  accentColor + "90",
                  accentColor + "60",
                  colors.background,
                ]}
                style={styles.heroGradient}
              />
            </ImageBackground>
          ) : (
            <LinearGradient
              colors={[accentColor, accentColor + "80", colors.background]}
              style={styles.heroGradient}
            />
          )}
          <SafeAreaView edges={["top"]} style={styles.navHeader}>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.navActions衡}>
              <TouchableOpacity style={styles.circleBtn} onPress={handleShare}>
                <MaterialIcons name="share" size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.circleBtn}
                onPress={toggleFavorite}
              >
                <MaterialIcons
                  name={isFavorite ? "favorite" : "favorite-border"}
                  size={24}
                  color={isFavorite ? "#FF4757" : "#FFF"}
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <Animated.View
            entering={FadeInDown.duration(800)}
            style={styles.heroContent衡}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: "rgba(255,255,255,0.2)" },
              ]}
            >
              <MaterialCommunityIcons
                name={getResourceIcon() as any}
                size={64}
                color="#FFF"
              />
            </View>
            <View style={styles.typeTag}>
              <ThemedText style={styles.typeTagText}>
                {resource.resourceType}
              </ThemedText>
            </View>
            <ThemedText type="h1" style={styles.title}>
              {resource.title}
            </ThemedText>
            <ThemedText style={styles.category}>
              {resource.category.replace("-", " ").toUpperCase()}
            </ThemedText>
          </Animated.View>
        </View>

        {/* Body Content */}
        <Animated.View entering={FadeIn.delay(300)} style={styles.body}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>
                {resource.views
                  ? resource.views > 999
                    ? `${(resource.views / 1000).toFixed(1)}k`
                    : resource.views
                  : "0"}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Views</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>
                {resource.createdAt &&
                !isNaN(new Date(resource.createdAt).getTime())
                  ? format(new Date(resource.createdAt), "MMM yyyy")
                  : "N/A"}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Published</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>
                {resource.rating?.toFixed(1) || "0.0"}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Rating</ThemedText>
            </View>
          </View>

          <View style={styles.section衡}>
            <ThemedText type="h3" style={styles.sectionTitle衡}>
              Description
            </ThemedText>
            <ThemedText style={styles.descriptionText衡}>
              {resource.description ||
                "No detailed description available for this resource. Research and educational content designed for peer support."}
            </ThemedText>
          </View>

          {resource.tags && resource.tags.length > 0 && (
            <View style={styles.section衡}>
              <ThemedText type="h3" style={styles.sectionTitle衡}>
                Key Topics
              </ThemedText>
              <View style={styles.tagsContainer衡}>
                {resource.tags.map((tag, i) => (
                  <View
                    key={i}
                    style={[
                      styles.tag衡,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <ThemedText style={styles.tagText衡}>#{tag}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View
            style={[
              styles.infoCard衡,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.infoRow衡}>
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={20}
                color={colors.success}
              />
              <ThemedText style={styles.infoText衡}>
                Verified PEACE Resource
              </ThemedText>
            </View>
            <View style={styles.infoRow衡}>
              <MaterialCommunityIcons
                name="update"
                size={20}
                color={colors.primary}
              />
              <ThemedText style={styles.infoText衡}>
                Last updated{" "}
                {resource.updatedAt &&
                !isNaN(new Date(resource.updatedAt).getTime())
                  ? format(new Date(resource.updatedAt), "PP")
                  : "recently"}
              </ThemedText>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>

      {/* Float Action Bar */}
      <View style={styles.bottomBar衡}>
        <LinearGradient
          colors={["transparent", colors.background]}
          style={styles.bottomGradient衡}
        />
        <View style={styles.bottomActionsRow}>
          <TouchableOpacity
            style={[
              styles.secondaryActionBtn,
              { backgroundColor: colors.surface },
            ]}
            onPress={handleRate}
          >
            <MaterialCommunityIcons
              name="star-outline"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.mainActionBtn衡,
              { backgroundColor: accentColor, flex: 1 },
              createShadow(8, accentColor, 0.3),
            ]}
            onPress={handleDownload}
          >
            <MaterialCommunityIcons
              name={resource.resourceType === "video" ? "play" : "open-in-new"}
              size={24}
              color="#FFF"
            />
            <ThemedText style={styles.mainActionText衡}>
              {resource.resourceType === "video"
                ? "Watch Video"
                : "Open Resource"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.ratingCard, { backgroundColor: colors.card }]}>
            <ThemedText type="h3" style={{ marginBottom: 8 }}>
              Rate this Resource
            </ThemedText>
            <ThemedText
              style={{ opacity: 0.6, marginBottom: 24, textAlign: "center" }}
            >
              How helpful was this resource for you?
            </ThemedText>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => submitRating(star)}
                  style={{ padding: 8 }}
                >
                  <MaterialCommunityIcons
                    name={star <= userRating ? "star" : "star-outline"}
                    size={40}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={{ marginTop: 24, padding: 12 }}
              onPress={() => setShowRatingModal(false)}
            >
              <ThemedText style={{ color: colors.primary, fontWeight: "600" }}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heroSection: {
    height: 440,
    width: "100%",
    position: "relative",
  },
  heroBackground: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  navHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: 10,
    zIndex: 10,
  },
  navActions衡: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroContent衡: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  typeTag: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  typeTagText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 34,
    marginBottom: 8,
  },
  category: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    marginTop: -30,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 24,
    marginBottom: 30,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.5,
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  section衡: {
    marginBottom: 30,
  },
  sectionTitle衡: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },
  descriptionText衡: {
    fontSize: 16,
    lineHeight: 26,
    opacity: 0.7,
  },
  tagsContainer衡: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  tag衡: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagText衡: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoCard衡: {
    padding: Spacing.lg,
    borderRadius: 24,
    borderWidth: 1.5,
    gap: 12,
  },
  infoRow衡: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText衡: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.6,
  },
  bottomBar衡: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  bottomActionsRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  bottomGradient衡: {
    ...StyleSheet.absoluteFillObject,
  },
  mainActionBtn衡: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 64,
    paddingHorizontal: 24,
    borderRadius: 32,
    gap: 12,
  },
  secondaryActionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  mainActionText衡: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  ratingCard: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    ...createShadow(20, "#000", 0.1),
  },
  starsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  backBtn: {
    marginTop: 20,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 16,
  },
});
