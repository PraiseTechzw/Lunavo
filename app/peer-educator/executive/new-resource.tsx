/**
 * New Resource Screen - PE Executive Tool
 * Allows creation of system-wide educational resources.
 */

import { ThemedText } from '@/app/components/themed-text';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { PostCategory } from '@/app/types';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { createResource } from '@/lib/database';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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

const RESOURCE_TYPES = [
    { id: 'article', label: 'Article', icon: 'file-document' },
    { id: 'video', label: 'Video', icon: 'play-circle' },
    { id: 'pdf', label: 'PDF Document', icon: 'file-pdf' },
    { id: 'link', label: 'External Link', icon: 'link-variant' },
];

const CATEGORIES: PostCategory[] = [
    'mental-health',
    'crisis',
    'academic',
    'social',
    'relationships',
    'general',
];

export default function NewResourceScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    // Role Guard
    const { user, loading: authLoading } = useRoleGuard(['peer-educator-executive', 'admin'], '/peer-educator/dashboard');

    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        category: 'general' as PostCategory,
        resourceType: 'article' as 'article' | 'video' | 'pdf' | 'link' | 'training',
        url: '',
        tags: '',
    });

    const handleSubmit = async () => {
        if (!form.title || !form.url) {
            Alert.alert('Incomplete Form', 'Please provide a title and a valid URL/Path.');
            return;
        }

        try {
            setSubmitting(true);
            await createResource({
                title: form.title,
                description: form.description,
                category: form.category,
                resourceType: form.resourceType,
                url: form.url,
                tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
                createdBy: user!.id,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Resource has been posted to the system.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (e) {
            console.error('Failed to create resource:', e);
            Alert.alert('Error', 'Could not post resource. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading) return <ActivityIndicator style={{ flex: 1 }} />;

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <ThemedText style={styles.title}>Post New Resource</ThemedText>
                </View>

                <View style={styles.formContainer}>
                    {/* Title */}
                    <ThemedText style={styles.label}>Title</ThemedText>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                        placeholder="e.g. Managing Exam Anxiety"
                        placeholderTextColor={colors.icon}
                        value={form.title}
                        onChangeText={(t) => setForm({ ...form, title: t })}
                    />

                    {/* Type Picker */}
                    <ThemedText style={styles.label}>Resource Type</ThemedText>
                    <View style={styles.typeGrid}>
                        {RESOURCE_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type.id}
                                style={[
                                    styles.typeCard,
                                    { backgroundColor: colors.surface },
                                    form.resourceType === type.id && { borderColor: colors.primary, borderWidth: 2 }
                                ]}
                                onPress={() => setForm({ ...form, resourceType: type.id as any })}
                            >
                                <MaterialCommunityIcons
                                    name={type.icon as any}
                                    size={24}
                                    color={form.resourceType === type.id ? colors.primary : colors.icon}
                                />
                                <ThemedText style={[styles.typeLabel, form.resourceType === type.id && { color: colors.primary }]}>
                                    {type.label}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* URL */}
                    <ThemedText style={styles.label}>Resource URL / Path</ThemedText>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                        placeholder="https://... or drive path"
                        placeholderTextColor={colors.icon}
                        value={form.url}
                        onChangeText={(t) => setForm({ ...form, url: t })}
                    />

                    {/* Category */}
                    <ThemedText style={styles.label}>Category</ThemedText>
                    <View style={styles.chipGrid}>
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.chip,
                                    { backgroundColor: colors.surface },
                                    form.category === cat && { backgroundColor: colors.primary }
                                ]}
                                onPress={() => setForm({ ...form, category: cat })}
                            >
                                <ThemedText style={[styles.chipText, form.category === cat && { color: '#FFF' }]}>
                                    {cat.replace('-', ' ')}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Description */}
                    <ThemedText style={styles.label}>Description (Optional)</ThemedText>
                    <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                        placeholder="What is this resource about?"
                        placeholderTextColor={colors.icon}
                        multiline
                        numberOfLines={4}
                        value={form.description}
                        onChangeText={(t) => setForm({ ...form, description: t })}
                    />

                    {/* Tags */}
                    <ThemedText style={styles.label}>Tags (Comma separated)</ThemedText>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                        placeholder="wellness, exam, stress"
                        placeholderTextColor={colors.icon}
                        value={form.tags}
                        onChangeText={(t) => setForm({ ...form, tags: t })}
                    />

                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: colors.primary }]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <ThemedText style={styles.submitText}>Publish Resource</ThemedText>
                        )}
                    </TouchableOpacity>
                </View>
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
        alignItems: 'center',
        marginBottom: Spacing.xl,
        gap: Spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
    },
    formContainer: {
        gap: Spacing.md,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        opacity: 0.8,
        marginBottom: 4,
    },
    input: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        fontSize: 16,
        borderWidth: 1,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    typeCard: {
        flex: 1,
        minWidth: '45%',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        gap: Spacing.xs,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
    },
    chip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    submitButton: {
        marginTop: Spacing.xl,
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        ...PlatformStyles.shadow,
    },
    submitText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    }
});
