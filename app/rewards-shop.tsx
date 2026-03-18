import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCurrentUser } from '@/lib/database';
import { getUserPoints } from '@/lib/points-system';
import { SHOP_ITEMS, ShopItem, buyItem } from '@/lib/shop';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type Category = 'all' | 'profile' | 'badge' | 'charity' | 'theme';

export default function RewardsShopScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

    const [points, setPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [activeCategory, setActiveCategory] = useState<Category>('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) return;
            setUser(currentUser);
            const userPoints = await getUserPoints(currentUser.id);
            setPoints(userPoints);
        } catch (error) {
            console.error('Error loading shop data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = (item: ShopItem) => {
        if (points < item.price) {
            Alert.alert(
                'Insufficient Points',
                `You need ${item.price - points} more points to get the ${item.name}.`,
                [{ text: 'OK' }]
            );
            return;
        }

        Alert.alert(
            'Confirm Redemption',
            `Spend ${item.price} points on "${item.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Redeem Now',
                    style: 'default',
                    onPress: async () => {
                        setPurchasing(item.id);
                        try {
                            const result = await buyItem(user.id, item.id);
                            if (result.success) {
                                Alert.alert('✨ Reward Unlocked!', result.message);
                                loadData(); // Refresh points balance
                            } else {
                                Alert.alert('Error', result.message);
                            }
                        } catch (err) {
                            Alert.alert('Error', 'Something went wrong. Please try again.');
                        } finally {
                            setPurchasing(null);
                        }
                    }
                }
            ]
        );
    };

    const filteredItems = activeCategory === 'all' 
        ? SHOP_ITEMS 
        : SHOP_ITEMS.filter(item => item.category === activeCategory);

    const categories: { label: string; value: Category; icon: string }[] = [
        { label: 'All', value: 'all', icon: 'apps' },
        { label: 'Themes', value: 'theme', icon: 'palette' },
        { label: 'Badges', value: 'badge', icon: 'verified' },
        { label: 'Profile', value: 'profile', icon: 'face' },
        { label: 'Charity', value: 'charity', icon: 'volunteer-activism' },
    ];

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <LinearGradient
                colors={isDark ? ['#1e293b', '#0f172a'] : ['#6366f1', '#4f46e5']}
                style={styles.balanceCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.balanceHeader}>
                    <ThemedText style={styles.balanceLabel}>Your Balance</ThemedText>
                    <View style={styles.gemBadge}>
                        <MaterialIcons name="diamond" size={14} color="#FFF" />
                        <ThemedText style={styles.gemText}>PREMIUM</ThemedText>
                    </View>
                </View>
                
                <View style={styles.balanceMain}>
                    <MaterialIcons name="stars" size={40} color="#F59E0B" />
                    <ThemedText style={styles.balanceValue}>{points.toLocaleString()}</ThemedText>
                </View>
                
                <View style={styles.balanceFooter}>
                    <ThemedText style={styles.balanceHint}>Earn more by helping the community</ThemedText>
                </View>

                {/* Decorative Circles */}
                <View style={[styles.decorCircle, { top: -20, right: -20, opacity: 0.1 }]} />
                <View style={[styles.decorCircle, { bottom: -30, left: -10, opacity: 0.05, width: 100, height: 100 }]} />
            </LinearGradient>

            <View style={styles.categoryScroll}>
                <FlatList
                    horizontal
                    data={categories}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryList}
                    keyExtractor={item => item.value}
                    renderItem={({ item }) => {
                        const isActive = activeCategory === item.value;
                        return (
                            <TouchableOpacity
                                onPress={() => setActiveCategory(item.value)}
                                style={[
                                    styles.categoryChip,
                                    { 
                                        backgroundColor: isActive ? colors.primary : colors.card,
                                        borderColor: isActive ? colors.primary : colors.border
                                    }
                                ]}
                            >
                                <MaterialIcons 
                                    name={item.icon as any} 
                                    size={18} 
                                    color={isActive ? '#FFF' : colors.text} 
                                />
                                <ThemedText style={[styles.categoryText, { color: isActive ? '#FFF' : colors.text }]}>
                                    {item.label}
                                </ThemedText>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        </View>
    );

    const renderItem = ({ item, index }: { item: ShopItem; index: number }) => {
        const canAfford = points >= item.price;
        
        return (
            <Animated.View
                entering={FadeInDown.delay(index * 50).springify()}
                layout={Layout.springify()}
                style={[
                    styles.itemCard,
                    { 
                        backgroundColor: colors.card,
                        borderColor: colors.border
                    }
                ]}
            >
                <View style={[styles.itemIconWrapper, { backgroundColor: colors.primary + '10' }]}>
                    <MaterialIcons name={item.icon as any} size={32} color={colors.primary} />
                </View>

                <View style={styles.itemMain}>
                    <View style={styles.itemHeader}>
                        <ThemedText type="h3" style={styles.itemName}>{item.name}</ThemedText>
                        <View style={[styles.tag, { backgroundColor: colors.primary + '15' }]}>
                            <ThemedText style={[styles.tagText, { color: colors.primary }]}>
                                {item.category.toUpperCase()}
                            </ThemedText>
                        </View>
                    </View>
                    
                    <ThemedText style={styles.itemDesc}>{item.description}</ThemedText>

                    <View style={styles.itemFooter}>
                        <View style={styles.costContainer}>
                            <MaterialIcons name="stars" size={18} color="#F59E0B" />
                            <ThemedText style={styles.costText}>{item.price}</ThemedText>
                        </View>

                        <TouchableOpacity
                            onPress={() => handlePurchase(item)}
                            disabled={purchasing === item.id}
                            style={[
                                styles.redeemBtn,
                                { 
                                    backgroundColor: canAfford ? colors.primary : colors.icon + '30',
                                    opacity: canAfford ? 1 : 0.7
                                }
                            ]}
                        >
                            {purchasing === item.id ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <>
                                    <ThemedText style={styles.redeemText}>Redeem</ThemedText>
                                    <MaterialIcons name="arrow-forward" size={14} color="#FFF" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Navbar */}
            <View style={styles.navBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <ThemedText type="h2" style={styles.navTitle}>Rewards Shop</ThemedText>
                <TouchableOpacity style={styles.historyBtn}>
                    <MaterialIcons name="history" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centering}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredItems}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    ListHeaderComponent={renderHeader}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <MaterialIcons name="inventory-2" size={64} color={colors.icon} />
                            <ThemedText style={styles.emptyTitle}>No items found</ThemedText>
                            <ThemedText style={styles.emptySub}>Check back later for new rewards!</ThemedText>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    navTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    historyBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    headerContainer: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    balanceCard: {
        borderRadius: BorderRadius.xxl,
        padding: Spacing.xl,
        marginVertical: Spacing.md,
        overflow: 'hidden',
        ...PlatformStyles.premiumShadow,
    },
    balanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontWeight: '600',
    },
    gemBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    gemText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
    },
    balanceMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    balanceValue: {
        fontSize: 42,
        fontWeight: '800',
        color: '#FFF',
    },
    balanceFooter: {
        marginTop: 12,
    },
    balanceHint: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
    },
    decorCircle: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#FFF',
    },
    categoryScroll: {
        marginTop: Spacing.md,
    },
    categoryList: {
        paddingRight: 40,
        gap: 10,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        gap: 6,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '700',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    itemCard: {
        flexDirection: 'row',
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        padding: Spacing.md,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        ...PlatformStyles.shadow,
    },
    itemIconWrapper: {
        width: 70,
        height: 70,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    itemMain: {
        flex: 1,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    itemName: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
    },
    tag: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    tagText: {
        fontSize: 9,
        fontWeight: '900',
    },
    itemDesc: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
        marginBottom: 12,
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    costContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    costText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#F59E0B',
    },
    redeemBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: BorderRadius.full,
        gap: 6,
    },
    redeemText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '800',
    },
    centering: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 16,
    },
    emptySub: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 8,
    },
});
