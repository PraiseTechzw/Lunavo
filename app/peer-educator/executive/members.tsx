/**
 * Member Management - Executive view of all peer educators
 */

import { DrawerHeader } from '@/components/navigation/drawer-header';
import { DrawerMenu } from '@/components/navigation/drawer-menu';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getPosts, getReplies } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { createInputStyle, createShadow } from '@/utils/platform-styles';
import { MaterialIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
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

interface MemberStats {
  totalResponses: number;
  helpfulResponses: number;
  activeThreads: number;
}

export default function MemberManagementScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user, loading: authLoading } = useRoleGuard(
    ['peer-educator-executive', 'admin'],
    '/(tabs)'
  );
  
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState<Array<User & { stats?: MemberStats }>>([]);
  const [filteredMembers, setFilteredMembers] = useState<Array<User & { stats?: MemberStats }>>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      loadMembers();
    }
  }, [user]);

  useEffect(() => {
    filterMembers();
  }, [members, searchQuery]);

  const loadMembers = async () => {
    try {
      // Get all peer educators
      const { data: membersData, error } = await supabase
        .from('users')
        .select('*')
        .in('role', ['peer-educator', 'peer-educator-executive'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get stats for each member
      const posts = await getPosts();
      const allReplies = await Promise.all(posts.map((p) => getReplies(p.id).catch(() => [])));
      const replies = allReplies.flat();

      const membersWithStats = await Promise.all(
        (membersData || []).map(async (member: any) => {
          const memberReplies = replies.filter((r) => r.authorId === member.id);
          const helpfulCount = memberReplies.filter((r) => r.isHelpful > 0).length;
          const activeThreads = new Set(memberReplies.map((r) => r.postId)).size;

          return {
            id: member.id,
            pseudonym: member.pseudonym,
            isAnonymous: member.is_anonymous,
            role: member.role,
            createdAt: new Date(member.created_at),
            lastActive: new Date(member.last_active),
            profile_data: member.profile_data || {},
            stats: {
              totalResponses: memberReplies.length,
              helpfulResponses: helpfulCount,
              activeThreads,
            },
          };
        })
      );

      setMembers(membersWithStats);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const filterMembers = () => {
    let filtered = members;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((m) =>
        m.pseudonym.toLowerCase().includes(query)
      );
    }

    setFilteredMembers(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMembers();
    setRefreshing(false);
  };

  const renderMember = ({ item }: { item: User & { stats?: MemberStats } }) => (
    <TouchableOpacity
      style={[styles.memberCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}
      onPress={() => {
        // TODO: Navigate to member profile
        Alert.alert('Member', `Viewing ${item.pseudonym}'s profile`);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.memberHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <MaterialIcons name="person" size={32} color="#FFFFFF" />
        </View>
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }}>
              {item.pseudonym}
            </ThemedText>
            {item.role === 'peer-educator-executive' && (
              <View style={[styles.roleBadge, { backgroundColor: colors.primary + '20' }]}>
                <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600' }}>
                  Executive
                </ThemedText>
              </View>
            )}
          </View>
          <ThemedText type="small" style={{ color: colors.icon }}>
            Joined {new Date(item.createdAt).toLocaleDateString()}
          </ThemedText>
        </View>
      </View>

      {item.stats && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <ThemedText type="h3" style={{ color: colors.primary }}>
              {item.stats.totalResponses}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.icon }}>
              Responses
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type="h3" style={{ color: colors.success }}>
              {item.stats.helpfulResponses}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.icon }}>
              Helpful
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type="h3" style={{ color: colors.primary }}>
              {item.stats.activeThreads}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.icon }}>
              Threads
            </ThemedText>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const pathname = usePathname();

  if (authLoading) {
    return (
      <SafeAreaView edges={isMobile ? ['top'] : []} style={{ flex: 1 }}>
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={isMobile ? ['top'] : []} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Mobile Header */}
        {isMobile && (
          <DrawerHeader
            title="Member Management"
            onMenuPress={() => setDrawerVisible(true)}
          />
        )}

        {/* Web Header */}
        {isWeb && (
          <View style={[styles.webHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <View style={styles.webHeaderContent}>
              <View>
                <ThemedText type="h1" style={[styles.webHeaderTitle, { color: colors.text }]}>
                  Member Management
                </ThemedText>
                <ThemedText type="body" style={{ color: colors.icon, marginTop: 4 }}>
                  View and manage peer educators
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Search Bar */}
        <View style={[styles.searchContainer, isWeb && styles.webSearchContainer]}>
          <MaterialIcons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
          <TextInput
            style={[
              styles.searchInput,
              createInputStyle(),
              { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="Search members..."
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Members List */}
        {isMobile ? (
          <FlatList
            data={filteredMembers}
            renderItem={renderMember}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
            }
            ListHeaderComponent={
              <ThemedText type="body" style={{ color: colors.icon, marginBottom: Spacing.md }}>
                {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
              </ThemedText>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="people-outline" size={64} color={colors.icon} />
                <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
                  No members found
                </ThemedText>
              </View>
            }
          />
        ) : (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={[styles.webListContent, isWeb && styles.webScrollContent]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
            }
          >
            <ThemedText type="body" style={{ color: colors.icon, marginBottom: Spacing.md }}>
              {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
            </ThemedText>
            {filteredMembers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="people-outline" size={64} color={colors.icon} />
                <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
                  No members found
                </ThemedText>
              </View>
            ) : (
              filteredMembers.map((item) => renderMember({ item }))
            )}
          </ScrollView>
        )}

        {/* Mobile Drawer Menu */}
        {isMobile && (
          <DrawerMenu
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            role={user?.role || 'peer-educator-executive'}
          />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  webSearchContainer: {
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  searchIcon: {
    position: 'absolute',
    left: Spacing.lg,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    paddingLeft: Spacing.xxl,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 80,
  },
  webListContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  webScrollContent: {
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  memberCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  statItem: {
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
});

