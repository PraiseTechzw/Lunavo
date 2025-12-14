/**
 * Create/Upload Resource Screen
 * Only accessible to: peer-educator-executive, student-affairs, admin
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CATEGORY_LIST } from '@/constants/categories';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCurrentUser, getSession } from '@/lib/auth';
import { createResource } from '@/lib/database';
import { canCreateResources, UserRole } from '@/lib/permissions';
import { supabase } from '@/lib/supabase';
import { PostCategory } from '@/types';
import { createInputStyle, getCursorStyle } from '@/utils/platform-styles';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
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
        mediaTypes: 'images',
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

  const handlePickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'videos',
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: 3600, // 1 hour max
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const video = result.assets[0];
        setUploadedFile({
          uri: video.uri,
          name: video.fileName || `video_${Date.now()}.mp4`,
          type: 'video/mp4',
        });
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
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
      // Check if user has a valid session
      const session = await getSession();
      if (!session) {
        throw new Error('You must be logged in to upload files. Please sign in and try again.');
      }

      // Validate file URI
      if (!fileUri || (!fileUri.startsWith('file://') && !fileUri.startsWith('http') && !fileUri.startsWith('content://'))) {
        throw new Error('Invalid file URI. Please select the file again.');
      }

      const filePath = `resources/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

      // Read file with better error handling
      if (onProgress) {
        onProgress(10);
      }

      let fileData: Blob | ArrayBuffer;
      
      try {
        if (Platform.OS === 'web') {
          // On web, use fetch which works well
          const response = await fetch(fileUri);
          if (!response.ok) {
            throw new Error(`Failed to read file: ${response.status} ${response.statusText}`);
          }
          fileData = await response.blob();
        } else {
          // On React Native, use XMLHttpRequest which handles file:// URIs better
          fileData = await new Promise<ArrayBuffer>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = () => {
              if (xhr.status === 200 || xhr.status === 0) {
                // Convert blob response to ArrayBuffer for Supabase
                const reader = new FileReader();
                reader.onloadend = () => {
                  resolve(reader.result as ArrayBuffer);
                };
                reader.onerror = () => reject(new Error('Failed to convert file to ArrayBuffer'));
                reader.readAsArrayBuffer(xhr.response);
              } else {
                reject(new Error(`Failed to read file: HTTP ${xhr.status}`));
              }
            };
            xhr.onerror = () => reject(new Error('Network error reading file. Please check your connection.'));
            xhr.ontimeout = () => reject(new Error('File read timeout. The file may be too large.'));
            xhr.timeout = 60000; // 60 second timeout
            xhr.open('GET', fileUri);
            xhr.responseType = 'blob';
            xhr.send();
          });
        }
      } catch (readError: any) {
        console.error('Error reading file:', readError);
        throw new Error(`Failed to read the selected file: ${readError.message || 'Please try selecting it again.'}`);
      }

      if (onProgress) {
        onProgress(30);
      }

      // Get file size
      const fileSize = fileData instanceof Blob ? fileData.size : fileData.byteLength;
      
      // Check file size (limit to 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (fileSize > maxSize) {
        throw new Error(`File size (${(fileSize / 1024 / 1024).toFixed(2)}MB) exceeds the maximum allowed size of 50MB.`);
      }

      if (onProgress) {
        onProgress(50);
      }

      // Upload to Supabase Storage with progress tracking
      // Use ArrayBuffer for React Native, Blob for web
      const { data, error } = await supabase.storage
        .from('resources')
        .upload(filePath, fileData, {
          contentType: fileType || 'application/octet-stream',
          upsert: false,
        });

      if (error) {
        console.error('Supabase storage error:', error);
        
        // Provide more helpful error messages
        if (error.message?.includes('bucket') || error.message?.includes('not found')) {
          throw new Error('Storage bucket not found. Please contact support.');
        } else if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
          throw new Error('Permission denied. Please ensure you are logged in and have the required permissions.');
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        } else {
          throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
        }
      }

      if (onProgress) {
        onProgress(90);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('resources')
        .getPublicUrl(filePath);

      if (onProgress) {
        onProgress(100);
      }

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      
      // Re-throw with improved error message
      if (error.message) {
        throw error;
      } else {
        throw new Error('Failed to upload file. Please try again.');
      }
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
    const needsUrl = ['article', 'short-article', 'link'].includes(selectedResourceType);
    const needsFile = ['pdf', 'infographic', 'image', 'video', 'short-video'].includes(selectedResourceType);

    const hasFile = uploadedFile || uploadedImages.length > 0;

    if (needsUrl && !url.trim() && !hasFile) {
      Alert.alert('Validation Error', 'Please provide a URL or upload a file');
      return;
    }

    if (needsFile && !hasFile && !url.trim()) {
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

      // Upload single file if provided (non-image or single image)
      if (uploadedFile && uploadedImages.length === 0) {
        try {
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
        } catch (uploadError: any) {
          throw new Error(`Failed to upload file: ${uploadError.message || 'Unknown error'}`);
        }
      }

      // Upload multiple images if provided
      if (uploadedImages.length > 0) {
        try {
          setUploadProgress(10);
          const totalImages = uploadedImages.length;
          const uploadedUrls: string[] = [];
          
          for (let i = 0; i < uploadedImages.length; i++) {
            const image = uploadedImages[i];
            const progressStart = 10 + (i / totalImages) * 40;
            const progressEnd = 10 + ((i + 1) / totalImages) * 40;
            
            try {
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
            } catch (imageError: any) {
              throw new Error(`Failed to upload image ${i + 1} of ${totalImages}: ${imageError.message || 'Unknown error'}`);
            }
          }
          
          // Store multiple image URLs in tags
          if (uploadedUrls.length > 1) {
            filePath = uploadedUrls[0];
            thumbnailUrl = uploadedUrls[0];
          }
        } catch (uploadError: any) {
          throw new Error(`Failed to upload images: ${uploadError.message || 'Unknown error'}`);
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
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to create resource. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.message?.includes('network') || error.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
        errorMessage = 'Permission denied. Please ensure you are logged in and have permission to create resources.';
      }
      
      Alert.alert(
        'Upload Failed',
        errorMessage,
        [
          {
            text: 'OK',
            style: 'default',
          },
        ]
      );
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

  const needsFileUpload = ['pdf', 'infographic', 'image', 'video', 'short-video'].includes(selectedResourceType);
  const needsUrl = ['article', 'short-article', 'link'].includes(selectedResourceType);

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Enhanced Header */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.backButton, { backgroundColor: colors.surface }, getCursorStyle()]}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <ThemedText type="h2" style={styles.headerTitle}>
              Upload Resource
            </ThemedText>
            <ThemedText type="caption" style={[styles.headerSubtitle, { color: colors.icon }]}>
              Share valuable resources with the community
            </ThemedText>
          </View>
          <View style={{ width: 40 }} />
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
              <View style={styles.labelContainer}>
                <ThemedText type="h3" style={[styles.label, { color: colors.text }]}>
                  Title
                </ThemedText>
                <ThemedText type="small" style={[styles.required, { color: colors.danger }]}>
                  *
                </ThemedText>
              </View>
              <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="text-outline" size={20} color={colors.icon} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter resource title"
                  placeholderTextColor={colors.icon}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={200}
                />
                {title.length > 0 && (
                  <ThemedText type="small" style={[styles.charCount, { color: colors.icon }]}>
                    {title.length}/200
                  </ThemedText>
                )}
              </View>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <View style={styles.labelContainer}>
                <ThemedText type="h3" style={[styles.label, { color: colors.text }]}>
                  Description
                </ThemedText>
                <ThemedText type="small" style={[styles.optional, { color: colors.icon }]}>
                  Optional
                </ThemedText>
              </View>
              <View style={[styles.inputContainer, styles.textAreaContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textArea, { color: colors.text }]}
                  placeholder="Provide a brief description of the resource..."
                  placeholderTextColor={colors.icon}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  maxLength={1000}
                  textAlignVertical="top"
                />
                {description.length > 0 && (
                  <View style={styles.charCountContainer}>
                    <ThemedText type="small" style={[styles.charCount, { color: colors.icon }]}>
                      {description.length}/1000
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>

            {/* Resource Type */}
            <View style={styles.section}>
              <View style={styles.labelContainer}>
                <ThemedText type="h3" style={[styles.label, { color: colors.text }]}>
                  Resource Type
                </ThemedText>
                <ThemedText type="small" style={[styles.required, { color: colors.danger }]}>
                  *
                </ThemedText>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.typeScroll}
                contentContainerStyle={styles.typeScrollContent}
              >
                {resourceTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: selectedResourceType === type.id ? colors.primary : colors.surface,
                        borderColor: selectedResourceType === type.id ? colors.primary : colors.border,
                        ...(selectedResourceType === type.id ? PlatformStyles.shadow : {}),
                      },
                    ]}
                    onPress={() => setSelectedResourceType(type.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.typeIconContainer,
                      { backgroundColor: selectedResourceType === type.id ? 'rgba(255,255,255,0.2)' : 'transparent' }
                    ]}>
                      <Ionicons
                        name={type.icon as any}
                        size={22}
                        color={selectedResourceType === type.id ? '#FFFFFF' : colors.icon}
                      />
                    </View>
                    <ThemedText
                      type="small"
                      style={{
                        color: selectedResourceType === type.id ? '#FFFFFF' : colors.text,
                        marginLeft: Spacing.sm,
                        fontWeight: selectedResourceType === type.id ? '700' : '600',
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
              <View style={styles.labelContainer}>
                <ThemedText type="h3" style={[styles.label, { color: colors.text }]}>
                  Category
                </ThemedText>
                <ThemedText type="small" style={[styles.required, { color: colors.danger }]}>
                  *
                </ThemedText>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryScrollContent}
              >
                {CATEGORY_LIST.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: selectedCategory === cat.id ? colors.primary : colors.surface,
                        borderColor: selectedCategory === cat.id ? colors.primary : colors.border,
                        ...(selectedCategory === cat.id ? PlatformStyles.shadow : {}),
                      },
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                    activeOpacity={0.7}
                  >
                    <ThemedText
                      type="small"
                      style={{
                        color: selectedCategory === cat.id ? '#FFFFFF' : colors.text,
                        fontWeight: selectedCategory === cat.id ? '700' : '600',
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
                <View style={styles.labelContainer}>
                  <ThemedText type="h3" style={[styles.label, { color: colors.text }]}>
                    URL
                  </ThemedText>
                  {needsFileUpload ? (
                    <ThemedText type="small" style={[styles.optional, { color: colors.icon }]}>
                      Optional
                    </ThemedText>
                  ) : (
                    <ThemedText type="small" style={[styles.required, { color: colors.danger }]}>
                      *
                    </ThemedText>
                  )}
                </View>
                <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="link-outline" size={20} color={colors.icon} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="https://example.com/resource"
                    placeholderTextColor={colors.icon}
                    value={url}
                    onChangeText={setUrl}
                    keyboardType="url"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            )}

            {/* File Upload */}
            {needsFileUpload && (
              <View style={styles.section}>
                <View style={styles.labelContainer}>
                  <ThemedText type="h3" style={[styles.label, { color: colors.text }]}>
                    Upload File
                  </ThemedText>
                  {needsUrl ? (
                    <ThemedText type="small" style={[styles.optional, { color: colors.icon }]}>
                      Optional
                    </ThemedText>
                  ) : (
                    <ThemedText type="small" style={[styles.required, { color: colors.danger }]}>
                      *
                    </ThemedText>
                  )}
                </View>
                {selectedResourceType === 'image' ? (
                  <>
                    <TouchableOpacity
                      style={[styles.uploadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={handlePickImage}
                      activeOpacity={0.7}
                    >
                      <View style={styles.uploadButtonContent}>
                        <View style={[styles.uploadIconContainer, { backgroundColor: colors.primary + '15' }]}>
                          <Ionicons name="image-outline" size={28} color={colors.primary} />
                        </View>
                        <View style={styles.uploadTextContainer}>
                          <ThemedText type="body" style={{ color: colors.text, fontWeight: '600' }}>
                            {uploadedImages.length > 0 ? `Add More Images` : 'Pick Images'}
                          </ThemedText>
                          {uploadedImages.length > 0 && (
                            <ThemedText type="small" style={{ color: colors.icon, marginTop: 2 }}>
                              {uploadedImages.length} {uploadedImages.length === 1 ? 'image' : 'images'} selected
                            </ThemedText>
                          )}
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.icon} />
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
                ) : selectedResourceType === 'video' || selectedResourceType === 'short-video' ? (
                  <TouchableOpacity
                    style={[styles.uploadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={handlePickVideo}
                    activeOpacity={0.7}
                  >
                    {uploadedFile ? (
                      <View style={styles.uploadedFileContainer}>
                        <View style={[styles.uploadIconContainer, { backgroundColor: colors.success + '15' }]}>
                          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                        </View>
                        <View style={styles.uploadedFileInfo}>
                          <ThemedText type="body" style={{ color: colors.text, fontWeight: '600' }} numberOfLines={1}>
                            {uploadedFile.name}
                          </ThemedText>
                          <ThemedText type="small" style={{ color: colors.icon, marginTop: 2 }}>
                            Video file selected
                          </ThemedText>
                        </View>
                        <TouchableOpacity
                          onPress={() => setUploadedFile(null)}
                          style={styles.removeFileButton}
                        >
                          <Ionicons name="close-circle" size={24} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.uploadButtonContent}>
                        <View style={[styles.uploadIconContainer, { backgroundColor: colors.primary + '15' }]}>
                          <Ionicons name="videocam-outline" size={28} color={colors.primary} />
                        </View>
                        <View style={styles.uploadTextContainer}>
                          <ThemedText type="body" style={{ color: colors.text, fontWeight: '600' }}>
                            Pick Video from Gallery
                          </ThemedText>
                          <ThemedText type="small" style={{ color: colors.icon, marginTop: 2 }}>
                            Select a video file
                          </ThemedText>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                      </View>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.uploadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={handlePickDocument}
                    activeOpacity={0.7}
                  >
                    {uploadedFile ? (
                      <View style={styles.uploadedFileContainer}>
                        <View style={[styles.uploadIconContainer, { backgroundColor: colors.success + '15' }]}>
                          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                        </View>
                        <View style={styles.uploadedFileInfo}>
                          <ThemedText type="body" style={{ color: colors.text, fontWeight: '600' }} numberOfLines={1}>
                            {uploadedFile.name}
                          </ThemedText>
                          <ThemedText type="small" style={{ color: colors.icon, marginTop: 2 }}>
                            Document file selected
                          </ThemedText>
                        </View>
                        <TouchableOpacity
                          onPress={() => setUploadedFile(null)}
                          style={styles.removeFileButton}
                        >
                          <Ionicons name="close-circle" size={24} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.uploadButtonContent}>
                        <View style={[styles.uploadIconContainer, { backgroundColor: colors.primary + '15' }]}>
                          <Ionicons name="document-attach-outline" size={28} color={colors.primary} />
                        </View>
                        <View style={styles.uploadTextContainer}>
                          <ThemedText type="body" style={{ color: colors.text, fontWeight: '600' }}>
                            Pick File
                          </ThemedText>
                          <ThemedText type="small" style={{ color: colors.icon, marginTop: 2 }}>
                            PDF, Word, or other documents
                          </ThemedText>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Tags */}
            <View style={styles.section}>
              <View style={styles.labelContainer}>
                <ThemedText type="h3" style={[styles.label, { color: colors.text }]}>
                  Tags
                </ThemedText>
                <ThemedText type="small" style={[styles.optional, { color: colors.icon }]}>
                  Optional
                </ThemedText>
              </View>
              <View style={styles.tagInputContainer}>
                <View style={[styles.tagInputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="pricetag-outline" size={18} color={colors.icon} style={styles.tagInputIcon} />
                  <TextInput
                    style={[styles.tagInput, { color: colors.text }]}
                    placeholder="Add a tag and press enter"
                    placeholderTextColor={colors.icon}
                    value={tagInput}
                    onChangeText={setTagInput}
                    onSubmitEditing={addTag}
                    returnKeyType="done"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.addTagButton, { backgroundColor: colors.primary }]}
                  onPress={addTag}
                  activeOpacity={0.7}
                  disabled={!tagInput.trim()}
                >
                  <Ionicons name="add" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              {tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {tags.map((tag, index) => (
                    <View
                      key={index}
                      style={[styles.tag, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}
                    >
                      <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600' }}>
                        {tag}
                      </ThemedText>
                      <TouchableOpacity onPress={() => removeTag(tag)} style={styles.removeTagButton}>
                        <Ionicons name="close" size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Upload Progress */}
            {isSubmitting && uploadProgress > 0 && (
              <View style={[styles.progressContainer, { backgroundColor: colors.surface }]}>
                <View style={styles.progressHeader}>
                  <View style={styles.progressIconContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                  <View style={styles.progressInfo}>
                    <ThemedText type="body" style={{ color: colors.text, fontWeight: '600' }}>
                      Uploading Resource
                    </ThemedText>
                    <ThemedText type="small" style={{ color: colors.icon, marginTop: 2 }}>
                      {Math.round(uploadProgress)}% complete
                    </ThemedText>
                  </View>
                </View>
                <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${uploadProgress}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton, 
                { 
                  backgroundColor: colors.primary,
                  opacity: isSubmitting ? 0.6 : 1,
                  ...PlatformStyles.shadow,
                }
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <ThemedText type="body" style={{ color: '#FFFFFF', marginLeft: Spacing.sm, fontWeight: '700' }}>
                    Uploading...
                  </ThemedText>
                </>
              ) : (
                <>
                  <View style={styles.submitIconContainer}>
                    <Ionicons name="cloud-upload-outline" size={22} color="#FFFFFF" />
                  </View>
                  <ThemedText type="body" style={{ color: '#FFFFFF', marginLeft: Spacing.sm, fontWeight: '700', fontSize: 16 }}>
                    Upload Resource
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: Spacing.xxl }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>

      {/* Success Animation Modal */}
      <Modal
        visible={showSuccess}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={[styles.successModalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
          <Animated.View
            style={[
              styles.successModalContent,
              {
                backgroundColor: colors.card,
                opacity: successAnimation,
                transform: [
                  {
                    scale: successAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={[styles.successIconContainer, { backgroundColor: colors.success + '20' }]}>
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: successAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                }}
              >
                <Ionicons name="checkmark-circle" size={80} color={colors.success} />
              </Animated.View>
            </View>
            <ThemedText type="h2" style={{ color: colors.text, marginTop: Spacing.lg, fontWeight: '700' }}>
              Success!
            </ThemedText>
            <ThemedText type="body" style={{ color: colors.icon, marginTop: Spacing.sm, textAlign: 'center' }}>
              Resource uploaded successfully
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs, textAlign: 'center' }}>
              Redirecting to resources...
            </ThemedText>
          </Animated.View>
        </View>
      </Modal>
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
    paddingBottom: Spacing.md,
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
    fontSize: 12,
    marginTop: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
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
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
  },
  required: {
    fontWeight: '600',
    fontSize: 14,
  },
  optional: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.md,
    ...createInputStyle(),
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    minHeight: 120,
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    minHeight: 100,
    width: '100%',
    padding: 0,
    ...createInputStyle(),
  },
  charCountContainer: {
    alignSelf: 'flex-end',
    marginTop: Spacing.xs,
  },
  charCount: {
    fontSize: 11,
  },
  typeScroll: {
    marginHorizontal: -Spacing.md,
  },
  typeScrollContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    marginRight: Spacing.sm,
    minHeight: 48,
    ...getCursorStyle(),
  },
  typeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryScroll: {
    marginHorizontal: -Spacing.md,
  },
  categoryScrollContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    marginRight: Spacing.sm,
    minHeight: 40,
    ...getCursorStyle(),
  },
  uploadButton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    ...getCursorStyle(),
  },
  uploadButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploadIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  uploadTextContainer: {
    flex: 1,
  },
  uploadedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  uploadedFileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  removeFileButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tagInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  tagInputIcon: {
    marginRight: Spacing.sm,
  },
  tagInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.md,
    ...createInputStyle(),
  },
  addTagButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    gap: Spacing.sm,
  },
  removeTagButton: {
    padding: 2,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    minHeight: 56,
    ...getCursorStyle(),
  },
  submitIconContainer: {
    marginRight: 2,
  },
  progressContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressIconContainer: {
    marginRight: Spacing.md,
  },
  progressInfo: {
    flex: 1,
  },
  progressBarBackground: {
    height: 6,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  imagePreviewContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    ...PlatformStyles.shadow,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.full,
    padding: 2,
    ...PlatformStyles.shadow,
  },
  successModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: 'center',
    minWidth: 280,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
