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
    StatusBar,
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
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
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
                    <View style={[styles.previewContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={[styles.previewIconBox, { backgroundColor: selectedColor + '15', borderColor: selectedColor + '30' }]}>
                            <Ionicons name={selectedIcon as any} size={42} color={selectedColor} />
                        </View>
                        <ThemedText style={styles.previewTitle}>{name || 'Circle Name'}</ThemedText>
                        <ThemedText style={[styles.previewDesc, { color: colors.icon }]}>
                            {description || 'Clearly define the purpose of this support circle to help others find it.'}
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
        height: 72,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    createButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: BorderRadius.xl,
    },
    createText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 15,
    },
    content: {
        flex: 1,
        padding: Spacing.xl,
    },
    previewContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
        padding: Spacing.xl,
        borderRadius: 32,
        borderWidth: 1,
    },
    previewIconBox: {
        width: 84,
        height: 84,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    previewTitle: {
        marginTop: 16,
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    previewDesc: {
        textAlign: 'center',
        marginTop: 8,
        fontSize: 15,
        lineHeight: 22,
        opacity: 0.6,
        paddingHorizontal: Spacing.md,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    label: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1.5,
        marginBottom: Spacing.md,
        textTransform: 'uppercase',
        opacity: 0.5,
    },
    input: {
        height: 60,
        borderRadius: 18,
        borderWidth: 1.5,
        paddingHorizontal: 20,
        fontSize: 16,
        marginBottom: 12,
        fontWeight: '500',
    },
    textArea: {
        height: 120,
        paddingTop: 16,
        textAlignVertical: 'top',
    },
    optionRow: {
        gap: 12,
        paddingRight: Spacing.xl,
    },
    iconOption: {
        width: 54,
        height: 54,
        borderRadius: 16,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorOption: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 3,
    },
});
