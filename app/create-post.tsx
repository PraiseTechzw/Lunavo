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
import { createInputStyle, getContainerStyle } from '@/app/utils/platform-styles';

export default function CreatePostScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PostCategory>('general');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [pseudonym, setPseudonym] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPseudonym();
  }, []);

  const loadPseudonym = async () => {
    let savedPseudonym = await getPseudonym();
    if (!savedPseudonym) {
      savedPseudonym = generatePseudonym();
      await savePseudonym(savedPseudonym);
    }
    setPseudonym(savedPseudonym);
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
      const user = await getUser();
      if (!user && pseudonym) {
        // Create a basic user record
        const newUser = {
          id: `user_${Date.now()}`,
          pseudonym,
          isAnonymous: true,
          role: 'student' as const,
          createdAt: new Date(),
          lastActive: new Date(),
        };
        // In a real app, you'd save this user
      }

      // Check for escalation
      const escalation = checkEscalation(content, selectedCategory);
      const sanitizedContent = sanitizeContent(content);

      const newPost: Post = {
        id: `post_${Date.now()}`,
        authorId: user?.id || `user_${Date.now()}`,
        authorPseudonym: pseudonym || 'Anonymous',
        category: selectedCategory,
        title: title.trim(),
        content: sanitizedContent,
        status: escalation.level !== 'none' ? 'escalated' : 'active',
        escalationLevel: escalation.level,
        escalationReason: escalation.reason,
        isAnonymous,
        tags: [],
        upvotes: 0,
        replies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        reportedCount: 0,
        isFlagged: escalation.level !== 'none',
      };

      await addPost(newPost);

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
            <ThemedText type="h3" style={styles.sectionTitle}>
              Category
            </ThemedText>
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

          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: colors.primary,
                opacity: isSubmitting ? 0.6 : 1,
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
});


