/**
 * Create post screen - Ask for Help
 * Enhanced UI with dynamic categories based on existing topics
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { CATEGORIES, CATEGORY_LIST } from '@/app/constants/categories';
import { checkEscalation } from '@/app/constants/escalation';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { useDebounce } from '@/app/hooks/use-debounce';
import { PostCategory } from '@/app/types';
import { containsIdentifyingInfo, generatePseudonym, sanitizeContent } from '@/app/utils/anonymization';
import { createInputStyle, getCursorStyle } from '@/app/utils/platform-styles';
import { getPseudonym, savePseudonym } from '@/app/utils/storage';
import { analyzePost } from '@/lib/ai-utils';
import { createPost as createPostDB, getCurrentUser, getTopicStats } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHeaderHeight } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const DRAFT_KEY = 'post_draft';

// Icon mapping for categories
const getCategoryIcon = (category: PostCategory): string => {
  const iconMap: Record<PostCategory, string> = {
    'mental-health': 'leaf-outline',
    'crisis': 'pulse-outline',
    'substance-abuse': 'fitness-outline',
    'sexual-health': 'heart-circle-outline',
    'stis-hiv': 'shield-outline',
    'family-home': 'home-outline',
    'academic': 'school-outline',
    'social': 'people-circle-outline',
    'relationships': 'infinite-outline',
    'campus': 'business-outline',
    'general': 'chatbubbles-outline',
  };
  return iconMap[category] || 'help-circle-outline';
};

export default function CreatePostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const contentInputRef = useRef<TextInput>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [availableCategories, setAvailableCategories] = useState<PostCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PostCategory>('mental-health');
  const [suggestedCategory, setSuggestedCategory] = useState<PostCategory | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [pseudonym, setPseudonym] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [hasTriggerWarning, setHasTriggerWarning] = useState(false);
  const [categoryConfidence, setCategoryConfidence] = useState(0);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [contentSelection, setContentSelection] = useState({ start: 0, end: 0 });
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const debouncedTitle = useDebounce(title, 500);
  const debouncedContent = useDebounce(content, 500);

  // Helper function to insert text at cursor position
  const insertTextAtCursor = (textToInsert: string) => {
    const { start, end } = contentSelection;
    const newContent = content.substring(0, start) + textToInsert + content.substring(end);
    setContent(newContent);

    // Update cursor position after insertion
    setTimeout(() => {
      const newCursorPos = start + textToInsert.length;
      contentInputRef.current?.setNativeProps({
        selection: { start: newCursorPos, end: newCursorPos },
      });
    }, 0);
  };

  // Helper function to wrap selected text with markdown
  const wrapTextWithMarkdown = (before: string, after: string) => {
    const { start, end } = contentSelection;
    const selectedText = content.substring(start, end);

    if (selectedText) {
      // Wrap selected text
      const newContent =
        content.substring(0, start) +
        before + selectedText + after +
        content.substring(end);
      setContent(newContent);

      // Update cursor position
      setTimeout(() => {
        const newCursorPos = start + before.length + selectedText.length + after.length;
        contentInputRef.current?.setNativeProps({
          selection: { start: newCursorPos, end: newCursorPos },
        });
      }, 0);
    } else {
      // Insert markdown at cursor position
      insertTextAtCursor(before + after);
      // Move cursor between the markdown tags
      setTimeout(() => {
        const newCursorPos = start + before.length;
        contentInputRef.current?.setNativeProps({
          selection: { start: newCursorPos, end: newCursorPos },
        });
      }, 0);
    }
  };

  const handleBold = () => {
    wrapTextWithMarkdown('**', '**');
  };

  const handleItalic = () => {
    wrapTextWithMarkdown('*', '*');
  };

  const handleLink = () => {
    setShowLinkModal(true);
  };

  const handleList = () => {
    wrapTextWithMarkdown('- ', '');
  };

  const handleQuote = () => {
    wrapTextWithMarkdown('> ', '');
  };

  const insertLink = () => {
    if (!linkUrl.trim()) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    const linkMarkdown = `[${linkText.trim() || linkUrl.trim()}](${linkUrl.trim()})`;
    insertTextAtCursor(linkMarkdown);
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  const handleImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photos.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const imageUri = result.assets[0].uri;
      await uploadAndInsertImage(imageUri);
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadAndInsertImage = async (imageUri: string) => {
    setUploadingImage(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to upload images.');
        setUploadingImage(false);
        return;
      }

      // Read the image file
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Generate unique filename with proper extension
      const uriParts = imageUri.split('.');
      const fileExt = uriParts.length > 1 ? uriParts[uriParts.length - 1].toLowerCase() : 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `post-images/${fileName}`;

      // Determine content type
      const contentType = fileExt === 'png' ? 'image/png' :
        fileExt === 'gif' ? 'image/gif' :
          fileExt === 'webp' ? 'image/webp' : 'image/jpeg';

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, blob, {
          contentType: contentType,
          upsert: false,
        });

      if (uploadError) {
        // If bucket doesn't exist, create it or use public URL
        console.error('Upload error:', uploadError);
        Alert.alert('Error', 'Failed to upload image. Please try again.');
        setUploadingImage(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl;
      const imageMarkdown = `![Image](${imageUrl})`;
      insertTextAtCursor(imageMarkdown);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    loadPseudonym();
    loadDraft();
    loadAvailableCategories();
  }, []);

  useEffect(() => {
    // Set category from params if provided
    if (params.category && availableCategories.includes(params.category as PostCategory)) {
      setSelectedCategory(params.category as PostCategory);
    }
  }, [params.category, availableCategories]);

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

  const loadAvailableCategories = async () => {
    try {
      setLoadingCategories(true);
      // Get topic stats to see which categories have posts
      const stats = await getTopicStats();

      // Filter to only categories that have at least 1 post
      // Always include 'general' as a fallback option
      const categoriesWithPosts = stats
        .filter(stat => stat.recentPostCount > 0 || stat.category === 'general')
        .map(stat => stat.category)
        .sort((a, b) => {
          const statA = stats.find(s => s.category === a);
          const statB = stats.find(s => s.category === b);
          return (statB?.recentPostCount || 0) - (statA?.recentPostCount || 0);
        });

      // If no categories have posts yet, show all categories
      if (categoriesWithPosts.length === 0) {
        setAvailableCategories(CATEGORY_LIST.map(c => c.id));
      } else {
        setAvailableCategories(categoriesWithPosts);
      }

      // Set initial selected category
      if (categoriesWithPosts.length > 0 && !params.category) {
        setSelectedCategory(categoriesWithPosts[0]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback to all categories
      setAvailableCategories(CATEGORY_LIST.map(c => c.id));
    } finally {
      setLoadingCategories(false);
    }
  };

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
        if (draft.category && availableCategories.includes(draft.category)) {
          setSelectedCategory(draft.category);
        }
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

      // Update suggested category if confidence is high and category is available
      if (analysis.categorization.confidence > 0.6 && availableCategories.includes(analysis.categorization.category)) {
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

  const handlePostButton = () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Missing Information', 'Please provide both a title and content for your post.');
      return;
    }

    // Dismiss keyboard before showing review
    contentInputRef.current?.blur();
    // Show review/preview screen first
    setShowReview(true);
  };

  const handleSubmitFromReview = async () => {
    if (containsIdentifyingInfo(content)) {
      Alert.alert(
        'Privacy Warning',
        'Your post may contain identifying information. Please review and remove any personal details like email, phone numbers, or student IDs to protect your anonymity.',
        [
          { text: 'Edit', style: 'cancel', onPress: () => setShowReview(false) },
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
              router.push(`/topic/${selectedCategory}` as any);
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
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
      >
        <ThemedView style={styles.container}>
          {/* Header with X, Title, and Post Button */}
          <View style={[styles.header, { backgroundColor: colors.background }]}>
            <TouchableOpacity
              style={[styles.closeButton, getCursorStyle()]}
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="h2" style={[styles.headerTitle, { color: colors.text }]}>
              Create Post
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.postButton,
                {
                  backgroundColor: colors.primary,
                  opacity: (!title.trim() || !content.trim() || isSubmitting) ? 0.5 : 1,
                  shadowColor: colors.primary,
                  shadowOpacity: 0.3,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 4 }
                },
              ]}
              onPress={handlePostButton}
              disabled={!title.trim() || !content.trim() || isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.postButtonContent}>
                  <ThemedText type="body" style={styles.postButtonText}>
                    Continue
                  </ThemedText>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
          >
            {/* Topic Selection Section */}
            <View style={styles.section}>
              <ThemedText type="small" style={[styles.topicLabel, { color: colors.icon }]}>
                SELECT TOPIC
              </ThemedText>
              {loadingCategories ? (
                <View style={styles.loadingCategories}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.topicScrollContent}
                >
                  {availableCategories.map((categoryId) => {
                    const category = CATEGORIES[categoryId];
                    const isSelected = selectedCategory === categoryId;

                    return (
                      <TouchableOpacity
                        key={categoryId}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedCategory(categoryId);
                        }}
                        style={[
                          styles.topicButton,
                          {
                            backgroundColor: isSelected ? colors.primary + '15' : colors.surface,
                            borderColor: isSelected ? colors.primary : colors.border,
                            borderWidth: isSelected ? 2 : 1.5,
                          },
                        ]}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={getCategoryIcon(categoryId) as any}
                          size={16}
                          color={isSelected ? colors.primary : colors.icon}
                        />
                        <ThemedText
                          type="body"
                          style={[
                            styles.topicButtonText,
                            {
                              color: isSelected ? colors.primary : colors.text,
                              fontWeight: isSelected ? '800' : '600',
                            },
                          ]}
                        >
                          {category?.name?.split(' ')[0] || categoryId}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Tag Suggestions */}
            {suggestedTags.length > 0 && (
              <View style={styles.section}>
                <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
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
                        activeOpacity={0.7}
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

            {/* Title Input */}
            <View style={styles.section}>
              <TextInput
                style={[
                  styles.titleInput,
                  createInputStyle(),
                  {
                    backgroundColor: 'transparent',
                    color: colors.text,
                  },
                ]}
                placeholder="Give your post a title..."
                placeholderTextColor={colors.icon}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
              <ThemedText type="small" style={[styles.charCount, { color: title.length > 90 ? colors.danger : colors.icon }]}>
                {title.length}/100
              </ThemedText>
            </View>

            {/* Content Input */}
            <View style={styles.section}>
              <TextInput
                ref={contentInputRef}
                style={[
                  styles.contentInput,
                  createInputStyle(),
                  {
                    backgroundColor: 'transparent',
                    color: colors.text,
                    paddingBottom: 40,
                  },
                ]}
                placeholder="Share what's on your mind. This is a safe space..."
                placeholderTextColor={colors.icon}
                value={content}
                onChangeText={setContent}
                onSelectionChange={(e) => {
                  setContentSelection({
                    start: e.nativeEvent.selection.start,
                    end: e.nativeEvent.selection.end,
                  });
                }}
                multiline
                numberOfLines={10}
                textAlignVertical="top"
              />
              <View style={styles.contentFooter}>
                <ThemedText type="small" style={[styles.charCount, { color: colors.icon }]}>
                  {content.length} characters
                </ThemedText>
              </View>
            </View>

            {/* Post Anonymously Toggle */}
            <View style={styles.anonymousSection}>
              <View style={styles.anonymousLeft}>
                <Ionicons name="eye-off-outline" size={24} color={colors.text} style={styles.eyeIcon} />
                <View>
                  <ThemedText type="body" style={[styles.anonymousTitle, { color: colors.text }]}>
                    Post Anonymously
                  </ThemedText>
                  <ThemedText type="small" style={[styles.anonymousSubtitle, { color: colors.icon }]}>
                    Hide your username
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={colors.border}
              />
            </View>

            {/* Formatting Toolbar */}
            <View style={[
              styles.toolbar,
              {
                backgroundColor: colors.background,
                borderTopColor: colors.border,
                paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, Spacing.md) : Spacing.md,
              }
            ]}>
              <View style={styles.toolbarLeft}>
                <TouchableOpacity
                  style={styles.toolbarButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleBold();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="text" size={20} color={colors.text} />
                  <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.toolbarButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleItalic();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil-outline" size={20} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.toolbarButton}
                  onPress={() => {
                    Haptics.selectionAsync();
                    handleLink();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="link-outline" size={20} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.toolbarButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleList();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="list-outline" size={20} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.toolbarButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleQuote();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chatbox-outline" size={18} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.toolbarButton}
                  onPress={() => {
                    Haptics.selectionAsync();
                    handleImage();
                  }}
                  disabled={uploadingImage}
                  activeOpacity={0.7}
                >
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Ionicons name="image-outline" size={20} color={colors.text} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.toolbarButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    insertTextAtCursor('\n\n--- \n\n');
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove-outline" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
              <View style={styles.toolbarSeparator} />
              <TouchableOpacity
                style={[
                  styles.triggerWarningButton,
                  {
                    backgroundColor: hasTriggerWarning ? '#FF6B35' : 'transparent',
                    borderColor: '#FF6B35',
                  },
                ]}
                onPress={() => setHasTriggerWarning(!hasTriggerWarning)}
                activeOpacity={0.7}
              >
                <Ionicons name="warning-outline" size={16} color={hasTriggerWarning ? '#FFFFFF' : '#FF6B35'} />
                <ThemedText
                  type="small"
                  style={[
                    styles.triggerWarningText,
                    { color: hasTriggerWarning ? '#FFFFFF' : '#FF6B35' },
                  ]}
                >
                  TW
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Review/Preview Modal */}
            {showReview && (
              <View style={styles.reviewOverlay}>
                <View style={[styles.reviewContainer, { backgroundColor: colors.background }]}>
                  <View style={styles.reviewHeader}>
                    <ThemedText type="h2" style={[styles.reviewTitle, { color: colors.text }]}>
                      Review Your Post
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => setShowReview(false)}
                      style={styles.reviewCloseButton}
                    >
                      <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.reviewScroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.reviewContent}>
                      <View style={styles.reviewHeaderInfo}>
                        <View style={[styles.reviewAvatar, { backgroundColor: colors.primary }]}>
                          <ThemedText style={{ color: '#FFFFFF', fontWeight: '700' }}>
                            {pseudonym?.[0]?.toUpperCase() || 'A'}
                          </ThemedText>
                        </View>
                        <View style={styles.reviewUserInfo}>
                          <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }}>
                            {isAnonymous ? pseudonym || 'Anonymous' : 'You'}
                          </ThemedText>
                          <ThemedText type="small" style={{ color: colors.icon }}>
                            {CATEGORIES[selectedCategory].name}
                          </ThemedText>
                        </View>
                      </View>

                      {hasTriggerWarning && (
                        <View style={[styles.triggerWarningBanner, { backgroundColor: '#FF6B3520' }]}>
                          <Ionicons name="warning" size={20} color="#FF6B35" />
                          <ThemedText type="small" style={{ color: '#FF6B35', marginLeft: Spacing.xs }}>
                            This post contains a trigger warning
                          </ThemedText>
                        </View>
                      )}

                      <ThemedText type="h3" style={[styles.reviewPostTitle, { color: colors.text }]}>
                        {title}
                      </ThemedText>
                      <Markdown
                        style={{
                          body: {
                            color: colors.text,
                            fontSize: 17,
                            lineHeight: 26,
                          },
                          link: {
                            color: colors.primary,
                          },
                          image: {
                            borderRadius: 12,
                          },
                        }}
                      >
                        {content}
                      </Markdown>

                      {selectedTags.length > 0 && (
                        <View style={styles.reviewTags}>
                          {selectedTags.map((tag, index) => (
                            <View key={index} style={[styles.reviewTag, { backgroundColor: colors.surface }]}>
                              <ThemedText type="small" style={{ color: colors.primary }}>
                                #{tag}
                              </ThemedText>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </ScrollView>

                  <View style={styles.reviewActions}>
                    <TouchableOpacity
                      style={[styles.reviewEditButton, { borderColor: colors.border }]}
                      onPress={() => setShowReview(false)}
                      activeOpacity={0.7}
                    >
                      <ThemedText type="body" style={{ color: colors.text, fontWeight: '600' }}>
                        Edit
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.reviewPostButton,
                        {
                          backgroundColor: colors.primary,
                          opacity: isSubmitting ? 0.6 : 1,
                        },
                      ]}
                      onPress={handleSubmitFromReview}
                      disabled={isSubmitting}
                      activeOpacity={0.8}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                          Post
                        </ThemedText>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            <ThemedText type="small" style={[styles.disclaimer, { color: colors.icon }]}>
              By posting, you agree that this is a supportive community space. In case of
              emergencies, please contact emergency services immediately.
            </ThemedText>
          </ScrollView>

          {/* Link Insertion Modal */}
          <Modal
            visible={showLinkModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowLinkModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                <View style={styles.modalHeader}>
                  <ThemedText type="h2" style={[styles.modalTitle, { color: colors.text }]}>
                    Insert Link
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => setShowLinkModal(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.modalInputContainer}>
                    <ThemedText type="body" style={[styles.modalLabel, { color: colors.text }]}>
                      Link Text (optional)
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.modalInput,
                        {
                          backgroundColor: colors.surface,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      placeholder="Enter link text"
                      placeholderTextColor={colors.icon}
                      value={linkText}
                      onChangeText={setLinkText}
                    />
                  </View>

                  <View style={styles.modalInputContainer}>
                    <ThemedText type="body" style={[styles.modalLabel, { color: colors.text }]}>
                      URL *
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.modalInput,
                        {
                          backgroundColor: colors.surface,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      placeholder="https://example.com"
                      placeholderTextColor={colors.icon}
                      value={linkUrl}
                      onChangeText={setLinkUrl}
                      keyboardType="url"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[
                      styles.modalCancelButton,
                      { borderColor: colors.border },
                    ]}
                    onPress={() => {
                      setShowLinkModal(false);
                      setLinkUrl('');
                      setLinkText('');
                    }}
                  >
                    <ThemedText type="body" style={{ color: colors.text, fontWeight: '600' }}>
                      Cancel
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalInsertButton,
                      {
                        backgroundColor: colors.primary,
                        opacity: !linkUrl.trim() ? 0.5 : 1,
                      },
                    ]}
                    onPress={insertLink}
                    disabled={!linkUrl.trim()}
                  >
                    <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                      Insert
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    height: 72,
  },
  closeButton: {
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
  postButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.xl,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 120,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontWeight: '800',
    fontSize: 18,
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
  },
  topicLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  topicScrollContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.xl,
  },
  topicButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topicButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 10,
    fontWeight: '700',
    marginTop: -8,
    opacity: 0.6,
  },
  contentFooter: {
    marginTop: -Spacing.lg,
    paddingBottom: Spacing.md,
  },
  postButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingCategories: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
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
    gap: 10,
  },
  tagChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  titleInput: {
    fontSize: 26,
    fontWeight: '900',
    paddingVertical: Spacing.sm,
    minHeight: 60,
    letterSpacing: -0.5,
  },
  contentInput: {
    fontSize: 17,
    paddingVertical: Spacing.sm,
    minHeight: 250,
    lineHeight: 26,
    fontWeight: '400',
  },
  anonymousSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: 20,
    marginBottom: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  anonymousLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  eyeIcon: {
  },
  anonymousTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  anonymousSubtitle: {
    fontSize: 12,
    opacity: 0.6,
  },
  toolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  toolbarButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0,
  },
  toolbarSeparator: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: Spacing.xs,
  },
  triggerWarningButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  triggerWarningText: {
    fontWeight: '900',
    fontSize: 11,
  },
  reviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  reviewContainer: {
    height: '92%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: Spacing.xl,
    paddingBottom: 40,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  reviewTitle: {
    fontWeight: '900',
    fontSize: 24,
    letterSpacing: -0.5,
  },
  reviewCloseButton: {
    padding: Spacing.xs,
  },
  reviewScroll: {
    flex: 1,
  },
  reviewContent: {
    padding: Spacing.xl,
  },
  reviewHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: 12,
  },
  reviewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewUserInfo: {
    flex: 1,
  },
  triggerWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: 16,
    marginBottom: Spacing.xl,
  },
  reviewPostTitle: {
    marginBottom: Spacing.md,
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: -0.3,
  },
  reviewPostContent: {
    lineHeight: 26,
    marginBottom: Spacing.xl,
    fontSize: 17,
  },
  reviewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: Spacing.md,
  },
  reviewTag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  reviewEditButton: {
    flex: 1,
    height: 56,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewPostButton: {
    flex: 2,
    height: 56,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...PlatformStyles.premiumShadow,
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    marginTop: Spacing.lg,
    opacity: 0.5,
    paddingHorizontal: Spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    borderRadius: 24,
    padding: Spacing.xl,
    ...PlatformStyles.premiumShadow,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontWeight: '900',
    fontSize: 22,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  modalInputContainer: {
    marginBottom: Spacing.lg,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInsertButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
