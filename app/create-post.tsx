/**
 * Create post screen - allows users to ask for help
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { CategoryBadge } from '@/app/components/category-badge';
import { PostCategory, Post } from '@/app/types';
import { CATEGORIES, CATEGORY_LIST } from '@/app/constants/categories';
import { checkEscalation } from '@/app/constants/escalation';
import { generatePseudonym, sanitizeContent, containsIdentifyingInfo } from '@/app/utils/anonymization';
import { addPost, getPseudonym, savePseudonym, getUser } from '@/app/utils/storage';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { createInputStyle, getContainerStyle, createShadow } from '@/app/utils/platform-styles';
import { analyzePost, categorizePost } from '@/lib/ai-utils';
import { createPost as createPostDB, getCurrentUser } from '@/lib/database';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDebounce } from '@/app/hooks/use-debounce';

const DRAFT_KEY = 'post_draft';

export default function CreatePostScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PostCategory>('mental-health');
  const [suggestedCategory, setSuggestedCategory] = useState<PostCategory | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [pseudonym, setPseudonym] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [categoryConfidence, setCategoryConfidence] = useState(0);

  const debouncedTitle = useDebounce(title, 500);
  const debouncedContent = useDebounce(content, 500);

  useEffect(() => {
    loadPseudonym();
    loadDraft();
  }, []);

  useEffect(() => {
    // Auto-save draft
    saveDraft();
  }, [title, content, selectedCategory, selectedTags]);

  useEffect(() => {
    // Analyze content for category and tag suggestions
    if ((debouncedTitle.trim() || debouncedContent.trim()) && debouncedContent.trim().length > 10) {
      analyzeContent();
    }
  }, [debouncedTitle, debouncedContent]);

  const loadPseudonym = async () => {
    let savedPseudonym = await getPseudonym();
    if (!savedPseudonym) {
      savedPseudonym = generatePseudonym();
      await savePseudonym(savedPseudonym);
    }
    setPseudonym(savedPseudonym);
  };

  const loadDraft = async () => {
    try {
      const draftJson = await AsyncStorage.getItem(DRAFT_KEY);
      if (draftJson) {
        const draft = JSON.parse(draftJson);
        setTitle(draft.title || '');
        setContent(draft.content || '');
        setSelectedCategory(draft.category || 'mental-health');
        setSelectedTags(draft.tags || []);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const saveDraft = async () => {
    try {
      const draft = {
        title,
        content,
        category: selectedCategory,
        tags: selectedTags,
        savedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  };

  const analyzeContent = async () => {
    try {
      if (!title.trim() && !content.trim()) return;

      const analysis = analyzePost(title, content, selectedCategory);
      
      // Update suggested category if confidence is high
      if (analysis.categorization.confidence > 0.6) {
        setSuggestedCategory(analysis.categorization.category);
        setCategoryConfidence(analysis.categorization.confidence);
        
        // Auto-select if confidence is very high
        if (analysis.categorization.confidence > 0.8) {
          setSelectedCategory(analysis.categorization.category);
        }
      }

      // Update suggested tags
      if (analysis.suggestedTags.length > 0) {
        setSuggestedTags(analysis.suggestedTags.slice(0, 5));
      }
    } catch (error) {
      console.error('Error analyzing content:', error);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Missing Information', 'Please provide both a title and content for your post.');
      return;
    }

    if (containsIdentifyingInfo(content)) {
      Alert.alert(
        'Privacy Warning',
        'Your post may contain identifying information. Please review and remove any personal details like email, phone numbers, or student IDs to protect your anonymity.',
        [
          { text: 'Edit', style: 'cancel' },
          { text: 'Post Anyway', onPress: () => submitPost() },
        ]
      );
      return;
    }

    submitPost();
  };

  const submitPost = async () => {
    setIsSubmitting(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to create a post.');
        setIsSubmitting(false);
        return;
      }

      // Check for escalation
      const escalation = checkEscalation(content, selectedCategory);
      const sanitizedContent = sanitizeContent(content);

      // Create post using database function
      await createPostDB({
        authorId: user.id,
        category: selectedCategory,
        title: title.trim(),
        content: sanitizedContent,
        isAnonymous,
        tags: selectedTags,
        escalationLevel: escalation.level,
        escalationReason: escalation.reason,
      });

      // Clear draft after successful post
      await clearDraft();

      if (escalation.level !== 'none') {
        Alert.alert(
          'Support Team Notified',
          'Your post has been flagged for immediate attention. A counselor or support team member will reach out soon. If this is an emergency, please call 10111 or the crisis helpline.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.back();
                router.push('/(tabs)/forum');
              },
            },
          ]
        );
      } else {
        Alert.alert('Post Created', 'Your post has been shared with the community.', [
          {
            text: 'OK',
            onPress: () => {
              router.back();
              router.push('/(tabs)/forum');
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ThemedView style={[styles.container, getContainerStyle()]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText type="h2" style={styles.title}>
            Ask for Help
          </ThemedText>
          <ThemedText type="caption" style={styles.subtitle}>
            Share your concern anonymously. Our community and support team are here to help.
          </ThemedText>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Category
              </ThemedText>
              {suggestedCategory && suggestedCategory !== selectedCategory && (
                <TouchableOpacity
                  style={[styles.suggestionBadge, { backgroundColor: colors.primary + '20' }]}
                  onPress={() => setSelectedCategory(suggestedCategory)}
                >
                  <MaterialIcons name="lightbulb" size={16} color={colors.primary} />
                  <ThemedText type="small" style={{ color: colors.primary, marginLeft: Spacing.xs }}>
                    Suggested: {CATEGORY_LIST.find(c => c.id === suggestedCategory)?.name}
                    {categoryConfidence > 0 && ` (${Math.round(categoryConfidence * 100)}%)`}
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.categoryGrid}>
              {CATEGORY_LIST.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  style={[
                    styles.categoryOption,
                    {
                      backgroundColor:
                        selectedCategory === category.id
                          ? category.color + '20'
                          : colors.surface,
                      borderColor:
                        selectedCategory === category.id ? category.color : colors.border,
                      borderWidth: suggestedCategory === category.id && selectedCategory !== category.id ? 2 : 1,
                    },
                  ]}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <ThemedText
                    type="small"
                    style={[
                      styles.categoryName,
                      {
                        color:
                          selectedCategory === category.id ? category.color : colors.text,
                      },
                    ]}
                  >
                    {category.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tag Suggestions */}
          {suggestedTags.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Suggested Tags
              </ThemedText>
              <View style={styles.tagsContainer}>
                {suggestedTags.map((tag, index) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.tagChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedTags(selectedTags.filter(t => t !== tag));
                        } else {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                    >
                      <ThemedText
                        type="small"
                        style={{
                          color: isSelected ? '#FFFFFF' : colors.text,
                          fontWeight: '600',
                        }}
                      >
                        {tag}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Title
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                createInputStyle(),
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Brief summary of your concern"
              placeholderTextColor={colors.icon}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Your Message
            </ThemedText>
            <TextInput
              style={[
                styles.textArea,
                createInputStyle(),
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Share your thoughts, concerns, or questions. Remember to avoid including personal information."
              placeholderTextColor={colors.icon}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
            <ThemedText type="small" style={styles.hint}>
              Your post will be anonymous. Avoid sharing email, phone numbers, or student IDs.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.checkboxContainer,
                { borderColor: colors.border },
              ]}
              onPress={() => setIsAnonymous(!isAnonymous)}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: isAnonymous ? colors.primary : 'transparent',
                    borderColor: colors.border,
                  },
                ]}
              >
                {isAnonymous && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <ThemedText type="body" style={styles.checkboxLabel}>
                Post anonymously (recommended)
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.previewButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setShowPreview(!showPreview)}
            >
              <MaterialIcons name={showPreview ? 'edit' : 'preview'} size={20} color={colors.text} />
              <ThemedText type="body" style={{ color: colors.text, marginLeft: Spacing.xs, fontWeight: '600' }}>
                {showPreview ? 'Edit' : 'Preview'}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: colors.primary,
                  opacity: isSubmitting ? 0.6 : 1,
                  flex: 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <ThemedText
                type="body"
                style={[styles.submitButtonText, { color: '#FFFFFF' }]}
              >
                {isSubmitting ? 'Posting...' : 'Post Request for Help'}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Preview Mode */}
          {showPreview && (
            <View style={[styles.previewContainer, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <ThemedText type="h3" style={styles.previewTitle}>
                Preview
              </ThemedText>
              <View style={styles.previewHeader}>
                <View style={[styles.previewAvatar, { backgroundColor: colors.primary }]}>
                  <ThemedText style={{ color: '#FFFFFF', fontWeight: '700' }}>
                    {pseudonym?.[0]?.toUpperCase() || 'A'}
                  </ThemedText>
                </View>
                <View style={styles.previewUserInfo}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    {isAnonymous ? pseudonym || 'Anonymous' : 'You'}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: colors.icon }}>
                    {CATEGORY_LIST.find(c => c.id === selectedCategory)?.name}
                  </ThemedText>
                </View>
              </View>
              <ThemedText type="h3" style={styles.previewPostTitle}>
                {title || 'Your post title will appear here'}
              </ThemedText>
              <ThemedText type="body" style={styles.previewContent}>
                {content || 'Your post content will appear here'}
              </ThemedText>
              {selectedTags.length > 0 && (
                <View style={styles.previewTags}>
                  {selectedTags.map((tag, index) => (
                    <View key={index} style={[styles.previewTag, { backgroundColor: colors.surface }]}>
                      <ThemedText type="small" style={{ color: colors.text }}>
                        #{tag}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <ThemedText type="small" style={styles.disclaimer}>
            By posting, you agree that this is a supportive community space. In case of
            emergencies, please contact emergency services immediately.
          </ThemedText>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaTop: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    marginBottom: Spacing.lg,
    opacity: 0.7,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryOption: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    minWidth: 100,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  categoryName: {
    textAlign: 'center',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 150,
  },
  hint: {
    marginTop: Spacing.xs,
    opacity: 0.6,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
  },
  submitButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  submitButtonText: {
    fontWeight: '600',
  },
  disclaimer: {
    textAlign: 'center',
    opacity: 0.6,
    marginTop: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  suggestionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tagChip: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  previewContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  previewTitle: {
    marginBottom: Spacing.md,
    fontWeight: '700',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  previewUserInfo: {
    flex: 1,
  },
  previewPostTitle: {
    marginBottom: Spacing.sm,
    fontWeight: '700',
  },
  previewContent: {
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  previewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  previewTag: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
});


