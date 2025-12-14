/**
 * Create post screen - Ask for Help
 * Enhanced UI with dynamic categories based on existing topics
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CATEGORIES, CATEGORY_LIST } from '@/constants/categories';
import { checkEscalation } from '@/constants/escalation';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDebounce } from '@/hooks/use-debounce';
import { analyzePost } from '@/lib/ai-utils';
import { createPost as createPostDB, getCurrentUser, getTopicStats } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { PostCategory } from '@/types';
import { containsIdentifyingInfo, generatePseudonym, sanitizeContent } from '@/utils/anonymization';
import { createInputStyle, getCursorStyle } from '@/utils/platform-styles';
import { getPseudonym, savePseudonym } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DRAFT_KEY = 'post_draft';

// Icon mapping for categories
const getCategoryIconName = (category: PostCategory): string => {
  const iconMap: Record<PostCategory, string> = {
    'mental-health': 'medical-outline',
    'crisis': 'warning',
    'substance-abuse': 'medkit',
    'sexual-health': 'heart',
    'stis-hiv': 'heart-circle',
    'family-home': 'home-outline',
    'academic': 'library-outline',
    'social': 'people',
    'relationships': 'heart-circle',
    'campus': 'school',
    'general': 'chatbubbles',
  };
  return iconMap[category] || 'help-circle';
};

export default function CreatePostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
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
        mediaTypes: 'images',
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
        .filter(stat => stat.memberCount > 0 || stat.category === 'general')
        .map(stat => stat.category)
        .sort((a, b) => {
          const statA = stats.find(s => s.category === a);
          const statB = stats.find(s => s.category === b);
          return (statB?.memberCount || 0) - (statA?.memberCount || 0);
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

      // Navigate directly - real-time will show the new post instantly
      // If escalated, show a brief toast/notification but still navigate
      if (escalation.level !== 'none') {
        // Show a brief notification that support was notified
        // The real-time system will handle showing the post
        router.replace(`/topic/${selectedCategory}` as any);
      } else {
        // Navigate to topic page - post will appear instantly via real-time
        router.replace(`/topic/${selectedCategory}` as any);
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
                },
              ]}
              onPress={handlePostButton}
              disabled={!title.trim() || !content.trim() || isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText type="body" style={styles.postButtonText}>
                  Post
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Topic Selection Section */}
            <View style={styles.section}>
              <View style={styles.inputLabelContainer}>
                <Ionicons name="pricetag-outline" size={18} color={colors.icon} style={styles.inputLabelIcon} />
                <ThemedText type="small" style={[styles.inputLabel, { color: colors.icon }]}>
                  SELECT TOPIC
                </ThemedText>
              </View>
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
                    const iconName = getCategoryIconName(categoryId);
                    
                    return (
                      <TouchableOpacity
                        key={categoryId}
                        onPress={() => setSelectedCategory(categoryId)}
                        style={[
                          styles.topicButton,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.surface,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.topicIconContainer,
                          { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'transparent' }
                        ]}>
                          <Ionicons
                            name={iconName as any}
                            size={18}
                            color={isSelected ? '#FFFFFF' : colors.icon}
                          />
                        </View>
                        <ThemedText
                          type="body"
                          style={[
                            styles.topicButtonText,
                            {
                              color: isSelected ? '#FFFFFF' : colors.text,
                              fontWeight: isSelected ? '700' : '600',
                            },
                          ]}
                        >
                          {category.name}
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
              <View style={styles.inputLabelContainer}>
                <Ionicons name="text-outline" size={18} color={colors.icon} style={styles.inputLabelIcon} />
                <ThemedText type="small" style={[styles.inputLabel, { color: colors.icon }]}>
                  Title {title.length > 0 && `(${title.length}/100)`}
                </ThemedText>
              </View>
              <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.titleInput, { color: colors.text }]}
                  placeholder="Give your post a title..."
                  placeholderTextColor={colors.icon}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                />
              </View>
            </View>

            {/* Content Input */}
            <View style={styles.section}>
              <View style={styles.inputLabelContainer}>
                <Ionicons name="document-text-outline" size={18} color={colors.icon} style={styles.inputLabelIcon} />
                <ThemedText type="small" style={[styles.inputLabel, { color: colors.icon }]}>
                  Content {content.length > 0 && `(${content.length} characters)`}
                </ThemedText>
              </View>
              <View style={[styles.inputContainer, styles.textAreaContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  ref={contentInputRef}
                  style={[styles.contentInput, { color: colors.text }]}
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
            <View style={[styles.toolbar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
              <View style={styles.toolbarLeft}>
                <TouchableOpacity
                  style={styles.toolbarButton}
                  onPress={handleBold}
                  activeOpacity={0.7}
                >
                  <ThemedText type="body" style={[styles.toolbarBold, { color: colors.text }]}>
                    B
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.toolbarButton}
                  onPress={handleItalic}
                  activeOpacity={0.7}
                >
                  <ThemedText type="body" style={[styles.toolbarItalic, { color: colors.text }]}>
                    I
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.toolbarButton}
                  onPress={handleLink}
                  activeOpacity={0.7}
                >
                  <Ionicons name="link-outline" size={20} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.toolbarButton}
                  onPress={handleImage}
                  disabled={uploadingImage}
                  activeOpacity={0.7}
                >
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Ionicons name="image-outline" size={20} color={colors.text} />
                  )}
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
                      <ThemedText type="body" style={[styles.reviewPostContent, { color: colors.text }]}>
                        {content}
                      </ThemedText>

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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: 'transparent',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Spacing.sm,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 20,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    minWidth: 80,
    minHeight: 40,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100, // Space for toolbar
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 18,
    marginBottom: Spacing.md,
  },
  topicLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  topicScrollContent: {
    paddingRight: Spacing.lg,
    gap: Spacing.sm,
  },
  topicButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  topicButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingCategories: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
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
  titleInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    paddingVertical: Spacing.md,
    ...createInputStyle(),
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 200,
    width: '100%',
    padding: 0,
    lineHeight: 24,
    ...createInputStyle(),
  },
  anonymousSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  anonymousLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eyeIcon: {
    marginRight: Spacing.md,
  },
  anonymousTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  anonymousSubtitle: {
    fontSize: 12,
  },
  toolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.md,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toolbarButton: {
    padding: Spacing.sm,
    marginRight: Spacing.md,
  },
  toolbarBold: {
    fontWeight: '700',
    fontSize: 18,
  },
  toolbarItalic: {
    fontStyle: 'italic',
    fontSize: 18,
  },
  toolbarSeparator: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: Spacing.sm,
  },
  triggerWarningButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  triggerWarningText: {
    fontWeight: '700',
    fontSize: 12,
  },
  reviewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  reviewContainer: {
    height: '90%',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.lg,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  reviewTitle: {
    fontWeight: '700',
    fontSize: 20,
  },
  reviewCloseButton: {
    padding: Spacing.xs,
  },
  reviewScroll: {
    flex: 1,
  },
  reviewContent: {
    padding: Spacing.lg,
  },
  reviewHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  reviewUserInfo: {
    flex: 1,
  },
  triggerWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  reviewPostTitle: {
    marginBottom: Spacing.md,
    fontWeight: '700',
    fontSize: 20,
  },
  reviewPostContent: {
    lineHeight: 24,
    marginBottom: Spacing.md,
    fontSize: 16,
  },
  reviewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  reviewTag: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  reviewEditButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewPostButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    marginTop: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontWeight: '700',
    fontSize: 20,
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
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 50,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalCancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInsertButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
