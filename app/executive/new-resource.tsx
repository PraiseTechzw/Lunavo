import { ThemedText } from '@/app/components/themed-text';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { PostCategory } from '@/app/types';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { createResource, uploadResourceFile } from '@/lib/database';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInRight, FadeOutLeft, Layout } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const RESOURCE_TYPES = [
    { id: 'article', label: 'Article', icon: 'book-open-variant' },
    { id: 'image', label: 'Image', icon: 'image-outline' },
    { id: 'video', label: 'Video', icon: 'video-wireless' },
    { id: 'pdf', label: 'PDF / Doc', icon: 'file-pdf-box' },
    { id: 'link', label: 'External', icon: 'link-variant' },
    { id: 'training', label: 'Training', icon: 'school' },
];

const CATEGORIES: { id: PostCategory; label: string; icon: string; color: string }[] = [
    { id: 'mental-health', label: 'Mental Health Support', icon: 'heart-pulse', color: '#FF6B6B' },
    { id: 'substance-abuse', label: 'Drug & Substance Abuse', icon: 'pill', color: '#FF9F43' },
    { id: 'sexual-health', label: 'Sexual & Reproductive Health (SRH)', icon: 'flower', color: '#FF9FF3' },
    { id: 'stis-hiv', label: 'STIs/HIV & Safe Sex Education', icon: 'ribbon', color: '#54A0FF' },
    { id: 'family-home', label: 'Family & Home Challenges', icon: 'home-heart', color: '#5F27CD' },
    { id: 'academic', label: 'Academic Support & Exam Stress', icon: 'book-open-page-variant', color: '#48DBFB' },
    { id: 'relationships', label: 'Relationship & Social Guidance', icon: 'account-heart', color: '#FF6B6B' },
    { id: 'gallery', label: 'Photo Gallery', icon: 'image-multiple-outline', color: '#EC4899' },
    { id: 'general', label: 'General / Other', icon: 'dots-grid', color: '#576574' },
];

export default function NewResourceScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    // Role Guard
    const { user, loading: authLoading } = useRoleGuard(['peer-educator-executive', 'admin'], '/peer-educator/dashboard');

    const params = useLocalSearchParams<{ category?: string }>();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [form, setForm] = useState({
        title: '',
        description: '',
        category: (params.category as PostCategory) || 'general',
        resourceType: (params.category === 'gallery' ? 'image' : 'article') as any,
        url: '',
        tags: '',
        localUri: null as string | null,
    });

    const handlePickFile = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'We need access to your gallery to upload resources.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images', 'videos'],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0].uri) {
                const asset = result.assets[0] as any;
                const inferredType =
                    asset?.type === 'video' ? 'video' : asset?.type === 'image' ? 'image' : form.resourceType;
                setForm({ ...form, localUri: asset.uri, resourceType: inferredType });
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
        } catch (error) {
            console.error('File pick error:', error);
            Alert.alert('Error', 'Failed to pick file.');
        }
    };

    const nextStep = () => {
        if (step === 1 && !form.title) {
            Alert.alert('Missing Field', 'Please provide a title for the resource.');
            return;
        }
        if (step === 2 && !form.url && !form.localUri) {
            Alert.alert('Missing Source', 'Please provide a URL or upload a file.');
            return;
        }

        Haptics.selectionAsync();
        setStep(step + 1);
    };

    const prevStep = () => {
        Haptics.selectionAsync();
        setStep(step - 1);
    };

    const handleSubmit = async () => {
        if (!user) return;

        try {
            setSubmitting(true);
            let finalUrl = form.url;

            if (form.localUri) {
                setUploading(true);
                finalUrl = await uploadResourceFile(form.localUri, user.id);
                setUploading(false);
            }

            await createResource({
                title: form.title,
                description: form.description,
                category: form.category,
                resourceType: form.resourceType,
                url: finalUrl,
                tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
                createdBy: user.id,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Resource Published', 'Your resource is now live in the library!', [
                { text: 'View Library', onPress: () => router.push('/(tabs)/resources') },
                { text: 'Done', onPress: () => router.back() }
            ]);
        } catch (e) {
            console.error('Failed to create resource:', e);
            Alert.alert('Error', 'Could not post resource. Please check your connection.');
        } finally {
            setSubmitting(false);
            setUploading(false);
        }
    };

    if (authLoading) return <ActivityIndicator style={{ flex: 1 }} />;

    const renderStepIndicators = () => (
        <View style={styles.stepIndicatorContainer}>
            {[1, 2, 3].map((s) => (
                <View
                    key={s}
                    style={[
                        styles.stepDot,
                        { backgroundColor: s <= step ? colors.primary : colors.border },
                        s === step && styles.stepDotActive
                    ]}
                />
            ))}
        </View>
    );

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>New Resource</ThemedText>
                    <View style={{ width: 40 }} />
                </View>

                {renderStepIndicators()}

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {step === 1 && (
                        <Animated.View
                            entering={FadeInRight}
                            exiting={FadeOutLeft}
                            layout={Layout.springify()}
                            style={styles.stepContainer}
                        >
                            <ThemedText style={styles.stepTitle}>Let&apos;s start with basics</ThemedText>
                            <ThemedText style={styles.stepSubtitle}>What are we sharing with the network today?</ThemedText>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.label}>RESOURCE TITLE</ThemedText>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                    placeholder="e.g. Managing Exam Stress"
                                    placeholderTextColor={colors.icon}
                                    value={form.title}
                                    onChangeText={(t) => setForm({ ...form, title: t })}
                                />
                            </View>

                            <ThemedText style={styles.label}>CATEGORY</ThemedText>
                            <View style={styles.categoryGrid}>
                                {CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.categoryCard,
                                            { backgroundColor: colors.surface },
                                            form.category === cat.id && { borderColor: cat.color, borderWidth: 2 }
                                        ]}
                                        onPress={() => {
                                            setForm({ ...form, category: cat.id });
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }}
                                    >
                                        <View style={[styles.catIconCircle, { backgroundColor: cat.color + '20' }]}>
                                            <MaterialCommunityIcons name={cat.icon as any} size={28} color={cat.color} />
                                        </View>
                                        <ThemedText style={[styles.catLabel, form.category === cat.id && { color: cat.color, fontWeight: '800' }]}>
                                            {cat.label}
                                        </ThemedText>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <ThemedText style={styles.label}>RESOURCE TYPE</ThemedText>
                            <View style={styles.typeGrid}>
                                {RESOURCE_TYPES.map((type) => (
                                    <TouchableOpacity
                                        key={type.id}
                                        style={[
                                            styles.typeCardSmall,
                                            { backgroundColor: colors.surface, borderColor: colors.border },
                                            form.resourceType === type.id && { backgroundColor: colors.primary + '10', borderColor: colors.primary, borderWidth: 2 }
                                        ]}
                                        onPress={() => {
                                            setForm({ ...form, resourceType: type.id as any });
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }}
                                    >
                                        <MaterialCommunityIcons
                                            name={type.icon as any}
                                            size={24}
                                            color={form.resourceType === type.id ? colors.primary : colors.icon}
                                        />
                                        <ThemedText style={[styles.typeTabText, form.resourceType === type.id && { color: colors.primary, fontWeight: '800' }]}>
                                            {type.label}
                                        </ThemedText>
                                        {form.resourceType === type.id && (
                                            <View style={[styles.selectedCheck, { backgroundColor: colors.primary }]}>
                                                <MaterialCommunityIcons name="check" size={12} color="#FFF" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Animated.View>
                    )}

                    {step === 2 && (
                        <Animated.View
                            entering={FadeInRight}
                            exiting={FadeOutLeft}
                            style={styles.stepContainer}
                        >
                            <ThemedText style={styles.stepTitle}>Provide the content</ThemedText>
                            <ThemedText style={styles.stepSubtitle}>Link an external resource or upload a file directly.</ThemedText>

                            <View style={styles.sourceChoiceContainer}>
                                <TouchableOpacity
                                    style={[styles.uploadBox, { borderColor: form.localUri ? colors.primary : colors.border }]}
                                    onPress={handlePickFile}
                                >
                                    <MaterialCommunityIcons
                                        name={form.localUri ? "check-circle" : "cloud-upload-outline"}
                                        size={48}
                                        color={form.localUri ? colors.primary : colors.icon}
                                    />
                                    <ThemedText style={styles.uploadText}>
                                        {form.localUri ? "File Selected!" : "Upload from Gallery"}
                                    </ThemedText>
                                    {form.localUri && (
                                        <ThemedText style={styles.fileName} numberOfLines={1}>{form.localUri.split('/').pop()}</ThemedText>
                                    )}
                                </TouchableOpacity>

                                <View style={styles.orDivider}>
                                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                                    <ThemedText style={styles.orText}>OR LINK IT</ThemedText>
                                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                                </View>

                                <View style={styles.inputGroup}>
                                    <ThemedText style={styles.label}>RESOURCE URL</ThemedText>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                        placeholder="https://..."
                                        placeholderTextColor={colors.icon}
                                        value={form.url}
                                        onChangeText={(t) => setForm({ ...form, url: t, localUri: null })}
                                    />
                                </View>
                            </View>
                        </Animated.View>
                    )}

                    {step === 3 && (
                        <Animated.View
                            entering={FadeInRight}
                            exiting={FadeOutLeft}
                            style={styles.stepContainer}
                        >
                            <ThemedText style={styles.stepTitle}>Final Enrichment</ThemedText>
                            <ThemedText style={styles.stepSubtitle}>Add a description and tags to help students find it.</ThemedText>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.label}>DESCRIPTION</ThemedText>
                                <TextInput
                                    style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                    placeholder="Briefly explain what this resource covers..."
                                    placeholderTextColor={colors.icon}
                                    multiline
                                    numberOfLines={4}
                                    value={form.description}
                                    onChangeText={(t) => setForm({ ...form, description: t })}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.label}>TAGS (COMMA SEPARATED)</ThemedText>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                    placeholder="wellness, exam-prep, mentalhealth"
                                    placeholderTextColor={colors.icon}
                                    value={form.tags}
                                    onChangeText={(t) => setForm({ ...form, tags: t })}
                                />
                            </View>

                            <View style={[styles.previewCard, { backgroundColor: colors.surface, borderLeftColor: CATEGORIES.find(c => c.id === form.category)?.color || colors.primary }]}>
                                <ThemedText style={styles.previewTag}>PREVIEW</ThemedText>
                                <ThemedText style={styles.previewTitle}>{form.title || 'Untitled Resource'}</ThemedText>
                                <ThemedText style={styles.previewMeta}>{form.category} • {form.resourceType}</ThemedText>
                            </View>
                        </Animated.View>
                    )}
                </ScrollView>

                <View style={[styles.footer, { borderTopColor: colors.border }]}>
                    {step > 1 && (
                        <TouchableOpacity
                            style={[styles.secondaryButton, { borderColor: colors.border }]}
                            onPress={prevStep}
                            disabled={submitting}
                        >
                            <ThemedText>Back</ThemedText>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.primaryButton,
                            { backgroundColor: colors.primary },
                            step === 1 && { flex: 1 }
                        ]}
                        onPress={step === 3 ? handleSubmit : nextStep}
                        disabled={submitting}
                    >
                        {submitting || uploading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <ThemedText style={styles.buttonText}>
                                {step === 3 ? "Publish Resource" : "Next Step"}
                            </ThemedText>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        height: 60,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    stepIndicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    stepDotActive: {
        width: 24,
    },
    scrollContent: {
        padding: Spacing.lg,
    },
    stepContainer: {
        gap: Spacing.md,
    },
    stepTitle: {
        fontSize: 28,
        fontWeight: '900',
        lineHeight: 34,
    },
    stepSubtitle: {
        fontSize: 16,
        opacity: 0.6,
        marginBottom: Spacing.lg,
    },
    inputGroup: {
        gap: Spacing.xs,
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.2,
        opacity: 0.5,
    },
    input: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        fontSize: 16,
        borderWidth: 1.5,
        ...PlatformStyles.shadow,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    categoryCard: {
        width: (width - Spacing.lg * 2 - Spacing.sm) / 2,
        padding: Spacing.md,
        borderRadius: BorderRadius.xl,
        borderWidth: 1.5,
        borderColor: 'transparent',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    catIconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    catLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    typeCardSmall: {
        width: (width - Spacing.lg * 2 - Spacing.sm * 2) / 3,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xs,
        borderRadius: BorderRadius.lg,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        position: 'relative',
    },
    selectedCheck: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    typeTabText: {
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'center',
    },
    sourceChoiceContainer: {
        gap: Spacing.xl,
    },
    uploadBox: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: BorderRadius.xxl,
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.02)',
        gap: Spacing.sm,
    },
    uploadText: {
        fontSize: 16,
        fontWeight: '700',
    },
    fileName: {
        fontSize: 12,
        opacity: 0.5,
        maxWidth: '80%',
    },
    orDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    orText: {
        fontSize: 12,
        fontWeight: '900',
        opacity: 0.3,
    },
    previewCard: {
        marginTop: Spacing.xl,
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderLeftWidth: 6,
        ...PlatformStyles.shadow,
    },
    previewTag: {
        fontSize: 10,
        fontWeight: '900',
        color: '#FFF',
        backgroundColor: '#000',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 8,
    },
    previewTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    previewMeta: {
        fontSize: 14,
        opacity: 0.6,
        marginTop: 4,
    },
    footer: {
        flexDirection: 'row',
        padding: Spacing.lg,
        borderTopWidth: 1,
        gap: Spacing.md,
    },
    primaryButton: {
        flex: 2,
        height: 56,
        borderRadius: BorderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        ...PlatformStyles.shadow,
    },
    secondaryButton: {
        flex: 1,
        height: 56,
        borderRadius: BorderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    }
});
