import { ThemedText } from "@/app/components/themed-text";
import { Colors, Spacing } from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { getResourceStats, getResources } from "@/lib/database";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const CATEGORIES = [
    {
        id: "mental-health",
        title: "Mental Health",
        icon: "head-heart-outline",
        color: "#8B5CF6",
        count: "12 Resources",
    },
    {
        id: "sexual-health",
        title: "SRH & HIV",
        icon: "shield-check-outline",
        color: "#EF4444",
        count: "8 Resources",
    },
    {
        id: "academic",
        title: "Academic Help",
        icon: "book-open-variant",
        color: "#3B82F6",
        count: "15 Resources",
    },
    {
        id: "substance-abuse",
        title: "Safe Living",
        icon: "pill",
        color: "#F59E0B",
        count: "6 Resources",
    },
];

const QUICK_ACTIONS = [
    {
        title: "Resource Library",
        subtitle: "Browse all documents",
        icon: "library-shelves",
        route: "/resource/list",
        color: "#6366F1",
    },
    {
        title: "Photo Gallery",
        subtitle: "PEACE Events & Life",
        icon: "image-multiple-outline",
        route: "/gallery",
        color: "#EC4899",
    },
    {
        title: "Video Lessons",
        subtitle: "Expert advice & talks",
        icon: "play-circle-outline",
        route: "/resource/list?cat=Videos",
        color: "#10B981",
    },
];

export default function ResourceCentreScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? "light";
    const colors = Colors[colorScheme];

    const [stats, setStats] = React.useState<Record<string, number>>({});
    const [featured, setFeatured] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [statsData, allResources] = await Promise.all([
                    getResourceStats(),
                    getResources({ limit: 5 } as any)
                ]);
                setStats(statsData);
                if (allResources && allResources.length > 0) {
                    setFeatured(allResources[0]);
                }
            } catch (error) {
                console.error("Error loading resource dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const getCount = (id: string) => {
        const count = stats[id] || 0;
        return `${count} ${count === 1 ? 'Resource' : 'Resources'}`;
    };

    return (
        <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View>
                        <ThemedText type="h1" style={styles.welcomeText}>
                            Resource Centre
                        </ThemedText>
                        <ThemedText style={{ opacity: 0.6 }}>
                            Knowledge for a better campus life
                        </ThemedText>
                    </View>
                    <TouchableOpacity
                        style={[styles.searchButton, { backgroundColor: colors.surface }]}
                        onPress={() => router.push("/resource/list")}
                    >
                        <MaterialCommunityIcons name="magnify" size={24} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.featuredContainer}>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => featured ? router.push(`/resource/${featured.id}`) : router.push("/resource/list")}
                    >
                        <LinearGradient
                            colors={colors.gradients.primary as any}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.featuredCard}
                        >
                            <View style={styles.featuredContent}>
                                <View style={styles.featuredBadge}>
                                    <ThemedText style={styles.featuredBadgeText}>Latest</ThemedText>
                                </View>
                                <ThemedText style={styles.featuredTitle} numberOfLines={2}>
                                    {featured?.title || "Mental Health Wellness Guide 2024"}
                                </ThemedText>
                                <ThemedText style={styles.featuredSubtitle} numberOfLines={2}>
                                    {featured?.description || "Essential tips for managing exam stress and burnout."}
                                </ThemedText>
                                <TouchableOpacity
                                    style={styles.readButton}
                                    onPress={() => featured ? router.push(`/resource/${featured.id}`) : router.push("/resource/list")}
                                >
                                    <ThemedText style={styles.readButtonText}>
                                        {featured ? 'Read Now' : 'Open Library'}
                                    </ThemedText>
                                    <MaterialCommunityIcons name="arrow-right" size={16} color="#4F46E5" />
                                </TouchableOpacity>
                            </View>
                            <MaterialCommunityIcons
                                name={featured?.resourceType === 'video' ? "play-circle-outline" : "book-open-page-variant"}
                                size={120}
                                color="rgba(255,255,255,0.2)"
                                style={styles.featuredIcon}
                            />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                <View style={styles.sectionHeader}>
                    <ThemedText type="h2" style={styles.sectionTitle}>Categories</ThemedText>
                    <TouchableOpacity onPress={() => router.push("/resource/list")}>
                        <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>See All</ThemedText>
                    </TouchableOpacity>
                </View>

                <View style={styles.categoryGrid}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                            onPress={() => router.push({ pathname: "/resource/list", params: { cat: cat.id } })}
                        >
                            <View style={[styles.catIconContainer, { backgroundColor: cat.color + '15' }]}>
                                <MaterialCommunityIcons name={cat.icon as any} size={28} color={cat.color} />
                            </View>
                            <ThemedText style={styles.catTitle}>{cat.title}</ThemedText>
                            <ThemedText style={styles.catCount}>{loading ? '...' : getCount(cat.id)}</ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.sectionHeader}>
                    <ThemedText type="h2" style={styles.sectionTitle}>Quick Access</ThemedText>
                </View>

                <View style={styles.actionList}>
                    {QUICK_ACTIONS.map((action, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                            onPress={() => router.push(action.route as any)}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                                <MaterialCommunityIcons name={action.icon as any} size={24} color={action.color} />
                            </View>
                            <View style={styles.actionTextContent}>
                                <ThemedText style={styles.actionTitle}>{action.title}</ThemedText>
                                <ThemedText style={styles.actionSubtitle}>{action.subtitle}</ThemedText>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.icon} />
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        padding: Spacing.md,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: Spacing.lg,
        marginTop: Spacing.sm,
    },
    welcomeText: {
        fontSize: 28,
        lineHeight: 34,
    },
    searchButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    featuredContainer: {
        marginBottom: Spacing.xl,
    },
    featuredCard: {
        borderRadius: 32,
        padding: Spacing.lg,
        flexDirection: "row",
        overflow: "hidden",
        height: 200,
    },
    featuredContent: {
        flex: 1,
        justifyContent: "center",
        zIndex: 1,
    },
    featuredBadge: {
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: "flex-start",
        marginBottom: 12,
    },
    featuredBadgeText: {
        color: "#FFF",
        fontSize: 12,
        fontWeight: "800",
        textTransform: "uppercase",
    },
    featuredTitle: {
        color: "#FFF",
        fontSize: 22,
        fontWeight: "900",
        marginBottom: 8,
    },
    featuredSubtitle: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 20,
    },
    readButton: {
        backgroundColor: "#FFF",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 14,
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 8,
    },
    readButtonText: {
        color: "#4F46E5",
        fontWeight: "800",
        fontSize: 14,
    },
    featuredIcon: {
        position: "absolute",
        right: -20,
        bottom: -20,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "800",
    },
    categoryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    categoryCard: {
        width: (width - Spacing.md * 3) / 2,
        padding: Spacing.md,
        borderRadius: 24,
        borderWidth: 1,
        gap: 8,
    },
    catIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 4,
    },
    catTitle: {
        fontSize: 16,
        fontWeight: "700",
    },
    catCount: {
        fontSize: 12,
        opacity: 0.5,
        fontWeight: "600",
    },
    actionList: {
        gap: Spacing.md,
    },
    actionCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: Spacing.md,
        borderRadius: 24,
        borderWidth: 1,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginRight: Spacing.md,
    },
    actionTextContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: "700",
    },
    actionSubtitle: {
        fontSize: 13,
        opacity: 0.5,
    },
});
