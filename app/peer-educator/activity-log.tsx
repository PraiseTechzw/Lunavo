/**
 * Peer Educator Activity Log
 * Connected to Supabase backend
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { ActivityLog } from '@/app/types';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { createActivityLog, getActivityLogs } from '@/lib/database';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const typeConfig = {
    session: { icon: 'message-text-outline', color: '#6366F1', label: 'Support Session' },
    training: { icon: 'school-outline', color: '#10B981', label: 'Training' },
    meeting: { icon: 'account-group-outline', color: '#F59E0B', label: 'Meeting' },
    outreach: { icon: 'bullhorn-outline', color: '#EC4899', label: 'Outreach' },
};

export default function ActivityLogScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const { user, loading: authLoading } = useRoleGuard(['peer-educator', 'peer-educator-executive', 'admin'], '/(tabs)');

    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadActivities = useCallback(async () => {
        if (!user?.id) return;
        try {
            const data = await getActivityLogs(user.id);
            setActivities(data);
        } catch (error) {
            console.error('Failed to load logs:', error);
            Alert.alert('Error', 'Failed to load activity logs');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (user) loadActivities();
    }, [user, loadActivities]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadActivities();
        setRefreshing(false);
    };

    const totalHours = Math.round(activities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0) / 60 * 10) / 10;
    const sessionsCount = activities.filter((a) => a.activity_type === 'session').length;
    const trainingHours = Math.round(activities.filter((a) => a.activity_type === 'training').reduce((s, a) => s + (a.duration_minutes || 0), 0) / 60 * 10) / 10;

    const handleLogNew = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
            'Log Activity',
            'What type of activity would you like to log?',
            [
                { text: 'Support Session', onPress: () => logActivity('session', 'Support Session', 45) },
                { text: 'Training', onPress: () => logActivity('training', 'PE Training', 60) },
                { text: 'Meeting', onPress: () => logActivity('meeting', 'Team Meeting', 30) },
                { text: 'Outreach', onPress: () => logActivity('outreach', 'Community Outreach', 90) },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const logActivity = async (type: ActivityLog['activity_type'], title: string, duration: number) => {
        if (!user?.id) return;

        try {
            await createActivityLog({
                user_id: user.id,
                activity_type: type,
                title: title,
                duration_minutes: duration,
                date: new Date().toISOString().split('T')[0],
                notes: `Logged via dashboard`,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadActivities();
        } catch (error) {
            console.error('Failed to log activity:', error);
            Alert.alert('Error', 'Failed to log activity to backend');
        }
    };

    if (authLoading || loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['top']} style={styles.safeArea}>
            <ThemedView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <ThemedText type="h2">Activity Log</ThemedText>
                    <TouchableOpacity onPress={handleLogNew} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
                        <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
                >
                    {/* Stats Overview */}
                    <Animated.View entering={FadeInDown.duration(500)}>
                        <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.statsCard}>
                            <View style={styles.statsRow}>
                                <View style={styles.statBox}>
                                    <ThemedText style={styles.statNum}>{totalHours}</ThemedText>
                                    <ThemedText style={styles.statLabel}>Total Hours</ThemedText>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statBox}>
                                    <ThemedText style={styles.statNum}>{sessionsCount}</ThemedText>
                                    <ThemedText style={styles.statLabel}>Sessions</ThemedText>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statBox}>
                                    <ThemedText style={styles.statNum}>{trainingHours}</ThemedText>
                                    <ThemedText style={styles.statLabel}>Training</ThemedText>
                                </View>
                            </View>

                            <View style={styles.progressSection}>
                                <View style={styles.progressHeader}>
                                    <ThemedText style={styles.progressLabel}>Monthly Goal: 20 hours</ThemedText>
                                    <ThemedText style={styles.progressLabel}>{Math.round((totalHours / 20) * 100)}%</ThemedText>
                                </View>
                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: `${Math.min((totalHours / 20) * 100, 100)}%` }]} />
                                </View>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* Activity List */}
                    <ThemedText type="h3" style={styles.sectionTitle}>Recent Activity</ThemedText>

                    {activities.length === 0 ? (
                        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                            <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={colors.icon} />
                            <ThemedText style={{ color: colors.icon, marginTop: 12 }}>No activity logged yet</ThemedText>
                        </View>
                    ) : (
                        activities.map((activity, idx) => {
                            const config = typeConfig[activity.activity_type] || typeConfig.session;
                            return (
                                <Animated.View key={activity.id} entering={FadeInRight.delay(idx * 80)}>
                                    <View style={[styles.activityCard, { backgroundColor: colors.card }]}>
                                        <View style={[styles.activityIcon, { backgroundColor: config.color + '15' }]}>
                                            <MaterialCommunityIcons name={config.icon as any} size={24} color={config.color} />
                                        </View>
                                        <View style={styles.activityInfo}>
                                            <ThemedText style={styles.activityTitle}>{activity.title}</ThemedText>
                                            <ThemedText style={[styles.activityMeta, { color: colors.icon }]}>
                                                {activity.date} • {activity.duration_minutes} min
                                            </ThemedText>
                                            {activity.notes && (
                                                <ThemedText style={[styles.activityNotes, { color: colors.icon }]} numberOfLines={1}>
                                                    {activity.notes}
                                                </ThemedText>
                                            )}
                                        </View>
                                        <ThemedText style={[styles.durationBadge, { backgroundColor: config.color + '15', color: config.color }]}>
                                            {Math.round(activity.duration_minutes / 60 * 10) / 10}h
                                        </ThemedText>
                                    </View>
                                </Animated.View>
                            );
                        })
                    )}

                    <View style={{ height: 120 }} />
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
    addBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    scrollView: { flex: 1 },
    scrollContent: { padding: Spacing.lg },
    statsCard: { borderRadius: BorderRadius.xxl, padding: Spacing.xl, marginBottom: Spacing.xl },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.lg },
    statBox: { alignItems: 'center' },
    statNum: { color: '#FFF', fontSize: 28, fontWeight: '800' },
    statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 },
    statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
    progressSection: { marginTop: 8 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
    progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 4 },
    sectionTitle: { marginBottom: Spacing.md, fontWeight: '700' },
    emptyState: { padding: 40, borderRadius: BorderRadius.xl, alignItems: 'center', justifyContent: 'center' },
    activityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.sm,
        gap: 12,
        ...PlatformStyles.premiumShadow,
    },
    activityIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    activityInfo: { flex: 1 },
    activityTitle: { fontWeight: '600', marginBottom: 2 },
    activityMeta: { fontSize: 12 },
    activityNotes: { fontSize: 12, fontStyle: 'italic', marginTop: 4 },
    durationBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, fontWeight: '700', fontSize: 12 },
});
