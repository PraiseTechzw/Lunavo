import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SecuritySettingsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [loading, setLoading] = useState(false);
    const [passwords, setPasswords] = useState({
        new: '',
        confirm: '',
    });

    const handleUpdatePassword = async () => {
        if (!passwords.new || passwords.new.length < 6) {
            Alert.alert('Invalid Password', 'Password must be at least 6 characters.');
            return;
        }

        if (passwords.new !== passwords.confirm) {
            Alert.alert('Oops!', 'Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: passwords.new
            });

            if (error) throw error;

            Alert.alert('Success', 'Your password has been updated.');
            router.back();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <ThemedText type="h2">Security</ThemedText>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.section}>
                        <ThemedText type="h3" style={styles.sectionTitle}>Change Password</ThemedText>
                        <ThemedText style={styles.hint}>
                            To secure your account, choose a strong password that you don't use elsewhere.
                        </ThemedText>

                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.label}>New Password</ThemedText>
                            <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    secureTextEntry
                                    value={passwords.new}
                                    onChangeText={(txt) => setPasswords({ ...passwords, new: txt })}
                                    placeholder="Enter new password"
                                    placeholderTextColor={colors.icon}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.label}>Confirm New Password</ThemedText>
                            <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    secureTextEntry
                                    value={passwords.confirm}
                                    onChangeText={(txt) => setPasswords({ ...passwords, confirm: txt })}
                                    placeholder="Confirm new password"
                                    placeholderTextColor={colors.icon}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                            onPress={handleUpdatePassword}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#FFF" /> : (
                                <ThemedText style={styles.saveBtnText}>Update Password</ThemedText>
                            )}
                        </TouchableOpacity>
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
        gap: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    hint: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 8,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
    inputContainer: {
        height: 56,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    input: {
        fontSize: 16,
    },
    saveBtn: {
        height: 56,
        borderRadius: BorderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    saveBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
