/**
 * Create/Upload Resource Screen
 * Only accessible to: peer-educator-executive, student-affairs, admin
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { CATEGORY_LIST } from '@/app/constants/categories';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { PostCategory } from '@/app/types';
import { createInputStyle, getCursorStyle } from '@/app/utils/platform-styles';
import { getCurrentUser } from '@/lib/auth';
import { createResource } from '@/lib/database';
import { canCreateResources, UserRole } from '@/lib/permissions';
import { supabase } from '@/lib/supabase';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const resourceTypes = [
  { id: 'article', label: 'Article', icon: 'newspaper-outline' },
  { id: 'short-article', label: 'Short Article', icon: 'document-text-outline' },
  { id: 'video', label: 'Video', icon: 'play-circle-outline' },
  { id: 'short-video', label: 'Short Video', icon: 'videocam-outline' },
  { id: 'pdf', label: 'PDF', icon: 'document-text-outline' },
  { id: 'infographic', label: 'Infographic', icon: 'stats-chart-outline' },
  { id: 'image', label: 'Image', icon: 'image-outline' },
  { id: 'link', label: 'Link', icon: 'link-outline' },
  { id: 'training', label: 'Training', icon: 'school-outline' },
];

export default function CreateResourceScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PostCategory>('academic');
  const [selectedResourceType, setSelectedResourceType] = useState<string>('article');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [uploadedImages, setUploadedImages] = useState<Array<{ uri: string; name: string }>>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successAnimation] = useState(new Animated.Value(0));
  const [user, setUser] = useState<any>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);

  // Load user and check permissions
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const currentUser = await getCurrentUser();
        console.log('[CreateResource] Current user:', currentUser);
        
        if (!currentUser) {
          console.log('[CreateResource] No user found, redirecting');
          Alert.alert('Access Denied', 'Please log in to upload resources.', [
            { text: 'OK', onPress: () => router.replace('/(tabs)/resources') }
          ]);
          return;
        }

        console.log('[CreateResource] User role:', currentUser.role);
        const hasPermission = canCreateResources(currentUser.role as UserRole);
        console.log('[CreateResource] Has permission:', hasPermission);

        // Check if user has permission to create resources
        if (!hasPermission) {
          console.log('[CreateResource] Permission denied, redirecting');
          Alert.alert(
            'Access Denied',
            `You don't have permission to upload resources. Required roles: peer-educator-executive, student-affairs, or admin.`,
            [{ text: 'OK', onPress: () => router.replace('/(tabs)/resources') }]
          );
          return;
        }

        console.log('[CreateResource] Permission granted, setting user');
        setUser(currentUser);
      } catch (error) {
        console.error('[CreateResource] Error checking access:', error);
        Alert.alert('Error', 'Failed to verify permissions. Please try again.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/resources') }
        ]);
      } finally {
        setPermissionLoading(false);
      }
    };

    checkAccess();
  }, []);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
        }));
        setUploadedImages([...uploadedImages, ...newImages]);
        
        // Set first image as the main uploaded file for backward compatibility
        if (newImages.length > 0) {
          setUploadedFile({
            uri: newImages[0].uri,
            name: newImages[0].name,
            type: 'image',
          });
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    if (newImages.length > 0) {
      setUploadedFile({
        uri: newImages[0].uri,
        name: newImages[0].name,
        type: 'image',
      });
    } else {
      setUploadedFile(null);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const fileType = file.mimeType || 'application/octet-stream';
        
        setUploadedFile({
          uri: file.uri,
          name: file.name || 'document',
          type: fileType,
        });

        // If it's an image, also set the image preview
        if (fileType.startsWith('image/')) {
          setUploadedImage(file.uri);
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const uploadFile = async (
    fileUri: string,
    fileName: string,
    fileType: string,
    onProgress?: (progress: number) => void
  ): Promise<string | null> => {
    try {
      const fileExt = fileName.split('.').pop();
      const filePath = `resources/${Date.now()}_${fileName}`;

      // Read file as blob
      const response = await fetch(fileUri);
      const blob = await response.blob();

      // Upload to Supabase Storage with progress tracking
      const { data, error } = await supabase.storage
        .from('resources')
        .upload(filePath, blob, {
          contentType: fileType,
          upsert: false,
        });

      if (error) throw error;

      // Simulate progress for better UX (Supabase doesn't provide native progress)
      if (onProgress) {
        onProgress(100);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('resources')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title');
      return;
    }

    if (!selectedResourceType) {
      Alert.alert('Validation Error', 'Please select a resource type');
      return;
    }

    // Validate URL or file based on resource type
    const needsUrl = ['article', 'short-article', 'video', 'short-video', 'link'].includes(selectedResourceType);
    const needsFile = ['pdf', 'infographic', 'image'].includes(selectedResourceType);

    if (needsUrl && !url.trim() && !uploadedFile) {
      Alert.alert('Validation Error', 'Please provide a URL or upload a file');
      return;
    }

    if (needsFile && !uploadedFile && !url.trim()) {
      Alert.alert('Validation Error', 'Please upload a file or provide a URL');
      return;
    }

    try {
      setIsSubmitting(true);
      if (!user) {
        throw new Error('User not authenticated');
      }

      let filePath: string | undefined;
      let thumbnailUrl: string | undefined;

      setUploadProgress(0);
      let filePath: string | undefined;
      let thumbnailUrl: string | undefined;

      // Upload single file if provided (non-image or single image)
      if (uploadedFile && uploadedImages.length === 0) {
        setUploadProgress(10);
        const uploadedUrl = await uploadFile(
          uploadedFile.uri,
          uploadedFile.name,
          uploadedFile.type,
          (progress) => setUploadProgress(10 + (progress * 0.4)) // 10-50%
        );
        if (uploadedUrl) {
          filePath = uploadedUrl;
          if (uploadedFile.type.startsWith('image/')) {
            thumbnailUrl = uploadedUrl;
          }
        }
      }

      // Upload multiple images if provided
      if (uploadedImages.length > 0) {
        setUploadProgress(10);
        const totalImages = uploadedImages.length;
        const uploadedUrls: string[] = [];
        
        for (let i = 0; i < uploadedImages.length; i++) {
          const image = uploadedImages[i];
          const progressStart = 10 + (i / totalImages) * 40;
          const progressEnd = 10 + ((i + 1) / totalImages) * 40;
          
          const uploadedUrl = await uploadFile(
            image.uri,
            image.name,
            'image/jpeg',
            (progress) => setUploadProgress(progressStart + (progress / 100) * (progressEnd - progressStart))
          );
          
          if (uploadedUrl) {
            uploadedUrls.push(uploadedUrl);
            if (i === 0) {
              filePath = uploadedUrl;
              thumbnailUrl = uploadedUrl;
            }
          }
        }
        
        // Store multiple image URLs in tags
        if (uploadedUrls.length > 1) {
          filePath = uploadedUrls[0];
          thumbnailUrl = uploadedUrls[0];
        }
      }

      // Create resource
      // Map new resource types to database types
      const dbResourceType = selectedResourceType === 'short-article' ? 'article' :
                            selectedResourceType === 'short-video' ? 'video' :
                            selectedResourceType === 'infographic' ? 'pdf' :
                            selectedResourceType === 'image' ? 'pdf' :
                            selectedResourceType;

      // Add original resource type to tags for display purposes
      const resourceTags = [...tags];
      if (selectedResourceType !== dbResourceType) {
        resourceTags.push(`type:${selectedResourceType}`);
      }

      setUploadProgress(50);
      const resourceData = {
        title: title.trim(),
        description: description.trim() || undefined,
        category: selectedCategory,
        resourceType: dbResourceType as 'article' | 'video' | 'pdf' | 'link' | 'training',
        url: url.trim() || filePath || undefined,
        filePath: filePath,
        tags: resourceTags,
        createdBy: user.id,
      };

      setUploadProgress(60);
      await createResource(resourceData);
      setUploadProgress(100);

      // Show success animation
      setShowSuccess(true);
      Animated.sequence([
        Animated.timing(successAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(successAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowSuccess(false);
        // Auto-redirect to resources screen
        router.replace('/(tabs)/resources' as any);
      });
    } catch (error: any) {
      console.error('Error creating resource:', error);
      Alert.alert('Error', error.message || 'Failed to create resource. Please try again.');
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking permissions
  if (permissionLoading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText type="body" style={{ color: colors.icon, marginTop: Spacing.md }}>
            Loading...
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  // If no user after loading, they've been redirected
  if (!user) {
    return null;
  }

  // Double-check permission (should not reach here if guard works, but extra safety)
  if (!canCreateResources(user.role as UserRole)) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ThemedView style={styles.loadingContainer}>
          <MaterialIcons name="block" size={48} color={colors.danger} />
          <ThemedText type="h3" style={{ color: colors.text, marginTop: Spacing.md }}>
            Access Denied
          </ThemedText>
          <ThemedText type="body" style={{ color: colors.icon, marginTop: Spacing.sm, textAlign: 'center' }}>
            You do not have permission to create resources.
          </ThemedText>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
              Go Back
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const needsFileUpload = ['pdf', 'infographic', 'image'].includes(selectedResourceType);
  const needsUrl = ['article', 'short-article', 'video', 'short-video', 'link'].includes(selectedResourceType);

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h2" style={styles.headerTitle}>
            Upload Resource
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={100}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <View style={styles.section}>
              <ThemedText type="h3" style={[styles.label, { color: colors.text }]}>
                Title *
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter resource title"
                placeholderTextColor={colors.icon}
                value={title}
                onChangeText={setTitle}
                maxLength={200}
              />
            </View>

            {/* Description */}
            <View style={styles.section}>
              <ThemedText type="h3" style={[styles.label, { color: colors.text }]}>
                Description
              </ThemedText>
              <TextInput
                style={[
                  styles.textArea,
                  { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                ]}
                placeholder="Enter resource description"
                placeholderTextColor={colors.icon}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={1000}
              />
            </View>

            {/* Resource Type */}
            <View style={styles.section}>
              <ThemedText type="h3" style={[styles.label, { color: colors.text }]}>
                Resource Type *
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                {resourceTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: selectedResourceType === type.id ? colors.primary : colors.surface,
                        borderColor: selectedResourceType === type.id ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedResourceType(type.id)}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={20}
                      color={selectedResourceType === type.id ? '#FFFFFF' : colors.icon}
                    />
                    <ThemedText
                      type="small"
                      style={{
                        color: selectedResourceType === type.id ? '#FFFFFF' : colors.text,
                        marginLeft: Spacing.xs,
                        fontWeight: '600',
                      }}
                    >
                      {type.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Category */}
            <View style={styles.section}>
              <ThemedText type="h3" style={[styles.label, { color: colors.text }]}>
                Category *
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {CATEGORY_LIST.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: selectedCategory === cat.id ? colors.primary : colors.surface,
                        borderColor: selectedCategory === cat.id ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <ThemedText
                      type="small"
                      style={{
                        color: selectedCategory === cat.id ? '#FFFFFF' : colors.text,
                        fontWeight: '600',
                      }}
                    >
                      {cat.name}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* URL Input */}
            {needsUrl && (
              <View style={styles.section}>
                <ThemedText type="h3" style={[styles.label, { color: colors.text }]}>
                  URL {needsFileUpload ? '(Optional)' : '*'}
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder="https://example.com/resource"
                  placeholderTextColor={colors.icon}
                  value={url}
                  onChangeText={setUrl}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>
            )}

            {/* File Upload */}
            {needsFileUpload && (
              <View style={styles.section}>
                <ThemedText type="h3" style={[styles.label, { color: colors.text }]}>
                  Upload File {needsUrl ? '(Optional)' : '*'}
                </ThemedText>
                {selectedResourceType === 'image' ? (
                  <>
                    <TouchableOpacity
                      style={[styles.uploadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={handlePickImage}
                    >
                      <View style={styles.uploadButtonContent}>
                        <Ionicons name="image-outline" size={24} color={colors.icon} />
                        <ThemedText type="body" style={{ color: colors.text, marginLeft: Spacing.sm }}>
                          {uploadedImages.length > 0 ? `Add More Images (${uploadedImages.length} selected)` : 'Pick Images'}
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                    {uploadedImages.length > 0 && (
                      <View style={styles.imagesGrid}>
                        {uploadedImages.map((image, index) => (
                          <View key={index} style={styles.imagePreviewContainer}>
                            <ExpoImage
                              source={{ uri: image.uri }}
                              style={styles.imagePreview}
                              contentFit="cover"
                              transition={200}
                            />
                            <TouchableOpacity
                              style={styles.removeImageButton}
                              onPress={() => removeImage(index)}
                            >
                              <Ionicons name="close-circle" size={24} color={colors.danger} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                ) : (
                  <TouchableOpacity
                    style={[styles.uploadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={handlePickDocument}
                  >
                    {uploadedFile ? (
                      <View style={styles.uploadedFileContainer}>
                        <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                        <ThemedText type="body" style={{ color: colors.text, marginLeft: Spacing.sm }} numberOfLines={1}>
                          {uploadedFile.name}
                        </ThemedText>
                      </View>
                    ) : (
                      <View style={styles.uploadButtonContent}>
                        <Ionicons name="document-attach-outline" size={24} color={colors.icon} />
                        <ThemedText type="body" style={{ color: colors.text, marginLeft: Spacing.sm }}>
                          Pick File
                        </ThemedText>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Tags */}
            <View style={styles.section}>
              <ThemedText type="h3" style={[styles.label, { color: colors.text }]}>
                Tags
              </ThemedText>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={[
                    styles.tagInput,
                    { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder="Add a tag"
                  placeholderTextColor={colors.icon}
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={addTag}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={[styles.addTagButton, { backgroundColor: colors.primary }]}
                  onPress={addTag}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              {tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {tags.map((tag, index) => (
                    <View
                      key={index}
                      style={[styles.tag, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                    >
                      <ThemedText type="small" style={{ color: colors.primary }}>
                        {tag}
                      </ThemedText>
                      <TouchableOpacity onPress={() => removeTag(tag)} style={styles.removeTagButton}>
                        <Ionicons name="close-circle" size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
                  <ThemedText type="body" style={{ color: '#FFFFFF', marginLeft: Spacing.sm, fontWeight: '600' }}>
                    Upload Resource
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: Spacing.xxl }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: '700',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
    ...createInputStyle(),
  },
  textArea: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    ...createInputStyle(),
  },
  typeScroll: {
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    marginRight: Spacing.sm,
    ...getCursorStyle(),
  },
  categoryScroll: {
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    marginRight: Spacing.sm,
    ...getCursorStyle(),
  },
  uploadButton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    ...getCursorStyle(),
  },
  uploadButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tagInput: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
    ...createInputStyle(),
  },
  addTagButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...getCursorStyle(),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  removeTagButton: {
    marginLeft: Spacing.xs,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    ...getCursorStyle(),
  },
  backButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    alignItems: 'center',
    ...getCursorStyle(),
  },
});
