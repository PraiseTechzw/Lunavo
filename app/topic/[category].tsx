/**
 * Topic Feed Screen
 * Displays posts for a selected category
 */

import { PostCard } from '@/app/components/post-card';
import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { CATEGORIES } from '@/app/constants/categories';
import { Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Post, PostCategory } from '@/app/types';
import { getPosts, getTopicStats } from '@/lib/database';
import { RealtimeChannel, subscribeToPosts, unsubscribe } from '@/lib/realtime';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function TopicScreen() {
    const { category } = useLocalSearchParams<{ category: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);

    const activeCategory = (category && CATEGORIES[category as PostCategory])
        ? (category as PostCategory)
        : 'general';

    const [categoryInfo, setCategoryInfo] = useState<any>(CATEGORIES[activeCategory]);

    useEffect(() => {
        loadPosts();
        setupSubscription();
        loadCategoryInfo();

        return () => {
            if (channelRef.current) unsubscribe(channelRef.current);
        };
    }, [activeCategory]);

    const loadCategoryInfo = async () => {
        const stats = await getTopicStats();
        const stat = stats.find(s => s.category === activeCategory);
        if (stat?.categoryDetails) {
            setCategoryInfo(stat.categoryDetails);
        }
    };

    const loadPosts = async () => {
        try {
            setLoading(true);
            // Fetch posts for this category
            const data = await getPosts({ category: activeCategory });
            setPosts(data);
        } catch (error) {
            console.error('Error loading posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Silent fetch
        const data = await getPosts({ category: activeCategory });
        setPosts(data);
        setRefreshing(false);
    };

    const setupSubscription = () => {
        channelRef.current = subscribeToPosts((payload) => {
            // If we needed to filter only for this category we could check payload
            // But re-fetching is safer for ensuring we get the mapped post with author
            loadPosts();
        });
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerTop}>
                <View style={[styles.iconBox, { backgroundColor: categoryInfo.color + '15' }]}>
                    <Ionicons name={categoryInfo.icon as any} size={36} color={categoryInfo.color} />
                    <View style={[styles.iconGlow, { backgroundColor: categoryInfo.color }]} />
                </View>
                <View style={styles.headerBadge}>
                    <ThemedText style={{ color: categoryInfo.color, fontWeight: '900', fontSize: 10 }}>SUPPORT CIRCLE</ThemedText>
                </View>
            </View>

            <View style={styles.headerText}>
                <ThemedText type="h1" style={styles.title}>{categoryInfo.name}</ThemedText>
                <ThemedText style={[styles.description, { color: colors.icon }]}>
                    {categoryInfo.description}
                </ThemedText>
            </View>

            <View style={styles.actionRow}>
                <View style={styles.statsBadge}>
                    <Ionicons name="people" size={14} color={colors.text} />
                    <ThemedText style={styles.statsLabel}>{posts.length} discussions</ThemedText>
                </View>
                <TouchableOpacity
                    style={[styles.sortButton, { borderColor: colors.border }]}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                >
                    <Ionicons name="filter-outline" size={16} color={colors.text} />
                    <ThemedText style={styles.sortText}>Latest</ThemedText>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen
                options={{
                    headerTitle: '',
                    headerBackTitle: 'Community',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.background },
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => router.push(`/create-post?category=${activeCategory}`)}
                            style={[styles.createButton, { backgroundColor: colors.primary }]}
                        >
                            <Ionicons name="add" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    )
                }}
            />

            <FlatList
                data={posts}
                renderItem={({ item }) => (
                    <PostCard
                        post={item}
                        onPress={() => router.push(`/post/${item.id}`)}
                    />
                )}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={48} color={colors.icon} style={{ opacity: 0.5 }} />
                            <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
                                No conversations yet. Be the first to share!
                            </ThemedText>
                            <TouchableOpacity
                                style={[styles.emptyButton, { borderColor: colors.primary }]}
                                onPress={() => router.push(`/create-post?category=${activeCategory}`)}
                            >
                                <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>Start a Discussion</ThemedText>
                            </TouchableOpacity>
                        </View>
                    ) : null
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
                }
            />

            {loading && !refreshing && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: Spacing.md,
        paddingBottom: 100,
    },
    header: {
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.sm,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.lg,
    },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    iconGlow: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 20,
        opacity: 0.1,
        transform: [{ scale: 1.2 }],
    },
    headerBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    headerText: {
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: -1,
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '400',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statsLabel: {
        fontSize: 14,
        fontWeight: '700',
        opacity: 0.6,
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
    },
    sortText: {
        fontSize: 14,
        fontWeight: '700',
    },
    createButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    emptyContainer: {
        padding: Spacing.xl,
        alignItems: 'center',
        marginTop: Spacing.xl,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: Spacing.md,
        marginBottom: Spacing.lg,
        fontSize: 16,
    },
    emptyButton: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: 100,
        borderWidth: 1,
    },
});
