/**
 * Announcements Management - Create, edit, delete announcements
 */

import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { createShadow, getCursorStyle, createInputStyle } from '@/utils/platform-styles';
import { getCurrentUser } from '@/lib/database';
import { Announcement } from '@/types';
import { format } from 'date-fns';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANNOUNCEMENTS_KEY = '@lunavo:announcements';

export default function AnnouncementsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user, loading: authLoading } = useRoleGuard(
    ['peer-educator-executive', 'admin'],
    '/(tabs)'
  );
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      loadAnnouncements();
    }
  }, [user]);

  const loadAnnouncements = async () => {
    try {
      // Load from AsyncStorage (in production, this would come from database)
      const announcementsJson = await AsyncStorage.getItem(ANNOUNCEMENTS_KEY);
      if (announcementsJson) {
        const stored = JSON.parse(announcementsJson);
        setAnnouncements(stored.map((a: any) => ({
          ...a,
          createdAt: new Date(a.createdAt),
          scheduledFor: a.scheduledFor ? new Date(a.scheduledFor) : undefined,
        })));
      }
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
    setShowCreateModal(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setTitle(announcement.title);
    setContent(announcement.content);
    setIsPublished(announcement.isPublished);
    setScheduledFor(announcement.scheduledFor || null);
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
              const updated = announcements.filter((a) => a.id !== announcement.id);
              setAnnouncements(updated);
              await AsyncStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(updated));
              Alert.alert('Success', 'Announcement deleted.');
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
      let updated: Announcement[];
      
      if (editingAnnouncement) {
        updated = announcements.map((a) =>
          a.id === editingAnnouncement.id
            ? {
                ...a,
                title,
                content,
                isPublished,
                scheduledFor: scheduledFor || undefined,
              }
            : a
        );
        Alert.alert('Success', 'Announcement updated.');
      } else {
        const newAnnouncement: Announcement = {
          id: Date.now().toString(),
          title,
          content,
          createdBy: user.id,
          createdAt: new Date(),
          scheduledFor: scheduledFor || undefined,
          isPublished,
        };
        updated = [newAnnouncement, ...announcements];
        Alert.alert('Success', 'Announcement created.');
      }

      setAnnouncements(updated);
      await AsyncStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(updated));
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


