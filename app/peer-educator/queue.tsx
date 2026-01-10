/**
 * Peer Educator Support Queue
 * View and accept anonymous student support requests
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SupportRequest {
    id: string;
    pseudonym: string;
    preview: string;
    priority: 'urgent' | 'normal' | 'low';
    category: string;
    createdAt: Date;
    status: 'pending' | 'accepted' | 'resolved';
}

// Mock data - would come from Supabase in production
const MOCK_QUEUE: SupportRequest[] = [
    { id: '1', pseudonym: 'SilentOcean42', preview: 'Feeling overwhelmed with exams...', priority: 'urgent', category: 'Academic Stress', createdAt: new Date(), status: 'pending' },
    { id: '2', pseudonym: 'QuietMountain', preview: 'Need someone to talk to about...', priority: 'normal', category: 'Loneliness', createdAt: new Date(Date.now() - 3600000), status: 'pending' },
    { id: '3', pseudonym: 'GentleRiver88', preview: 'Struggling with motivation lately...', priority: 'low', category: 'Motivation', createdAt: new Date(Date.now() - 7200000), status: 'pending' },
];

const priorityConfig = {
    urgent: { color: '#EF4444', icon: 'alert-circle', label: 'Urgent' },
    normal: { color: '#F59E0B', icon: 'clock-outline', label: 'Normal' },
    low: { color: '#10B981', icon: 'check-circle-outline', label: 'Low' },
};

export default function SupportQueueScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const { user, loading } = useRoleGuard(['peer-educator', 'peer-educator-executive', 'admin'], '/(tabs)');

    const [queue, setQueue] = useState<SupportRequest[]>(MOCK_QUEUE);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'urgent' | 'normal'>('all');

    const filteredQueue = queue.filter((req) => {
        if (filter === 'all') return true;
        return req.priority === filter;
    });

    const handleAccept = (request: SupportRequest) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
            'Accept Request',
            `Start an anonymous chat session with ${request.pseudonym}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Start Session',
                    onPress: () => {
                        // Would navigate to chat session
                        router.push(`/peer-educator/session/${request.id}` as any);
                    },
                },
            ]
        );
    };

    const handleRefresh = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setRefreshing(true);
        // Simulate reload
        await new Promise((r) => setTimeout(r, 1000));
        setRefreshing(false);
    };

    return (
        <SafeAreaView edges={['top']} style={styles.safeArea}>
            <ThemedView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <ThemedText type="h2">Support Queue</ThemedText>
                    <View style={{ width: 40 }} />
                </View>

                {/* Filter Tabs */}
                <Animated.View entering={FadeInDown.delay(100)} style={styles.filterRow}>
                    {(['all', 'urgent', 'normal'] as const).map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[
                                styles.filterTab,
                                { backgroundColor: filter === f ? colors.primary : colors.surface, borderColor: colors.border },
                            ]}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setFilter(f);
                            }}
                        >
                            <ThemedText style={{ color: filter === f ? '#FFF' : colors.text, fontWeight: '600', textTransform: 'capitalize' }}>
                                {f === 'all' ? 'All' : f}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </Animated.View>

                {/* Stats Banner */}
                <Animated.View entering={FadeInDown.delay(200)}>
                    <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.statsBanner}>
                        <View style={styles.statItem}>
                            <ThemedText style={styles.statNum}>{queue.filter((q) => q.priority === 'urgent').length}</ThemedText>
                            <ThemedText style={styles.statLbl}>Urgent</ThemedText>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <ThemedText style={styles.statNum}>{queue.length}</ThemedText>
                            <ThemedText style={styles.statLbl}>Total</ThemedText>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <ThemedText style={styles.statNum}>~5m</ThemedText>
                            <ThemedText style={styles.statLbl}>Avg Wait</ThemedText>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Queue List */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
                >
                    {filteredQueue.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="check-decagram" size={64} color={colors.success} />
                            <ThemedText type="h3" style={{ marginTop: 16 }}>Queue Clear!</ThemedText>
                            <ThemedText style={{ color: colors.icon, textAlign: 'center', marginTop: 8 }}>
                                No pending requests. Great job keeping up!
                            </ThemedText>
                        </View>
                    ) : (
                        filteredQueue.map((request, idx) => {
                            const priority = priorityConfig[request.priority];
                            return (
                                <Animated.View key={request.id} entering={FadeInRight.delay(idx * 100)}>
                                    <TouchableOpacity
                                        style={[styles.requestCard, { backgroundColor: colors.card, borderLeftColor: priority.color }]}
                                        onPress={() => handleAccept(request)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.cardHeader}>
                                            <View style={[styles.priorityBadge, { backgroundColor: priority.color + '20' }]}>
                                                <MaterialCommunityIcons name={priority.icon as any} size={14} color={priority.color} />
                                                <ThemedText style={[styles.priorityText, { color: priority.color }]}>{priority.label}</ThemedText>
                                            </View>
                                            <ThemedText style={[styles.categoryTag, { color: colors.icon }]}>{request.category}</ThemedText>
                                        </View>

                                        <View style={styles.cardBody}>
                                            <View style={styles.avatarBox}>
                                                <MaterialCommunityIcons name="account-circle" size={40} color={colors.icon} />
                                            </View>
                                            <View style={styles.cardContent}>
                                                <ThemedText style={styles.pseudonym}>{request.pseudonym}</ThemedText>
                                                <ThemedText style={[styles.preview, { color: colors.icon }]} numberOfLines={2}>
                                                    "{request.preview}"
                                                </ThemedText>
                                            </View>
                                        </View>

                                        <View style={styles.cardFooter}>
                                            <ThemedText style={[styles.timeAgo, { color: colors.icon }]}>
                                                {Math.round((Date.now() - request.createdAt.getTime()) / 60000)} min ago
                                            </ThemedText>
                                            <View style={[styles.acceptBtn, { backgroundColor: colors.primary }]}>
                                                <ThemedText style={styles.acceptText}>Accept</ThemedText>
                                                <MaterialCommunityIcons name="arrow-right" size={16} color="#FFF" />
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        })
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>
            </ThemedView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: 10, marginBottom: Spacing.md },
    filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    statsBanner: { marginHorizontal: Spacing.lg, borderRadius: BorderRadius.xl, padding: Spacing.lg, flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.lg },
    statItem: { alignItems: 'center' },
    statNum: { color: '#FFF', fontSize: 24, fontWeight: '800' },
    statLbl: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
    statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
    scrollView: { flex: 1 },
    scrollContent: { padding: Spacing.lg },
    emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl },
    requestCard: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderLeftWidth: 4,
        ...PlatformStyles.premiumShadow,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    priorityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
    priorityText: { fontSize: 12, fontWeight: '600' },
    categoryTag: { fontSize: 12 },
    cardBody: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
    avatarBox: { opacity: 0.6 },
    cardContent: { flex: 1 },
    pseudonym: { fontWeight: '700', fontSize: 16, marginBottom: 4 },
    preview: { fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    timeAgo: { fontSize: 12 },
    acceptBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, gap: 6 },
    acceptText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});
