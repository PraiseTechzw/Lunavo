/**
 * Content & Resource Approval - For Peer Educator Executives
 * Review and approve educational posts and awareness content
 * Ensure content aligns with Student Affairs policies and University values
 */

import { DrawerHeader } from '@/components/navigation/drawer-header';
import { DrawerMenu } from '@/components/navigation/drawer-menu';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getPosts, getResources, updatePost } from '@/lib/database';
import { createShadow, getCursorStyle } from '@/utils/platform-styles';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isMobile = Platform.OS !== 'web';

interface PendingContent {
  id: string;
  type: 'post' | 'resource';
  title: string;
  content: string;
  category: string;
  authorPseudonym?: string;
  submittedAt: Date;
  tags?: string[];
  status: 'pending' | 'approved' | 'rejected';
}

export default function ContentApprovalScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user, loading: authLoading } = useRoleGuard(
    ['peer-educator-executive', 'admin'],
    '/(tabs)'
  );
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingContent, setPendingContent] = useState<PendingContent[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selectedContent, setSelectedContent] = useState<PendingContent | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    if (user) {
      loadPendingContent();
    }
  }, [user, filter]);

  const loadPendingContent = async () => {
    try {
      setLoading(true);
      
      // Get all posts - filter for educational/awareness content
      // In a real system, posts would have a flag like isEducational or needsApproval
      const posts = await getPosts();
      
      // For now, we'll identify educational content by tags or category
      // Posts with tags like 'educational', 'awareness', 'announcement' or in specific categories
      const educationalPosts = posts.filter(post => {
        const hasEducationalTag = post.tags?.some(tag => 
          tag.toLowerCase().includes('educational') ||
          tag.toLowerCase().includes('awareness') ||
          tag.toLowerCase().includes('announcement')
        );
        const isEducationalCategory = ['academic', 'mental-health', 'substance-abuse'].includes(post.category);
        return hasEducationalTag || isEducationalCategory;
      });

      const content: PendingContent[] = educationalPosts.map(post => ({
        id: post.id,
        type: 'post',
        title: post.title,
        content: post.content,
        category: post.category,
        authorPseudonym: post.authorPseudonym,
        submittedAt: post.createdAt,
        tags: post.tags,
        status: post.status === 'active' ? 'approved' : 'pending', // Simplified logic
      }));

      // Get resources that need approval
      // In a real system, resources would have an approval status field
      const resources = await getResources({});
      const pendingResources: PendingContent[] = resources
        .filter(resource => {
          // Filter resources that might need approval
          return resource.category === 'substance-abuse' || resource.category === 'academic';
        })
        .map(resource => ({
          id: resource.id,
          type: 'resource',
          title: resource.title,
          content: resource.description || '',
          category: resource.category || 'general',
          submittedAt: new Date(resource.createdAt || Date.now()),
          tags: resource.tags,
          status: 'approved', // Simplified - in real system would check approval status
        }));

      const allContent = [...content, ...pendingResources];
      
      // Filter by status
      let filtered = allContent;
      if (filter !== 'all') {
        filtered = allContent.filter(item => item.status === filter);
      }

      // Filter by search query
      if (searchQuery.trim()) {
        filtered = filtered.filter(item =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Sort by submission date (newest first)
      filtered.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

      setPendingContent(filtered);
    } catch (error) {
      console.error('Error loading pending content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedContent) return;

    try {
      if (selectedContent.type === 'post') {
        await updatePost(selectedContent.id, { status: 'active' });
      }
      // For resources, you would update resource approval status

      Alert.alert('Success', 'Content approved successfully');
      setShowReviewModal(false);
      setSelectedContent(null);
      setReviewNotes('');
      loadPendingContent();
    } catch (error) {
      console.error('Error approving content:', error);
      Alert.alert('Error', 'Failed to approve content');
    }
  };

  const handleReject = async () => {
    if (!selectedContent) return;

    try {
      if (selectedContent.type === 'post') {
        await updatePost(selectedContent.id, { status: 'archived' });
      }

      Alert.alert('Success', 'Content rejected');
      setShowReviewModal(false);
      setSelectedContent(null);
      setReviewNotes('');
      loadPendingContent();
    } catch (error) {
      console.error('Error rejecting content:', error);
      Alert.alert('Error', 'Failed to reject content');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPendingContent();
    setRefreshing(false);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'academic': 'Academic',
      'mental-health': 'Mental Health',
      'substance-abuse': 'Substance Abuse',
      'relationships': 'Relationships',
      'crisis': 'Crisis',
      'general': 'General',
    };
    return labels[category] || category;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return colors.success;
      case 'rejected': return colors.danger;
      case 'pending': return '#FFA500';
      default: return colors.icon;
    }
  };

  if (authLoading || loading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={{ marginTop: Spacing.md, color: colors.icon }}>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const pendingCount = pendingContent.filter(c => c.status === 'pending').length;
  const approvedCount = pendingContent.filter(c => c.status === 'approved').length;

  const pathname = usePathname();

  return (
    <SafeAreaView edges={isMobile ? ['top'] : []} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Mobile Header */}
        {isMobile && (
          <DrawerHeader
            title="Content Approval"
            onMenuPress={() => setDrawerVisible(true)}
            rightAction={{
              icon: 'refresh',
              onPress: handleRefresh,
            }}
          />
        )}

        {/* Web Header */}
        {isWeb && (
          <View style={[styles.webHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <View style={styles.webHeaderContent}>
              <View>
                <ThemedText type="h1" style={[styles.webHeaderTitle, { color: colors.text }]}>
                  Content & Resource Approval
                </ThemedText>
                <ThemedText type="body" style={{ color: colors.icon, marginTop: 4 }}>
                  Review educational posts and awareness content
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={handleRefresh}
                style={[styles.refreshButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                {...getCursorStyle()}
              >
                <MaterialIcons name="refresh" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isWeb && styles.webScrollContent
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >

          {/* Summary */}
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, { backgroundColor: '#FFA50020' }]}>
              <MaterialIcons name="schedule" size={24} color="#FFA500" />
              <ThemedText type="h3" style={{ color: '#FFA500', fontWeight: '700' }}>
                {pendingCount}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Pending
              </ThemedText>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.success + '20' }]}>
              <MaterialIcons name="check-circle" size={24} color={colors.success} />
              <ThemedText type="h3" style={{ color: colors.success, fontWeight: '700' }}>
                {approvedCount}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Approved
              </ThemedText>
            </View>
          </View>

          {/* Search */}
          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name="search" size={20} color={colors.icon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search content..."
              placeholderTextColor={colors.icon}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={20} color={colors.icon} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterContainer}>
            {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: filter === status ? colors.primary : colors.surface,
                    borderColor: filter === status ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setFilter(status)}
                {...getCursorStyle()}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: filter === status ? '#FFFFFF' : colors.text,
                    fontWeight: '600',
                    textTransform: 'capitalize',
                  }}
                >
                  {status}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content List */}
          {pendingContent.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="approval" size={64} color={colors.icon} />
              <ThemedText type="h3" style={{ color: colors.text, marginTop: Spacing.lg }}>
                No Content Found
              </ThemedText>
              <ThemedText type="body" style={{ color: colors.icon, marginTop: Spacing.sm, textAlign: 'center' }}>
                {filter === 'all' 
                  ? 'No content available for review.'
                  : `No ${filter} content found.`}
              </ThemedText>
            </View>
          ) : (
            <View style={styles.contentList}>
              {pendingContent.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.contentCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}
                  onPress={() => {
                    setSelectedContent(item);
                    setShowReviewModal(true);
                  }}
                  {...getCursorStyle()}
                >
                  <View style={styles.contentHeader}>
                    <View style={styles.contentTypeBadge}>
                      <MaterialIcons
                        name={item.type === 'post' ? 'article' : 'book'}
                        size={16}
                        color={colors.primary}
                      />
                      <ThemedText type="small" style={{ color: colors.primary, marginLeft: 4, fontWeight: '600' }}>
                        {item.type === 'post' ? 'Post' : 'Resource'}
                      </ThemedText>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(item.status) + '20' },
                      ]}
                    >
                      <ThemedText
                        type="small"
                        style={{ color: getStatusColor(item.status), fontWeight: '700', textTransform: 'uppercase' }}
                      >
                        {item.status}
                      </ThemedText>
                    </View>
                  </View>

                  <ThemedText type="body" style={{ fontWeight: '700', color: colors.text, marginTop: Spacing.sm }}>
                    {item.title}
                  </ThemedText>

                  <ThemedText
                    type="small"
                    style={{ color: colors.icon, marginTop: Spacing.xs }}
                    numberOfLines={2}
                  >
                    {item.content}
                  </ThemedText>

                  <View style={styles.contentFooter}>
                    <View style={styles.categoryBadge}>
                      <ThemedText type="small" style={{ color: colors.icon }}>
                        {getCategoryLabel(item.category)}
                      </ThemedText>
                    </View>
                    <ThemedText type="small" style={{ color: colors.icon }}>
                      {format(new Date(item.submittedAt), 'MMM d, yyyy')}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Drawer Menu - Mobile Only */}
        {isMobile && (
          <DrawerMenu
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            role={user?.role || undefined}
          />
        )}
      </ThemedView>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3" style={{ color: colors.text }}>
                Review Content
              </ThemedText>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedContent && (
              <>
                <View style={styles.modalBody}>
                  <ThemedText type="h3" style={{ color: colors.text, marginBottom: Spacing.sm }}>
                    {selectedContent.title}
                  </ThemedText>
                  
                  <View style={styles.modalMeta}>
                    <View style={styles.categoryBadge}>
                      <ThemedText type="small" style={{ color: colors.icon }}>
                        {getCategoryLabel(selectedContent.category)}
                      </ThemedText>
                    </View>
                    <ThemedText type="small" style={{ color: colors.icon }}>
                      Submitted: {format(new Date(selectedContent.submittedAt), 'MMM d, yyyy')}
                    </ThemedText>
                  </View>

                  <ThemedText type="body" style={{ color: colors.text, marginTop: Spacing.md }}>
                    {selectedContent.content}
                  </ThemedText>

                  {selectedContent.tags && selectedContent.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {selectedContent.tags.map((tag, index) => (
                        <View key={index} style={[styles.tag, { backgroundColor: colors.surface }]}>
                          <ThemedText type="small" style={{ color: colors.icon }}>
                            {tag}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  )}

                  <TextInput
                    style={[styles.notesInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholder="Add review notes (optional)"
                    placeholderTextColor={colors.icon}
                    value={reviewNotes}
                    onChangeText={setReviewNotes}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.modalActions}>
                  {selectedContent.status === 'pending' && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.success }]}
                        onPress={handleApprove}
                      >
                        <MaterialIcons name="check" size={20} color="#FFFFFF" />
                        <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: Spacing.xs }}>
                          Approve
                        </ThemedText>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.danger }]}
                        onPress={handleReject}
                      >
                        <MaterialIcons name="close" size={20} color="#FFFFFF" />
                        <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: Spacing.xs }}>
                          Reject
                        </ThemedText>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </>
            )}
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: isMobile ? 80 : Spacing.xl,
  },
  webScrollContent: {
    padding: Spacing.xl,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  webHeader: {
    padding: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    ...(isWeb ? {
      position: 'sticky' as any,
      top: 70,
      zIndex: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
    } : {}),
  },
  webHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  webHeaderTitle: {
    fontWeight: '700',
    fontSize: 32,
    letterSpacing: -0.5,
  },
  refreshButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...(isWeb ? {
      transition: 'all 0.2s ease',
    } : {}),
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    paddingVertical: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
  },
  contentList: {
    gap: Spacing.md,
  },
  contentCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  contentTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#F0F0F0',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  contentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#F0F0F0',
  },
  emptyContainer: {
    padding: Spacing.xxl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalBody: {
    marginBottom: Spacing.lg,
  },
  modalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});
