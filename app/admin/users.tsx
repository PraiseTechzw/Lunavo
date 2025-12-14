/**
 * Users Management Screen - Admin only
 * View and manage all users in the system
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { WebCard, WebContainer } from '@/app/components/web';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { User, UserRole } from '@/app/types';
import { createInputStyle, getCursorStyle } from '@/app/utils/platform-styles';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { getUsers } from '@/lib/database';
import { MaterialIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
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

const ROLE_LABELS: Record<UserRole, string> = {
  'student': 'Student',
  'peer-educator': 'Peer Educator',
  'peer-educator-executive': 'Peer Educator Executive',
  'moderator': 'Moderator',
  'counselor': 'Counselor',
  'life-coach': 'Life Coach',
  'student-affairs': 'Student Affairs',
  'admin': 'Admin',
};

const ROLE_COLORS: Record<UserRole, string> = {
  'student': '#2196F3',
  'peer-educator': '#4CAF50',
  'peer-educator-executive': '#9C27B0',
  'moderator': '#FF9800',
  'counselor': '#00BCD4',
  'life-coach': '#009688',
  'student-affairs': '#F44336',
  'admin': '#E91E63',
};

export default function UsersScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  // Role guard - only admins can access
  const { user, loading } = useRoleGuard(['admin'], '/(tabs)');
  
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'created' | 'active'>('created');
  
  // Early return for loading
  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  useEffect(() => {
    if (user) {
      loadUsers();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchQuery, roleFilter, sortBy]);

  const loadUsers = async () => {
    try {
      const allUsers = await getUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    }
  };

  const filterAndSortUsers = () => {
    let filtered = [...users];

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.pseudonym.toLowerCase().includes(query) ||
        (u.username && u.username.toLowerCase().includes(query)) ||
        u.role.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.pseudonym.localeCompare(b.pseudonym);
        case 'role':
          return a.role.localeCompare(b.role);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'active':
          const aActive = a.lastActive ? new Date(a.lastActive).getTime() : 0;
          const bActive = b.lastActive ? new Date(b.lastActive).getTime() : 0;
          return bActive - aActive;
        default:
          return 0;
      }
    });

    setFilteredUsers(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleUserAction = (userId: string, action: 'view' | 'edit' | 'delete') => {
    switch (action) {
      case 'view':
        // TODO: Navigate to user detail page
        Alert.alert('View User', `View user ${userId}`);
        break;
      case 'edit':
        // TODO: Navigate to edit user page
        Alert.alert('Edit User', `Edit user ${userId}`);
        break;
      case 'delete':
        Alert.alert(
          'Delete User',
          'Are you sure you want to delete this user? This action cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                // TODO: Implement delete user
                Alert.alert('Success', 'User deleted');
                loadUsers();
              },
            },
          ]
        );
        break;
    }
  };

  const roles: (UserRole | 'all')[] = ['all', 'student', 'peer-educator', 'peer-educator-executive', 'moderator', 'counselor', 'life-coach', 'student-affairs', 'admin'];
  const sortOptions: Array<{ value: typeof sortBy; label: string }> = [
    { value: 'created', label: 'Newest' },
    { value: 'name', label: 'Name' },
    { value: 'role', label: 'Role' },
    { value: 'active', label: 'Recently Active' },
  ];

  const content = (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Page Header - Web optimized */}
      {isWeb && (
        <View style={styles.pageHeader}>
          <View>
            <ThemedText type="h1" style={[styles.pageTitle, { color: colors.text }]}>
              User Management
            </ThemedText>
            <ThemedText type="body" style={[styles.pageSubtitle, { color: colors.icon }]}>
              Manage all users in the system ({users.length} total)
            </ThemedText>
          </View>
        </View>
      )}

      {/* Search and Filters */}
      <WebCard style={styles.filtersCard}>
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <MaterialIcons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, createInputStyle(), { color: colors.text }]}
            placeholder="Search by name, username, or role..."
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Role Filter */}
        <View style={styles.filtersRow}>
          <ThemedText type="body" style={[styles.filterLabel, { color: colors.text }]}>
            Filter by Role:
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleFilters}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleChip,
                  {
                    backgroundColor: roleFilter === role ? colors.primary : colors.surface,
                    borderColor: roleFilter === role ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setRoleFilter(role)}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: roleFilter === role ? '#FFFFFF' : colors.text,
                    fontWeight: '600',
                  }}
                >
                  {role === 'all' ? 'All' : ROLE_LABELS[role]}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Sort Options */}
        <View style={styles.filtersRow}>
          <ThemedText type="body" style={[styles.filterLabel, { color: colors.text }]}>
            Sort by:
          </ThemedText>
          <View style={styles.sortOptions}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortChip,
                  {
                    backgroundColor: sortBy === option.value ? colors.primary : colors.surface,
                    borderColor: sortBy === option.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSortBy(option.value)}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: sortBy === option.value ? '#FFFFFF' : colors.text,
                    fontWeight: '600',
                  }}
                >
                  {option.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </WebCard>

      {/* Stats Summary */}
      <View style={styles.statsGrid}>
        {roles.filter(r => r !== 'all').map((role) => {
          const count = users.filter(u => u.role === role).length;
          return (
            <WebCard key={role} style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: ROLE_COLORS[role] + '15' }]}>
                <MaterialIcons name="person" size={24} color={ROLE_COLORS[role]} />
              </View>
              <View style={styles.statInfo}>
                <ThemedText type="h2" style={[styles.statValue, { color: colors.text }]}>
                  {count}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  {ROLE_LABELS[role]}
                </ThemedText>
              </View>
            </WebCard>
          );
        })}
      </View>

      {/* Users List */}
      <WebCard style={styles.usersCard}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
            Users ({filteredUsers.length})
          </ThemedText>
        </View>

        {filteredUsers.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="people-outline" size={64} color={colors.icon} />
            <ThemedText type="h3" style={[styles.emptyTitle, { color: colors.text }]}>
              No Users Found
            </ThemedText>
            <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
              {searchQuery || roleFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'No users in the system'}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.usersList}>
            {filteredUsers.map((user) => {
              const isActive = user.lastActive 
                ? (Date.now() - new Date(user.lastActive).getTime()) < 7 * 24 * 60 * 60 * 1000
                : false;
              
              return (
                <WebCard
                  key={user.id}
                  hoverable
                  style={styles.userCard}
                >
                  <View style={styles.userHeader}>
                    <View style={styles.userInfo}>
                      <View style={[styles.avatar, { backgroundColor: ROLE_COLORS[user.role] }]}>
                        <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                          {user.pseudonym[0]?.toUpperCase() || 'U'}
                        </ThemedText>
                      </View>
                      <View style={styles.userDetails}>
                        <ThemedText type="body" style={[styles.userName, { color: colors.text }]}>
                          {user.pseudonym}
                        </ThemedText>
                        {user.username && (
                          <ThemedText type="small" style={{ color: colors.icon }}>
                            @{user.username}
                          </ThemedText>
                        )}
                      </View>
                    </View>
                    <View style={[
                      styles.statusIndicator,
                      { backgroundColor: isActive ? colors.success : colors.icon + '40' }
                    ]} />
                  </View>

                  <View style={styles.userMeta}>
                    <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[user.role] + '20' }]}>
                      <ThemedText type="small" style={{ color: ROLE_COLORS[user.role], fontWeight: '600' }}>
                        {ROLE_LABELS[user.role]}
                      </ThemedText>
                    </View>
                    <ThemedText type="small" style={{ color: colors.icon }}>
                      Joined {formatDistanceToNow(user.createdAt, { addSuffix: true })}
                    </ThemedText>
                  </View>

                  {user.lastActive && (
                    <View style={styles.userActivity}>
                      <MaterialIcons name="schedule" size={14} color={colors.icon} />
                      <ThemedText type="small" style={{ color: colors.icon, marginLeft: 4 }}>
                        Last active {formatDistanceToNow(new Date(user.lastActive), { addSuffix: true })}
                      </ThemedText>
                    </View>
                  )}

                  <View style={styles.userActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
                      onPress={() => handleUserAction(user.id, 'view')}
                    >
                      <MaterialIcons name="visibility" size={18} color={colors.primary} />
                      <ThemedText type="small" style={{ color: colors.primary, marginLeft: 4, fontWeight: '600' }}>
                        View
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.warning + '20' }]}
                      onPress={() => handleUserAction(user.id, 'edit')}
                    >
                      <MaterialIcons name="edit" size={18} color={colors.warning} />
                      <ThemedText type="small" style={{ color: colors.warning, marginLeft: 4, fontWeight: '600' }}>
                        Edit
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.danger + '20' }]}
                      onPress={() => handleUserAction(user.id, 'delete')}
                    >
                      <MaterialIcons name="delete" size={18} color={colors.danger} />
                      <ThemedText type="small" style={{ color: colors.danger, marginLeft: 4, fontWeight: '600' }}>
                        Delete
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </WebCard>
              );
            })}
          </View>
        )}
      </WebCard>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );

  // Web layout with container
  if (isWeb) {
    return (
      <ThemedView style={styles.container}>
        <WebContainer maxWidth={1600} padding={32}>
          {content}
        </WebContainer>
      </ThemedView>
    );
  }

  // Mobile layout
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Mobile Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/admin/dashboard' as any);
              }
            }} 
            style={getCursorStyle()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h2" style={styles.headerTitle}>
            User Management
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>
        {content}
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
    backgroundColor: 'transparent',
    ...(isWeb ? {
      height: '100%',
      overflow: 'hidden',
    } : {}),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontWeight: '700',
  },
  pageHeader: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.lg,
  },
  pageTitle: {
    fontWeight: '700',
    fontSize: isWeb ? 32 : 24,
    marginBottom: Spacing.xs,
  },
  pageSubtitle: {
    fontSize: isWeb ? 16 : 14,
  },
  scrollView: {
    flex: 1,
    ...(isWeb ? {
      height: '100%',
      overflowY: 'auto' as any,
    } : {}),
  },
  scrollContent: {
    padding: isWeb ? 0 : Spacing.md,
    paddingBottom: isWeb ? Spacing.xxl : 80,
    ...(isWeb ? {
      minHeight: '100%',
    } : {}),
  },
  filtersCard: {
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontWeight: '600',
    minWidth: 100,
  },
  roleFilters: {
    flex: 1,
  },
  roleChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    borderWidth: 1,
    ...getCursorStyle(),
  },
  sortOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flex: 1,
    flexWrap: 'wrap',
  },
  sortChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    ...getCursorStyle(),
  },
  statsGrid: {
    ...(isWeb ? {
      // @ts-ignore - Web-specific CSS grid
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: Spacing.lg,
    } : {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    }),
    marginBottom: Spacing.xl,
  },
  statCard: {
    ...(isWeb ? {} : {
      width: '48%',
    }),
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: isWeb ? 28 : 24,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  usersCard: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: isWeb ? 20 : 18,
  },
  usersList: {
    gap: Spacing.md,
  },
  userCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  userActivity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    ...getCursorStyle(),
  },
  emptyCard: {
    padding: Spacing.xxl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: Spacing.md,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});

