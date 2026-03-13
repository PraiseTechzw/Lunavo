/**
 * User Management Screen - Admin only
 */

import { ThemedText } from "@/app/_components/themed-text";
import { ThemedView } from "@/app/_components/themed-view";
import { BorderRadius, Colors, Spacing } from "@/app/_constants/theme";
import { useColorScheme } from "@/app/_hooks/use-color-scheme";
import { User, UserRole } from "@/app/_types";
import { createShadow, getCursorStyle } from "@/app/_utils/platform-styles";
import { getUsers, updateUser } from "@/lib/database";
import { MaterialIcons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UserManagementScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<UserRole | "all">("all");

  const loadUsers = useCallback(async () => {
    try {
      const allUsers = await getUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      Alert.alert("Error", "Failed to load users");
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleRoleChange = (user: User) => {
    const roles: UserRole[] = [
      "student",
      "peer-educator",
      "moderator",
      "counselor",
      "student-affairs",
      "admin",
    ];

    Alert.alert(
      "Change Role",
      `Select new role for ${user.fullName || user.pseudonym}`,
      roles.map((role) => ({
        text: role.toUpperCase(),
        onPress: async () => {
          try {
            await updateUser(user.id, { role });
            Alert.alert("Success", "User role updated");
            loadUsers();
          } catch (error) {
            console.error("Error updating role:", error);
            Alert.alert("Error", "Failed to update role");
          }
        },
      })),
      { cancelable: true }
    );
  };

  const filteredUsers = filter === "all" 
    ? users 
    : users.filter((u) => u.role === filter);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return colors.danger;
      case "student-affairs": return colors.primary;
      case "counselor": return colors.success;
      case "moderator": return colors.warning;
      case "peer-educator": return colors.info;
      default: return colors.icon;
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={[styles.userCard, { backgroundColor: colors.card }, createShadow(2, "#000", 0.05)]}>
      <View style={styles.userInfo}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + "15" }]}>
          <MaterialIcons name="person" size={24} color={colors.primary} />
        </View>
        <View style={styles.userText}>
          <ThemedText type="h3">{item.fullName || item.pseudonym}</ThemedText>
          <ThemedText type="small" style={{ color: colors.icon }}>{item.email}</ThemedText>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + "15" }]}>
          <ThemedText type="small" style={{ color: getRoleColor(item.role), fontWeight: "700" }}>
            {item.role.toUpperCase()}
          </ThemedText>
        </View>
      </View>

      <View style={styles.userFooter}>
        <View style={styles.activityInfo}>
          <MaterialIcons name="history" size={14} color={colors.icon} />
          <ThemedText type="small" style={{ color: colors.icon, marginLeft: 4 }}>
            Active {item.lastActive ? formatDistanceToNow(new Date(item.lastActive), { addSuffix: true }) : 'never'}
          </ThemedText>
        </View>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.surface }]}
          onPress={() => handleRoleChange(item)}
        >
          <MaterialIcons name="edit" size={16} color={colors.text} />
          <ThemedText type="small" style={{ marginLeft: 4, fontWeight: "600" }}>Change Role</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h2" style={styles.headerTitle}>User Management</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.filterSection}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={["all", "student", "peer-educator", "moderator", "counselor", "student-affairs", "admin"]}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  { backgroundColor: filter === item ? colors.primary : colors.surface }
                ]}
                onPress={() => setFilter(item as any)}
              >
                <ThemedText 
                  type="small" 
                  style={{ color: filter === item ? "#FFF" : colors.text, fontWeight: "600" }}
                >
                  {item === "all" ? "All" : item.charAt(0).toUpperCase() + item.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            )}
            keyExtractor={(i) => i}
            contentContainerStyle={styles.filterList}
          />
        </View>

        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="people-outline" size={64} color={colors.icon} />
              <ThemedText style={{ color: colors.icon, marginTop: 16 }}>No users found</ThemedText>
            </View>
          }
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: { fontWeight: "700" },
  filterSection: { borderBottomWidth: 1, borderBottomColor: "#E0E0E0" },
  filterList: { padding: Spacing.md, gap: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs,
  },
  listContent: { padding: Spacing.md },
  userCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  userText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  userFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  activityInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 100,
  },
});
