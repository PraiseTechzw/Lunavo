/**
 * Escalation Detail View - Full escalation management
 */

import { CategoryBadge } from '@/app/components/category-badge';
import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Escalation, EscalationLevel, Post } from '@/app/types';
import { createInputStyle, createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import {
    getCurrentUser,
    getEscalationById,
    getPost,
    updateEscalation,
} from '@/lib/database';
import { MaterialIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EscalationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [escalation, setEscalation] = useState<Escalation | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [notes, setNotes] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadEscalation();
    }
  }, [id]);

  const loadEscalation = async () => {
    try {
      const escalationData = await getEscalationById(id!);
      if (!escalationData) {
        Alert.alert('Not Found', 'Escalation not found.', [
          { 
            text: 'OK', 
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/counselor/dashboard' as any);
              }
            }
          },
        ]);
        return;
      }

      setEscalation(escalationData);
      setNotes(escalationData.notes || '');

      // Load the associated post
      const postData = await getPost(escalationData.postId);
      setPost(postData);
    } catch (error) {
      console.error('Error loading escalation:', error);
      Alert.alert('Error', 'Failed to load escalation.');
    }
  };

  const handleSaveNotes = async () => {
    if (!escalation) return;

    setLoading(true);
    try {
      await updateEscalation(escalation.id, { notes });
      Alert.alert('Success', 'Notes saved.');
      loadEscalation();
    } catch (error) {
      console.error('Error saving notes:', error);
      Alert.alert('Error', 'Failed to save notes.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToSelf = async () => {
    if (!escalation) return;

    const user = await getCurrentUser();
    if (!user) return;

    setLoading(true);
    try {
      await updateEscalation(escalation.id, {
        assignedTo: user.id,
        status: 'in-progress',
      });
      Alert.alert('Success', 'Escalation assigned to you.');
      loadEscalation();
    } catch (error) {
      console.error('Error assigning escalation:', error);
      Alert.alert('Error', 'Failed to assign escalation.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!escalation || !resolutionNotes.trim()) {
      Alert.alert('Error', 'Please provide resolution notes.');
      return;
    }

    Alert.alert(
      'Mark as Resolved',
      'Are you sure you want to mark this escalation as resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: async () => {
            setLoading(true);
            try {
              await updateEscalation(escalation.id, {
                status: 'resolved',
                resolvedAt: new Date(),
                notes: `${escalation.notes || ''}\n\nResolution: ${resolutionNotes}`.trim(),
              });
              Alert.alert('Success', 'Escalation marked as resolved.', [
                { 
            text: 'OK', 
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/counselor/dashboard' as any);
              }
            }
          },
              ]);
            } catch (error) {
              console.error('Error resolving escalation:', error);
              Alert.alert('Error', 'Failed to resolve escalation.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getEscalationColor = (level: EscalationLevel) => {
    switch (level) {
      case 'critical':
        return '#EF4444';
      case 'high':
        return '#F59E0B';
      case 'medium':
        return '#3B82F6';
      case 'low':
        return '#10B981';
      default:
        return colors.icon;
    }
  };

  const getResponseTime = (): string => {
    if (!escalation) return '';
    if (escalation.status === 'resolved' && escalation.resolvedAt) {
      const timeDiff = new Date(escalation.resolvedAt).getTime() - new Date(escalation.detectedAt).getTime();
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }
    const timeDiff = Date.now() - new Date(escalation.detectedAt).getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (!escalation || !post) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
                <MaterialIcons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <View
                style={[
                  styles.levelBadge,
                  { backgroundColor: getEscalationColor(escalation.escalationLevel) + '20' },
                ]}
              >
                <ThemedText
                  type="body"
                  style={{ color: getEscalationColor(escalation.escalationLevel), fontWeight: '700' }}
                >
                  {escalation.escalationLevel.toUpperCase()}
                </ThemedText>
              </View>
            </View>

            {/* Escalation Info */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Escalation Details
              </ThemedText>
              <View style={styles.infoRow}>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Detected:
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.text }}>
                  {formatDistanceToNow(new Date(escalation.detectedAt), { addSuffix: true })}
                </ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Response Time:
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.text, fontWeight: '600' }}>
                  {getResponseTime()}
                </ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Status:
                </ThemedText>
                <ThemedText
                  type="small"
                  style={{
                    color:
                      escalation.status === 'resolved'
                        ? colors.success
                        : escalation.status === 'in-progress'
                        ? colors.primary
                        : colors.icon,
                    fontWeight: '600',
                  }}
                >
                  {escalation.status === 'resolved'
                    ? 'Resolved'
                    : escalation.status === 'in-progress'
                    ? 'In Progress'
                    : 'Pending'}
                </ThemedText>
              </View>
              <View style={styles.reasonContainer}>
                <ThemedText type="small" style={{ color: colors.icon, marginBottom: Spacing.xs }}>
                  Reason:
                </ThemedText>
                <ThemedText type="body" style={{ color: colors.text }}>
                  {escalation.reason}
                </ThemedText>
              </View>
            </View>

            {/* Post Content */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Post Content
              </ThemedText>
              <CategoryBadge category={post.category} />
              <ThemedText type="h2" style={styles.postTitle}>
                {post.title}
              </ThemedText>
              <ThemedText type="body" style={styles.postContent}>
                {post.content}
              </ThemedText>
              <View style={styles.postMeta}>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  👤 {post.authorPseudonym}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </ThemedText>
              </View>
            </View>

            {/* Notes */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Notes
              </ThemedText>
              <TextInput
                style={[
                  styles.notesInput,
                  createInputStyle(),
                  { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                ]}
                placeholder="Add notes about this escalation..."
                placeholderTextColor={colors.icon}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveNotes}
                disabled={loading}
              >
                <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                  Save Notes
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Resolution Form */}
            {escalation.status !== 'resolved' && (
              <View style={[styles.section, { backgroundColor: colors.card }]}>
                <ThemedText type="h3" style={styles.sectionTitle}>
                  Resolution
                </ThemedText>
                <TextInput
                  style={[
                    styles.notesInput,
                    createInputStyle(),
                    { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder="Describe how this escalation was resolved..."
                  placeholderTextColor={colors.icon}
                  value={resolutionNotes}
                  onChangeText={setResolutionNotes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                {!escalation.assignedTo && (
                  <TouchableOpacity
                    style={[styles.assignButton, { backgroundColor: colors.primary }]}
                    onPress={handleAssignToSelf}
                    disabled={loading}
                  >
                    <MaterialIcons name="person-add" size={20} color="#FFFFFF" />
                    <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: Spacing.xs }}>
                      Assign to Me First
                    </ThemedText>
                  </TouchableOpacity>
                )}
                {escalation.assignedTo && (
                  <TouchableOpacity
                    style={[styles.resolveButton, { backgroundColor: colors.success }]}
                    onPress={handleResolve}
                    disabled={loading || !resolutionNotes.trim()}
                  >
                    <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
                    <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: Spacing.xs }}>
                      Mark as Resolved
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* History Log */}
            {escalation.notes && (
              <View style={[styles.section, { backgroundColor: colors.card }]}>
                <ThemedText type="h3" style={styles.sectionTitle}>
                  History
                </ThemedText>
                <ThemedText type="body" style={styles.historyText}>
                  {escalation.notes}
                </ThemedText>
              </View>
            )}
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  levelBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  section: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    ...createShadow(2, '#000', 0.1),
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  reasonContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  postTitle: {
    fontWeight: '700',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  postContent: {
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  postMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 120,
    marginBottom: Spacing.md,
  },
  saveButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  historyText: {
    lineHeight: 22,
    color: '#666',
  },
});

