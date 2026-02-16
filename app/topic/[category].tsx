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
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

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

    const [categoryInfo, setCategoryInfo] = useState<any>(CATEGORIES[activeCategory] || {
        name: 'Peer Circle',
        description: 'Join safe, anonymous spaces built for students.',
        icon: 'people-outline',
        color: colors.primary
    });

    const loadCategoryInfo = useCallback(async () => {
        const stats = await getTopicStats();
        const stat = stats.find(s => s.category === activeCategory);
        if (stat?.categoryDetails) {
            setCategoryInfo(stat.categoryDetails);
        }
    }, [activeCategory]);

    const loadPosts = useCallback(async () => {
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
    }, [activeCategory]);

    const setupSubscription = useCallback(() => {
        channelRef.current = subscribeToPosts((payload) => {
            // If we needed to filter only for this category we could check payload
            // But re-fetching is safer for ensuring we get the mapped post with author
            loadPosts();
        });
    }, [loadPosts]);

    useEffect(() => {
        loadPosts();
        setupSubscription();
        loadCategoryInfo();

        return () => {
            if (channelRef.current) unsubscribe(channelRef.current);
        };
    }, [activeCategory, loadPosts, setupSubscription, loadCategoryInfo]);

    const handleRefresh = async () => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Silent fetch
        const data = await getPosts({ category: activeCategory });
        setPosts(data);
        setRefreshing(false);
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={[styles.heroBanner, { backgroundColor: categoryInfo?.color + '10' }]}>
                <View style={[styles.heroIconCircle, { backgroundColor: categoryInfo?.color }]}>
                    <Ionicons name={categoryInfo?.icon as any} size={40} color="#FFF" />
                </View>
                <ThemedText type="h1" style={styles.heroTitle}>{categoryInfo?.name}</ThemedText>
                <ThemedText style={[styles.heroDesc, { color: colors.icon }]}>
                    {categoryInfo?.description}
                </ThemedText>
            </View>

            <View style={styles.filterRow}>
                <View style={styles.countBadge}>
                    <ThemedText type="small" style={{ fontWeight: 'bold', color: colors.icon }}>
                        {posts.length} {posts.length === 1 ? 'Discussion' : 'Discussions'}
                    </ThemedText>
                </View>

                <TouchableOpacity
                    style={[styles.filterBtn, { borderColor: colors.border }]}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                >
                    <ThemedText type="small" style={{ fontWeight: '600' }}>Latest</ThemedText>
                    <Ionicons name="chevron-down" size={14} color={colors.text} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <ThemedView style={styles.container}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: '',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.background },
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        >
                            <Ionicons name="chevron-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                    ),
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
                            <View style={[styles.emptyIconCircle, { backgroundColor: colors.surface }]}>
                                <Ionicons name="chatbubbles-outline" size={48} color={colors.icon} style={{ opacity: 0.5 }} />
                            </View>
                            <ThemedText type="h3" style={{ marginTop: Spacing.lg }}>
                                It's quiet here...
                            </ThemedText>
                            <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
                                Be the first to start a conversation in this circle.
                            </ThemedText>
                            <TouchableOpacity
                                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                                onPress={() => router.push(`/create-post?category=${activeCategory}`)}
                            >
                                <Ionicons name="add-circle-outline" size={20} color="#FFF" />
                                <ThemedText style={{ color: '#FFF', fontWeight: 'bold' }}>Start Discussion</ThemedText>
                            </TouchableOpacity>
                        </View>
                    ) : null
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
                }
                showsVerticalScrollIndicator={false}
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
    },
    heroBanner: {
        alignItems: 'center',
        padding: Spacing.xl,
        borderRadius: 24,
        marginBottom: Spacing.lg,
    },
    heroIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 8,
    },
    heroDesc: {
        fontSize: 15,
        textAlign: 'center',
        maxWidth: '80%',
        lineHeight: 22,
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
    },
    countBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    createButton: {
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        marginLeft: Spacing.sm,
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
        marginTop: Spacing.xl * 2,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 8,
        marginBottom: Spacing.xl,
        fontSize: 16,
        maxWidth: '80%',
    },
    emptyButton: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: Spacing.xl,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
});
