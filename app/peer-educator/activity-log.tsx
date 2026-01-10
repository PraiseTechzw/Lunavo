/**
 * Peer Educator Activity Log
 * Track support hours and session summaries
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
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ActivityEntry {
    id: string;
    type: 'session' | 'training' | 'meeting' | 'outreach';
    title: string;
    duration: number; // minutes
    date: Date;
    notes?: string;
}

// Mock data
const MOCK_ACTIVITIES: ActivityEntry[] = [
    { id: '1', type: 'session', title: 'Peer Support Session', duration: 45, date: new Date(), notes: 'Helped student with exam anxiety' },
    { id: '2', type: 'training', title: 'Crisis Response Training', duration: 120, date: new Date(Date.now() - 86400000) },
    { id: '3', type: 'meeting', title: 'Weekly PE Meeting', duration: 60, date: new Date(Date.now() - 172800000) },
];

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

    const { user } = useRoleGuard(['peer-educator', 'peer-educator-executive', 'admin'], '/(tabs)');

    const [activities, setActivities] = useState<ActivityEntry[]>(MOCK_ACTIVITIES);
    const [showAddModal, setShowAddModal] = useState(false);

    const totalHours = Math.round(activities.reduce((sum, a) => sum + a.duration, 0) / 60 * 10) / 10;
    const sessionsCount = activities.filter((a) => a.type === 'session').length;
    const trainingHours = Math.round(activities.filter((a) => a.type === 'training').reduce((s, a) => s + a.duration, 0) / 60 * 10) / 10;

    const handleLogNew = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
            'Log Activity',
            'What type of activity?',
            [
                { text: 'Support Session', onPress: () => addActivity('session') },
                { text: 'Training', onPress: () => addActivity('training') },
                { text: 'Meeting', onPress: () => addActivity('meeting') },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const addActivity = (type: 'session' | 'training' | 'meeting' | 'outreach') => {
        const newEntry: ActivityEntry = {
            id: Date.now().toString(),
            type,
            title: typeConfig[type].label,
            duration: 30,
            date: new Date(),
        };
        setActivities([newEntry, ...activities]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

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

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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

                    {activities.map((activity, idx) => {
                        const config = typeConfig[activity.type];
                        return (
                            <Animated.View key={activity.id} entering={FadeInRight.delay(idx * 80)}>
                                <View style={[styles.activityCard, { backgroundColor: colors.card }]}>
                                    <View style={[styles.activityIcon, { backgroundColor: config.color + '15' }]}>
                                        <MaterialCommunityIcons name={config.icon as any} size={24} color={config.color} />
                                    </View>
                                    <View style={styles.activityInfo}>
                                        <ThemedText style={styles.activityTitle}>{activity.title}</ThemedText>
                                        <ThemedText style={[styles.activityMeta, { color: colors.icon }]}>
                                            {activity.date.toLocaleDateString()} • {activity.duration} min
                                        </ThemedText>
                                        {activity.notes && (
                                            <ThemedText style={[styles.activityNotes, { color: colors.icon }]} numberOfLines={1}>
                                                {activity.notes}
                                            </ThemedText>
                                        )}
                                    </View>
                                    <ThemedText style={[styles.durationBadge, { backgroundColor: config.color + '15', color: config.color }]}>
                                        {Math.round(activity.duration / 60 * 10) / 10}h
                                    </ThemedText>
                                </View>
                            </Animated.View>
                        );
                    })}

                    {/* Self-Care Reminder */}
                    <Animated.View entering={FadeInDown.delay(500)}>
                        <View style={[styles.reminderCard, { backgroundColor: colors.success + '10', borderColor: colors.success + '30' }]}>
                            <MaterialCommunityIcons name="heart-outline" size={24} color={colors.success} />
                            <View style={styles.reminderContent}>
                                <ThemedText style={[styles.reminderTitle, { color: colors.success }]}>Self-Care Check</ThemedText>
                                <ThemedText style={[styles.reminderText, { color: colors.text }]}>
                                    You've been doing great work! Remember to take breaks and practice what you teach.
                                </ThemedText>
                            </View>
                        </View>
                    </Animated.View>

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
    reminderCard: {
        flexDirection: 'row',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        gap: 12,
        marginTop: Spacing.lg,
        alignItems: 'flex-start',
    },
    reminderContent: { flex: 1 },
    reminderTitle: { fontWeight: '700', marginBottom: 4 },
    reminderText: { fontSize: 13, lineHeight: 18 },
});
