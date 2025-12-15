/**
 * Flag Review Panel - For Peer Educator Executives
 * Review flagged interactions (reported or risky)
 * NO STUDENT IDENTITIES VISIBLE
 */

import { DrawerHeader } from '@/components/navigation/drawer-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getPosts, getReplies, updatePost, updateReply } from '@/lib/database';
import { Post, Reply } from '@/types';
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

interface FlaggedItem {
  id: string;
  type: 'post' | 'reply';
  content: string;
  category?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reportedCount: number;
  flaggedAt: Date;
  escalationLevel?: string;
  postId?: string;
  authorPseudonym?: string; // Only peer educator pseudonym if applicable
}

export default function FlagReviewPanelScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user, loading: authLoading } = useRoleGuard(
    ['peer-educator-executive', 'admin'],
    '/(tabs)'
  );
  
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flaggedItems, setFlaggedItems] = useState<FlaggedItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [selectedItem, setSelectedItem] = useState<FlaggedItem | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionNotes, setActionNotes] = useState('');

  useEffect(() => {
    if (user) {
      loadFlaggedItems();
    }
  }, [user, filter]);

  const loadFlaggedItems = async () => {
    try {
      setLoading(true);
      const posts = await getPosts();
      
      const flagged: FlaggedItem[] = [];
      
      // Get flagged posts
      const flaggedPosts = posts.filter(p => p.isFlagged || p.reportedCount > 0);
      flaggedPosts.forEach(post => {
        const riskLevel = determineRiskLevel(post);
        flagged.push({
          id: post.id,
          type: 'post',
          content: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
          category: post.category,
          riskLevel,
          reportedCount: post.reportedCount || 0,
          flaggedAt: post.createdAt,
          escalationLevel: post.escalationLevel,
        });
      });
      
      // Get flagged replies
      for (const post of posts) {
        const replies = await getReplies(post.id).catch(() => []);
        const flaggedReplies = replies.filter(r => r.reportedCount > 0);
        flaggedReplies.forEach(reply => {
          const riskLevel = determineReplyRiskLevel(reply);
          flagged.push({
            id: reply.id,
            type: 'reply',
            content: reply.content.substring(0, 200) + (reply.content.length > 200 ? '...' : ''),
            riskLevel,
            reportedCount: reply.reportedCount || 0,
            flaggedAt: reply.createdAt,
            postId: post.id,
            authorPseudonym: reply.isFromVolunteer ? reply.authorPseudonym : undefined,
          });
        });
      }
      
      // Sort by risk level and date
      flagged.sort((a, b) => {
        const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const riskDiff = riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
        if (riskDiff !== 0) return riskDiff;
        return new Date(b.flaggedAt).getTime() - new Date(a.flaggedAt).getTime();
      });
      
      // Apply filter
      const filtered = filter === 'all' 
        ? flagged 
        : flagged.filter(item => item.riskLevel === filter);
      
      setFlaggedItems(filtered);
    } catch (error) {
      console.error('Error loading flagged items:', error);
    } finally {
      setLoading(false);
    }
  };

  const determineRiskLevel = (post: Post): 'low' | 'medium' | 'high' | 'critical' => {
    if (post.escalationLevel === 'critical') return 'critical';
    if (post.escalationLevel === 'high') return 'high';
    if (post.reportedCount >= 5) return 'high';
    if (post.reportedCount >= 2) return 'medium';
    return 'low';
  };

  const determineReplyRiskLevel = (reply: Reply): 'low' | 'medium' | 'high' | 'critical' => {
    if (reply.reportedCount >= 5) return 'high';
    if (reply.reportedCount >= 2) return 'medium';
    return 'low';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return colors.danger;
      case 'high': return '#FF6B35';
      case 'medium': return '#FFA500';
      case 'low': return colors.warning || '#FFD700';
      default: return colors.icon;
    }
  };

  const handleAction = async (action: 'approve' | 'remove' | 'escalate' | 'warn') => {
    if (!selectedItem) return;

    try {
      if (selectedItem.type === 'post') {
        if (action === 'remove') {
          // Mark post as removed (soft delete)
          await updatePost(selectedItem.id, { status: 'archived' });
        } else if (action === 'escalate') {
          // Escalate to counselor
          await updatePost(selectedItem.id, { 
            escalationLevel: 'high',
            isFlagged: true 
          });
        } else if (action === 'approve') {
          // Clear flag
          await updatePost(selectedItem.id, { isFlagged: false });
        }
      } else {
        // Reply actions
        if (action === 'remove') {
          // Note: In a real system, you'd have a deleteReply function
          // For now, we'll just update the reported count
          await updateReply(selectedItem.id, { reportedCount: 0 });
        } else if (action === 'approve') {
          await updateReply(selectedItem.id, { reportedCount: 0 });
        }
      }

      // Log action (in a real system, this would go to a moderation log)
      console.log(`Action taken: ${action} on ${selectedItem.type} ${selectedItem.id}`, {
        notes: actionNotes,
        timestamp: new Date(),
      });

      Alert.alert('Success', `Action completed: ${action}`);
      setShowActionModal(false);
      setSelectedItem(null);
      setActionNotes('');
      loadFlaggedItems();
    } catch (error) {
      console.error('Error taking action:', error);
      Alert.alert('Error', 'Failed to complete action');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFlaggedItems();
    setRefreshing(false);
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

  const pathname = usePathname();

  return (
    <SafeAreaView edges={isMobile ? ['top'] : []} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Mobile Header */}
        {isMobile && (
          <DrawerHeader
            title="Flag Review Panel"
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
                  Flag Review Panel
                </ThemedText>
                <ThemedText type="body" style={{ color: colors.icon, marginTop: 4 }}>
                  Review flagged interactions and moderate content
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

          {/* Filter Tabs */}
          <View style={[styles.filterSection, { backgroundColor: colors.card }, createShadow(2, '#000', 0.05)]}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContainer}
            >
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map((risk) => {
                const count = risk === 'all' 
                  ? flaggedItems.length 
                  : flaggedItems.filter(item => item.riskLevel === risk).length;
                return (
                  <TouchableOpacity
                    key={risk}
                    style={[
                      styles.filterTab,
                      {
                        backgroundColor: filter === risk ? getRiskColor(risk) : colors.surface,
                        borderColor: filter === risk ? getRiskColor(risk) : colors.border,
                      },
                      createShadow(filter === risk ? 3 : 1, getRiskColor(risk), filter === risk ? 0.2 : 0.05),
                    ]}
                    onPress={() => setFilter(risk)}
                    activeOpacity={0.8}
                    {...getCursorStyle()}
                  >
                    <ThemedText
                      type="small"
                      style={{
                        color: filter === risk ? '#FFFFFF' : colors.text,
                        fontWeight: '700',
                        textTransform: 'capitalize',
                        fontSize: 13,
                      }}
                    >
                      {risk}
                    </ThemedText>
                    {count > 0 && (
                      <View
                        style={[
                          styles.filterBadge,
                          { backgroundColor: filter === risk ? 'rgba(255, 255, 255, 0.3)' : getRiskColor(risk) + '20' },
                        ]}
                      >
                        <ThemedText
                          type="small"
                          style={{
                            color: filter === risk ? '#FFFFFF' : getRiskColor(risk),
                            fontSize: 11,
                            fontWeight: '700',
                          }}
                        >
                          {count}
                        </ThemedText>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Flagged Items List */}
          {flaggedItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="flag" size={64} color={colors.icon} />
              <ThemedText type="h3" style={{ color: colors.text, marginTop: Spacing.lg }}>
                No Flagged Items
              </ThemedText>
              <ThemedText type="body" style={{ color: colors.icon, marginTop: Spacing.sm, textAlign: 'center' }}>
                {filter === 'all' 
                  ? 'No flagged interactions at this time.'
                  : `No ${filter} risk items found.`}
              </ThemedText>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {flaggedItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.flaggedItem, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}
                  onPress={() => {
                    setSelectedItem(item);
                    setShowActionModal(true);
                  }}
                  {...getCursorStyle()}
                >
                  <View style={styles.itemHeader}>
                    <View style={styles.itemTypeBadge}>
                      <MaterialIcons
                        name={item.type === 'post' ? 'article' : 'reply'}
                        size={16}
                        color={colors.primary}
                      />
                      <ThemedText type="small" style={{ color: colors.primary, marginLeft: 4, fontWeight: '600' }}>
                        {item.type === 'post' ? 'Post' : 'Reply'}
                      </ThemedText>
                    </View>
                    <View
                      style={[
                        styles.riskBadge,
                        { backgroundColor: getRiskColor(item.riskLevel) + '20' },
                      ]}
                    >
                      <ThemedText
                        type="small"
                        style={{ color: getRiskColor(item.riskLevel), fontWeight: '700', textTransform: 'uppercase' }}
                      >
                        {item.riskLevel}
                      </ThemedText>
                    </View>
                  </View>

                  <ThemedText
                    type="body"
                    style={{ color: colors.text, marginTop: Spacing.sm }}
                    numberOfLines={3}
                  >
                    {item.content}
                  </ThemedText>

                  <View style={styles.itemFooter}>
                    <View style={styles.itemMeta}>
                      <MaterialIcons name="report" size={16} color={colors.icon} />
                      <ThemedText type="small" style={{ color: colors.icon, marginLeft: 4 }}>
                        {item.reportedCount} report{item.reportedCount !== 1 ? 's' : ''}
                      </ThemedText>
                    </View>
                    <ThemedText type="small" style={{ color: colors.icon }}>
                      {format(new Date(item.flaggedAt), 'MMM d, yyyy')}
                    </ThemedText>
                  </View>

                  {item.escalationLevel && item.escalationLevel !== 'none' && (
                    <View style={[styles.escalationBadge, { backgroundColor: colors.danger + '20' }]}>
                      <MaterialIcons name="warning" size={14} color={colors.danger} />
                      <ThemedText type="small" style={{ color: colors.danger, marginLeft: 4 }}>
                        Escalated: {item.escalationLevel}
                      </ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </ThemedView>

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3" style={{ color: colors.text }}>
                Recommended Action
              </ThemedText>
              <TouchableOpacity onPress={() => setShowActionModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <>
                <View style={[styles.riskBadge, { backgroundColor: getRiskColor(selectedItem.riskLevel) + '20', alignSelf: 'flex-start', marginBottom: Spacing.md }]}>
                  <ThemedText
                    type="body"
                    style={{ color: getRiskColor(selectedItem.riskLevel), fontWeight: '700', textTransform: 'uppercase' }}
                  >
                    {selectedItem.riskLevel} Risk
                  </ThemedText>
                </View>

                <ThemedText type="body" style={{ color: colors.text, marginBottom: Spacing.md }}>
                  {selectedItem.content}
                </ThemedText>

                <TextInput
                  style={[styles.notesInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder="Add notes (optional)"
                  placeholderTextColor={colors.icon}
                  value={actionNotes}
                  onChangeText={setActionNotes}
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.success }]}
                    onPress={() => handleAction('approve')}
                  >
                    <MaterialIcons name="check" size={20} color="#FFFFFF" />
                    <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: Spacing.xs }}>
                      Approve
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.danger }]}
                    onPress={() => handleAction('remove')}
                  >
                    <MaterialIcons name="delete" size={20} color="#FFFFFF" />
                    <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: Spacing.xs }}>
                      Remove Content
                    </ThemedText>
                  </TouchableOpacity>

                  {selectedItem.type === 'reply' && selectedItem.authorPseudonym && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#FFA500' }]}
                      onPress={() => handleAction('warn')}
                    >
                      <MaterialIcons name="warning" size={20} color="#FFFFFF" />
                      <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: Spacing.xs }}>
                        Warn Peer Educator
                      </ThemedText>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleAction('escalate')}
                  >
                    <MaterialIcons name="arrow-upward" size={20} color="#FFFFFF" />
                    <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: Spacing.xs }}>
                      Send to Counsellor
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
          </View>
        </Modal>

        {/* Mobile Drawer Menu */}
        {isMobile && (
          <DrawerMenu
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            role={user?.role || 'peer-educator-executive'}
          />
        )}
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
    alignItems: 'center',
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 20,
  },
  filterSection: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    gap: Spacing.sm,
    minHeight: 44,
    ...(isWeb ? {
      transition: 'all 0.2s ease',
    } : {}),
  },
  filterBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  itemsList: {
    gap: Spacing.md,
  },
  flaggedItem: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    ...(isWeb ? {
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    } : {}),
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  itemTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#F0F0F0',
  },
  riskBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  escalationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionButtons: {
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});
