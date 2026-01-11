/**
 * Create Channel Screen - Allow users/moderators to create new support circles
 */

import { ThemedText } from '@/app/components/themed-text';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { PostCategory } from '@/app/types';
import { createCategory } from '@/lib/database';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ICON_OPTIONS = [
    'leaf-outline', 'heart-outline', 'medkit-outline', 'school-outline',
    'people-outline', 'home-outline', 'shield-checkmark-outline', 'pulse-outline',
    'chatbubbles-outline', 'flag-outline', 'gift-outline', 'happy-outline'
];

const COLOR_OPTIONS = [
    '#8B5CF6', '#F59E0B', '#EC4899', '#F97316', '#6366F1', '#10B981', '#06B6D4'
];

export default function CreateChannelScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedIcon, setSelectedIcon] = useState(ICON_OPTIONS[0]);
    const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a name for the circle');
            return;
        }

        setIsSubmitting(true);
        try {
            // Create slug from name
            const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

            await createCategory({
                id: slug as PostCategory,
                name,
                description,
                icon: selectedIcon,
                color: selectedColor,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Circle created successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Error creating circle:', error);
            Alert.alert('Error', 'Failed to create circle. It might already exist.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="close" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <ThemedText type="h2" style={styles.headerTitle}>New Circle</ThemedText>
                    <TouchableOpacity
                        onPress={handleCreate}
                        disabled={isSubmitting || !name.trim()}
                        style={[styles.createButton, { backgroundColor: colors.primary, opacity: (isSubmitting || !name.trim()) ? 0.6 : 1 }]}
                    >
                        <ThemedText style={styles.createText}>Create</ThemedText>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
                    <View style={styles.previewContainer}>
                        <View style={[styles.previewIconBox, { backgroundColor: selectedColor + '15', borderColor: selectedColor + '30' }]}>
                            <Ionicons name={selectedIcon as any} size={40} color={selectedColor} />
                        </View>
                        <ThemedText type="h3" style={{ marginTop: 12 }}>{name || 'Circle Name'}</ThemedText>
                        <ThemedText style={{ color: colors.icon, textAlign: 'center', marginTop: 4 }}>
                            {description || 'No description provided yet.'}
                        </ThemedText>
                    </View>

                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Identity & Purpose</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                            placeholder="Name (e.g. Daily Motivation)"
                            placeholderTextColor={colors.icon}
                            value={name}
                            onChangeText={setName}
                        />
                        <TextInput
                            style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                            placeholder="What is this circle about?"
                            placeholderTextColor={colors.icon}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Visual Style</ThemedText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionRow}>
                            {ICON_OPTIONS.map((icon) => (
                                <TouchableOpacity
                                    key={icon}
                                    onPress={() => setSelectedIcon(icon)}
                                    style={[
                                        styles.iconOption,
                                        { borderColor: selectedIcon === icon ? colors.primary : colors.border }
                                    ]}
                                >
                                    <Ionicons name={icon as any} size={24} color={selectedIcon === icon ? colors.primary : colors.icon} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.optionRow, { marginTop: 12 }]}>
                            {COLOR_OPTIONS.map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    onPress={() => setSelectedColor(color)}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: color, borderColor: selectedColor === color ? colors.text : 'transparent' }
                                    ]}
                                />
                            ))}
                        </ScrollView>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    backButton: {
        width: 40,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    createButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: BorderRadius.full,
    },
    createText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    content: {
        flex: 1,
        padding: Spacing.xl,
    },
    previewContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
        padding: Spacing.lg,
        borderRadius: BorderRadius.xxl,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    previewIconBox: {
        width: 80,
        height: 80,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    label: {
        fontSize: 14,
        fontWeight: '800',
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Spacing.md,
    },
    input: {
        height: 56,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        paddingHorizontal: Spacing.md,
        fontSize: 16,
        marginBottom: Spacing.md,
    },
    textArea: {
        height: 100,
        paddingTop: Spacing.md,
        textAlignVertical: 'top',
    },
    optionRow: {
        gap: Spacing.md,
    },
    iconOption: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
    },
});
