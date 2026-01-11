/**
 * Announcements Management - Create, edit, delete announcements
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Announcement } from '@/app/types';
import { createInputStyle, createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  updateAnnouncement
} from '@/lib/database';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AnnouncementsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { user, loading: authLoading } = useRoleGuard(
    ['peer-educator-executive', 'admin'],
    '/peer-educator/dashboard'
  );

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null);

  // Enhanced Fields
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'critical'>('normal');
  const [type, setType] = useState<'general' | 'alert' | 'event' | 'spotlight'>('general');
  const [imageUrl, setImageUrl] = useState('');
  const [actionLink, setActionLink] = useState('');
  const [actionLabel, setActionLabel] = useState('');

  useEffect(() => {
    if (user) {
      loadAnnouncements();
    }
  }, [user]);

  const loadAnnouncements = async () => {
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const handleCreate = () => {
    setEditingAnnouncement(null);
    setTitle('');
    setContent('');
    setIsPublished(false);
    setScheduledFor(null);
    setPriority('normal');
    setType('general');
    setImageUrl('');
    setActionLink('');
    setActionLabel('');
    setShowCreateModal(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setTitle(announcement.title);
    setContent(announcement.content);
    setIsPublished(announcement.isPublished);
    setScheduledFor(announcement.scheduledFor || null);
    setPriority(announcement.priority);
    setType(announcement.type);
    setImageUrl(announcement.imageUrl || '');
    setActionLink(announcement.actionLink || '');
    setActionLabel(announcement.actionLabel || '');
    setShowCreateModal(true);
  };

  const handleDelete = (announcement: Announcement) => {
    Alert.alert(
      'Delete Announcement',
      `Are you sure you want to delete "${announcement.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAnnouncement(announcement.id);
              Alert.alert('Success', 'Announcement deleted.');
              loadAnnouncements();
            } catch (error) {
              console.error('Error deleting announcement:', error);
              Alert.alert('Error', 'Failed to delete announcement.');
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (!user) return;

    try {
      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement.id, {
          title,
          content,
          isPublished,
          scheduledFor: scheduledFor || undefined,
          priority,
          type,
          imageUrl: imageUrl.trim() || undefined,
          actionLink: actionLink.trim() || undefined,
          actionLabel: actionLabel.trim() || undefined,
        });
        Alert.alert('Success', 'Announcement updated.');
      } else {
        await createAnnouncement({
          title,
          content,
          createdBy: user.id,
          scheduledFor: scheduledFor || undefined,
          isPublished,
          priority,
          type,
          imageUrl: imageUrl.trim() || undefined,
          actionLink: actionLink.trim() || undefined,
          actionLabel: actionLabel.trim() || undefined,
        });
        Alert.alert('Success', 'Announcement created.');
      }

      loadAnnouncements();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error saving announcement:', error);
      Alert.alert('Error', 'Failed to save announcement.');
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const publishedAnnouncements = announcements.filter((a) => a.isPublished);
  const draftAnnouncements = announcements.filter((a) => !a.isPublished);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="h2" style={styles.headerTitle}>
              Announcements
            </ThemedText>
            <TouchableOpacity onPress={handleCreate} style={getCursorStyle()}>
              <MaterialIcons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Published Announcements */}
          {publishedAnnouncements.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Published ({publishedAnnouncements.length})
              </ThemedText>
              {publishedAnnouncements.map((announcement) => (
                <View
                  key={announcement.id}
                  style={[styles.announcementCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}
                >
                  <View style={styles.announcementHeader}>
                    <View style={styles.announcementInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }}>
                          {announcement.title}
                        </ThemedText>
                        <View style={{
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                          backgroundColor: announcement.priority === 'critical' ? colors.danger :
                            announcement.priority === 'high' ? colors.warning :
                              colors.primary + '20'
                        }}>
                          <ThemedText style={{ fontSize: 10, fontWeight: '700', color: announcement.priority === 'critical' ? '#FFF' : colors.text }}>
                            {announcement.priority.toUpperCase()}
                          </ThemedText>
                        </View>
                        <View style={{
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                          backgroundColor: colors.surface,
                          borderWidth: 1,
                          borderColor: colors.border
                        }}>
                          <ThemedText style={{ fontSize: 10, color: colors.text }}>
                            {announcement.type.toUpperCase()}
                          </ThemedText>
                        </View>
                      </View>
                      <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                        {format(announcement.createdAt, 'MMM dd, yyyy • HH:mm')}
                      </ThemedText>
                    </View>
                    <View style={styles.announcementActions}>
                      <TouchableOpacity
                        onPress={() => handleEdit(announcement)}
                        style={getCursorStyle()}
                      >
                        <MaterialIcons name="edit" size={20} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(announcement)}
                        style={[getCursorStyle(), { marginLeft: Spacing.md }]}
                      >
                        <MaterialIcons name="delete" size={20} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <ThemedText type="body" style={{ color: colors.text, marginTop: Spacing.sm }} numberOfLines={3}>
                    {announcement.content}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}

          {/* Draft Announcements */}
          {draftAnnouncements.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Drafts ({draftAnnouncements.length})
              </ThemedText>
              {draftAnnouncements.map((announcement) => (
                <View
                  key={announcement.id}
                  style={[styles.announcementCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}
                >
                  <View style={styles.announcementHeader}>
                    <View style={styles.announcementInfo}>
                      <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }}>
                        {announcement.title}
                      </ThemedText>
                      <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                        {format(announcement.createdAt, 'MMM dd, yyyy • HH:mm')}
                      </ThemedText>
                    </View>
                    <View style={styles.announcementActions}>
                      <TouchableOpacity
                        onPress={() => handleEdit(announcement)}
                        style={getCursorStyle()}
                      >
                        <MaterialIcons name="edit" size={20} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(announcement)}
                        style={[getCursorStyle(), { marginLeft: Spacing.md }]}
                      >
                        <MaterialIcons name="delete" size={20} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <ThemedText type="body" style={{ color: colors.text, marginTop: Spacing.sm }} numberOfLines={3}>
                    {announcement.content}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}

          {announcements.length === 0 && (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="campaign" size={64} color={colors.icon} />
              <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
                No announcements yet. Create one to get started!
              </ThemedText>
            </View>
          )}
        </ScrollView>

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <ThemedText type="h2" style={styles.modalTitle}>
                  {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
                </ThemedText>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <MaterialIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <TextInput
                  style={[
                    styles.input,
                    createInputStyle(),
                    { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder="Title"
                  placeholderTextColor={colors.icon}
                  value={title}
                  onChangeText={setTitle}
                />

                <TextInput
                  style={[
                    styles.input,
                    createInputStyle(),
                    { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                    styles.textArea,
                  ]}
                  placeholder="Content"
                  placeholderTextColor={colors.icon}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                />

                <ThemedText type="body" style={{ marginBottom: 8, fontWeight: '600' }}>Priority</ThemedText>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  {(['low', 'normal', 'high', 'critical'] as const).map((p) => (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setPriority(p)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        backgroundColor: priority === p ? colors.primary : colors.surface,
                        borderWidth: 1,
                        borderColor: priority === p ? colors.primary : colors.border,
                      }}
                    >
                      <ThemedText style={{ color: priority === p ? '#FFF' : colors.text, fontSize: 12, fontWeight: '600' }}>
                        {p.toUpperCase()}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>

                <ThemedText type="body" style={{ marginBottom: 8, fontWeight: '600' }}>Type</ThemedText>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  {(['general', 'alert', 'event', 'spotlight'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setType(t)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        backgroundColor: type === t ? colors.primary : colors.surface,
                        borderWidth: 1,
                        borderColor: type === t ? colors.primary : colors.border,
                      }}
                    >
                      <ThemedText style={{ color: type === t ? '#FFF' : colors.text, fontSize: 12, fontWeight: '600' }}>
                        {t.toUpperCase()}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={[
                    styles.input,
                    createInputStyle(),
                    { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder="Image URL (optional)"
                  placeholderTextColor={colors.icon}
                  value={imageUrl}
                  onChangeText={setImageUrl}
                />

                <TextInput
                  style={[
                    styles.input,
                    createInputStyle(),
                    { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder="Action Link (e.g., https://...)"
                  placeholderTextColor={colors.icon}
                  value={actionLink}
                  onChangeText={setActionLink}
                />

                <TextInput
                  style={[
                    styles.input,
                    createInputStyle(),
                    { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder="Action Button Label (e.g., Register Now)"
                  placeholderTextColor={colors.icon}
                  value={actionLabel}
                  onChangeText={setActionLabel}
                />

                <View style={styles.switchContainer}>
                  <ThemedText type="body" style={{ color: colors.text, flex: 1 }}>
                    Publish immediately
                  </ThemedText>
                  <Switch
                    value={isPublished}
                    onValueChange={setIsPublished}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setShowCreateModal(false)}
                >
                  <ThemedText type="body" style={{ color: colors.text, fontWeight: '600' }}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleSave}
                >
                  <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                    {editingAnnouncement ? 'Update' : 'Create'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 20,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  announcementCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  announcementInfo: {
    flex: 1,
  },
  announcementActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    marginTop: Spacing.xxl,
  },
  emptyText: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...createShadow(8, '#000', 0.3),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontWeight: '700',
  },
  modalScroll: {
    maxHeight: 400,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
});


