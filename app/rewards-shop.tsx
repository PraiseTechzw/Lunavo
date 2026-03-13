/**
 * Rewards Shop Screen
 */

import { ThemedText } from '@/app/_components/themed-text';
import { ThemedView } from '@/app/_components/themed-view';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/_constants/theme';
import { useColorScheme } from '@/app/_hooks/use-color-scheme';
import { getCurrentUser } from '@/lib/database';
import { getUserPoints } from '@/lib/points-system';
import { SHOP_ITEMS, ShopItem, buyItem } from '@/lib/shop';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RewardsShopScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const [points, setPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);

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
            Alert.alert('Insufficient Points', `You need ${item.price - points} more points to buy this item.`);
            return;
        }

        Alert.alert(
            'Confirm Purchase',
            `Are you sure you want to spend ${item.price} points on ${item.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Buy Now',
                    onPress: async () => {
                        setPurchasing(item.id);
                        try {
                            const result = await buyItem(user.id, item.id);
                            if (result.success) {
                                Alert.alert('Success!', result.message);
                                loadData(); // Refresh points
                            } else {
                                Alert.alert('Error', result.message);
                            }
                        } catch (err) {
                            Alert.alert('Error', 'An error occurred during purchase.');
                        } finally {
                            setPurchasing(null);
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item, index }: { item: ShopItem; index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 100)}
            style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <MaterialIcons name={item.icon as any} size={32} color={colors.primary} />
            </View>
            <View style={styles.itemContent}>
                <ThemedText type="h3" style={styles.itemName}>{item.name}</ThemedText>
                <ThemedText style={styles.itemDescription}>{item.description}</ThemedText>
                <View style={styles.priceRow}>
                    <View style={styles.priceContainer}>
                        <MaterialIcons name="stars" size={16} color="#F59E0B" />
                        <ThemedText style={styles.priceText}>{item.price}</ThemedText>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.buyButton,
                            { backgroundColor: points >= item.price ? colors.primary : colors.icon + '40' }
                        ]}
                        onPress={() => handlePurchase(item)}
                        disabled={purchasing !== null}
                    >
                        {purchasing === item.id ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <ThemedText style={styles.buyButtonText}>Redeem</ThemedText>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );

    return (
        <SafeAreaView edges={['top']} style={styles.safeArea}>
            <ThemedView style={styles.container}>
                {/* Header */}
                <LinearGradient
                    colors={colors.gradients.primary as any}
                    style={styles.header}
                >
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <MaterialIcons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <ThemedText type="h2" style={styles.headerTitle}>Rewards Shop</ThemedText>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={styles.pointsDisplay}>
                        <ThemedText style={styles.pointsLabel}>Available Balance</ThemedText>
                        <View style={styles.pointsValueContainer}>
                            <MaterialIcons name="stars" size={32} color="#F59E0B" />
                            <ThemedText style={styles.pointsValue}>{points}</ThemedText>
                        </View>
                    </View>
                </LinearGradient>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={SHOP_ITEMS}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={
                            <View style={styles.listHeader}>
                                <ThemedText type="h2">Premium Rewards</ThemedText>
                                <ThemedText style={styles.listSubtitle}>Spend your points on exclusive items and contributions.</ThemedText>
                            </View>
                        }
                    />
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: Spacing.lg,
        paddingTop: Spacing.xl,
        borderBottomLeftRadius: BorderRadius.xxl,
        borderBottomRightRadius: BorderRadius.xxl,
        ...PlatformStyles.premiumShadow,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.xl,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFF',
        fontWeight: '700',
    },
    pointsDisplay: {
        alignItems: 'center',
        paddingBottom: Spacing.md,
    },
    pointsLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 4,
    },
    pointsValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    pointsValue: {
        color: '#FFF',
        fontSize: 36,
        fontWeight: '800',
    },
    listContent: {
        padding: Spacing.lg,
        paddingBottom: 40,
    },
    listHeader: {
        marginBottom: Spacing.xl,
    },
    listSubtitle: {
        color: '#64748B',
        marginTop: 4,
    },
    itemCard: {
        flexDirection: 'row',
        padding: Spacing.md,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginBottom: Spacing.md,
        ...PlatformStyles.shadow,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    itemContent: {
        flex: 1,
    },
    itemName: {
        fontSize: 18,
        marginBottom: 4,
    },
    itemDescription: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
        marginBottom: 12,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    priceText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#F59E0B',
    },
    buyButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: BorderRadius.full,
    },
    buyButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 12,
    },
});
