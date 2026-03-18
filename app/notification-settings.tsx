import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationSettingsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [notifs, setNotifs] = useState({
        mentions: true,
        replies: true,
        badges: true,
        sessions: true,
        marketing: false,
    });

    const toggle = (key: keyof typeof notifs) => {
        setNotifs({ ...notifs, [key]: !notifs[key] });
        // In a real app, you'd sync this with Supabase or AsyncStorage
    };

    const SettingItem = ({ title, desc, value, onToggle }: any) => (
        <View style={[styles.settingItem, { borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
                <ThemedText style={styles.settingTitle}>{title}</ThemedText>
                <ThemedText style={styles.settingDesc}>{desc}</ThemedText>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
            />
        </View>
    );

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <ThemedText type="h2">Notifications</ThemedText>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.section}>
                        <ThemedText type="h3" style={styles.sectionTitle}>Activity</ThemedText>
                        <SettingItem
                            title="Mentions"
                            desc="When someone @mentions you in a post"
                            value={notifs.mentions}
                            onToggle={() => toggle('mentions')}
                        />
                        <SettingItem
                            title="Replies"
                            desc="When someone replies to your post"
                            value={notifs.replies}
                            onToggle={() => toggle('replies')}
                        />
                        <SettingItem
                            title="Badge Earned"
                            desc="When you unlock a new achievement"
                            value={notifs.badges}
                            onToggle={() => toggle('badges')}
                        />
                    </View>

                    <View style={styles.section}>
                        <ThemedText type="h3" style={styles.sectionTitle}>Sessions</ThemedText>
                        <SettingItem
                            title="Upcoming Meetings"
                            desc="Reminders for scheduled support sessions"
                            value={notifs.sessions}
                            onToggle={() => toggle('sessions')}
                        />
                    </View>

                    <View style={styles.section}>
                        <ThemedText type="h3" style={styles.sectionTitle}>General</ThemedText>
                        <SettingItem
                            title="Community Updates"
                            desc="News and tips from the Lunavo team"
                            value={notifs.marketing}
                            onToggle={() => toggle('marketing')}
                        />
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    },
    backBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
    },
    scrollContent: {
        padding: Spacing.lg,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 16,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    settingDesc: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
});
