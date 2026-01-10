/**
 * Peer Educator Executive Dashboard - "Command Center"
 * Advanced controls for team management, meetings, and global resources.
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Resource, User } from '@/app/types';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import {
    getNetworkStats,
    getPEUsers,
    getResources
} from '@/lib/database';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function PEExecutiveDashboard() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    // Role Guard: Only Executives and Admins
    const { user, loading: authLoading } = useRoleGuard(['peer-educator-executive', 'admin'], '/peer-educator/dashboard');

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [peTeam, setPeTeam] = useState<User[]>([]);
    const [globalResources, setGlobalResources] = useState<Resource[]>([]);
    const [networkStats, setNetworkStats] = useState({
        totalSessions: 0,
        totalHours: 0,
        activeSessions: 0,
        totalPEs: 0,
    });

    const loadData = useCallback(async () => {
        try {
            const [team, stats, resources] = await Promise.all([
                getPEUsers(),
                getNetworkStats(),
                getResources()
            ]);
            setPeTeam(team);
            setNetworkStats(stats);
            setGlobalResources(resources.slice(0, 5));
        } catch (e) {
            console.error('Executive Dashboard Load Failure:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) loadData();
    }, [user, loadData]);

    const handleRefresh = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    if (authLoading || loading) {
        return (
            <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </ThemedView>
        );
    }

    const StatCard = ({ title, value, icon, color }: any) => (
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
                <MaterialCommunityIcons name={icon} size={24} color={color} />
            </View>
            <View>
                <ThemedText style={styles.statValue}>{value}</ThemedText>
                <ThemedText style={styles.statLabel}>{title}</ThemedText>
            </View>
        </View>
    );

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <ThemedText style={styles.headerTitle}>Executive Console</ThemedText>
                        <ThemedText style={styles.headerSubtitle}>Network Orchestration & Oversight</ThemedText>
                    </View>
                    <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
                        <MaterialCommunityIcons name="chevron-down" size={28} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Network Stats Grid */}
                <Animated.View entering={FadeInDown.delay(100)} style={styles.statsGrid}>
                    <StatCard title="Total PEs" value={networkStats.totalPEs} icon="account-group" color="#3B82F6" />
                    <StatCard title="Active Sessions" value={networkStats.activeSessions} icon="record-circle-outline" color="#EF4444" />
                    <StatCard title="Total Impact" value={networkStats.totalSessions} icon="heart-pulse" color="#EC4899" />
                    <StatCard title="Total Hours" value={networkStats.totalHours} icon="clock-check" color="#10B981" />
                </Animated.View>

                {/* Administration Actions */}
                <ThemedText style={styles.sectionTitle}>Administration</ThemedText>
                <View style={styles.actionGrid}>
                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: colors.card }]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push('/peer-educator/executive/new-resource');
                        }}
                    >
                        <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.actionGradient}>
                            <MaterialCommunityIcons name="plus-circle" size={32} color="#FFF" />
                        </LinearGradient>
                        <ThemedText style={styles.actionText}>New Resource</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: colors.card }]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push('/peer-educator/executive/new-meeting');
                        }}
                    >
                        <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.actionGradient}>
                            <MaterialCommunityIcons name="calendar-plus" size={32} color="#FFF" />
                        </LinearGradient>
                        <ThemedText style={styles.actionText}>Schedule Meeting</ThemedText>
                    </TouchableOpacity>
                </View>

                {/* Team Performance Table Section */}
                <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionTitle}>Team Overview</ThemedText>
                    <TouchableOpacity><ThemedText style={{ color: colors.primary }}>View All</ThemedText></TouchableOpacity>
                </View>
                <View style={[styles.teamContainer, { backgroundColor: colors.card }]}>
                    {peTeam.slice(0, 5).map((pe, index) => (
                        <TouchableOpacity key={pe.id} style={[styles.peRow, index !== peTeam.length - 1 && styles.borderBottom]}>
                            <View style={[styles.peAvatar, { backgroundColor: colors.primary + '15' }]}>
                                <ThemedText style={{ color: colors.primary, fontWeight: 'bold' }}>{pe.pseudonym?.charAt(0)}</ThemedText>
                            </View>
                            <View style={{ flex: 1 }}>
                                <ThemedText style={styles.peName}>{pe.pseudonym}</ThemedText>
                                <ThemedText style={styles.peRole}>{pe.role === 'peer-educator-executive' ? 'Executive' : 'Educator'}</ThemedText>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.icon} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Global Resources Preview */}
                <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionTitle}>System Resources</ThemedText>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/resources')}><ThemedText style={{ color: colors.primary }}>Manage</ThemedText></TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.resourcesScroll}>
                    {globalResources.map((res) => (
                        <TouchableOpacity key={res.id} style={[styles.resourceCard, { backgroundColor: colors.card }]}>
                            <View style={[styles.resourceTypeIcon, { backgroundColor: colors.primary + '10' }]}>
                                <MaterialCommunityIcons
                                    name={res.resourceType === 'video' ? 'play-circle' : res.resourceType === 'article' ? 'file-document' : 'link-variant'}
                                    size={24}
                                    color={colors.primary}
                                />
                            </View>
                            <ThemedText numberOfLines={1} style={styles.resourceTitle}>{res.title}</ThemedText>
                            <ThemedText style={styles.resourceMeta}>{res.category}</ThemedText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        opacity: 0.6,
        fontSize: 14,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        ...PlatformStyles.shadow,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    statCard: {
        width: (width - Spacing.md * 2 - Spacing.sm) / 2,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        ...PlatformStyles.shadow,
    },
    statIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
    },
    statLabel: {
        fontSize: 12,
        opacity: 0.6,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: Spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.xl,
        marginBottom: Spacing.sm,
    },
    actionGrid: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    actionCard: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        ...PlatformStyles.shadow,
    },
    actionGradient: {
        width: 56,
        height: 56,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
    },
    teamContainer: {
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        ...PlatformStyles.shadow,
    },
    peRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        gap: Spacing.md,
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    peAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    peName: {
        fontWeight: '600',
    },
    peRole: {
        fontSize: 12,
        opacity: 0.5,
    },
    resourcesScroll: {
        gap: Spacing.md,
        paddingRight: Spacing.xl,
    },
    resourceCard: {
        width: 160,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        ...PlatformStyles.shadow,
    },
    resourceTypeIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    resourceTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    resourceMeta: {
        fontSize: 11,
        opacity: 0.5,
        textTransform: 'capitalize',
    }
});
