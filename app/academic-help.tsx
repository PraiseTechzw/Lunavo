/**
 * Academic Help Spaces - Dedicated academic support channel
 */

import { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';

const studyGroups = [
  {
    id: '1',
    name: 'Mathematics Study Group',
    subject: 'Mathematics',
    members: 24,
    active: true,
    description: 'Weekly study sessions for calculus and algebra',
  },
  {
    id: '2',
    name: 'Computer Science Help',
    subject: 'Programming',
    members: 18,
    active: true,
    description: 'Peer programming help and code reviews',
  },
  {
    id: '3',
    name: 'Business Studies',
    subject: 'Business',
    members: 32,
    active: false,
    description: 'Case studies and exam preparation',
  },
];

const tutoringServices = [
  {
    id: '1',
    title: 'One-on-One Tutoring',
    subject: 'All Subjects',
    available: true,
    icon: 'person' as const,
    color: '#4CAF50',
  },
  {
    id: '2',
    title: 'Study Skills Workshop',
    subject: 'General',
    available: true,
    icon: 'school' as const,
    color: '#2196F3',
  },
  {
    id: '3',
    title: 'Exam Prep Sessions',
    subject: 'All Subjects',
    available: true,
    icon: 'quiz' as const,
    color: '#FF9800',
  },
  {
    id: '4',
    title: 'Writing Center',
    subject: 'Academic Writing',
    available: true,
    icon: 'edit' as const,
    color: '#9C27B0',
  },
];

const academicResources = [
  {
    id: '1',
    title: 'Time Management Guide',
    type: 'Guide',
    icon: 'schedule' as const,
  },
  {
    id: '2',
    title: 'Effective Note-Taking',
    type: 'Article',
    icon: 'note' as const,
  },
  {
    id: '3',
    title: 'Exam Strategies',
    type: 'Video',
    icon: 'video-library' as const,
  },
];

export default function AcademicHelpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [searchQuery, setSearchQuery] = useState('');

  const handleJoinGroup = (groupId: string) => {
    router.push(`/(tabs)/forum?category=academic`);
  };

  const handleBookTutoring = (serviceId: string) => {
    router.push('/book-counsellor');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h2" style={styles.headerTitle}>
            Academic Help Spaces
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text, backgroundColor: colors.surface }]}
            placeholder="Search study groups, tutors..."
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Quick Access */}
          <View style={styles.quickAccessSection}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Quick Access
            </ThemedText>
            <View style={styles.quickAccessGrid}>
              <TouchableOpacity
                style={[
                  styles.quickAccessCard,
                  { backgroundColor: colors.primary + '20' },
                  createShadow(2, '#000', 0.1),
                ]}
                onPress={() => router.push('/create-post?category=academic')}
                activeOpacity={0.7}
              >
                <MaterialIcons name="question-answer" size={32} color={colors.primary} />
                <ThemedText type="body" style={[styles.quickAccessLabel, { color: colors.primary }]}>
                  Ask a Question
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickAccessCard,
                  { backgroundColor: colors.success + '20' },
                  createShadow(2, '#000', 0.1),
                ]}
                onPress={() => router.push('/mentorship')}
                activeOpacity={0.7}
              >
                <MaterialIcons name="school" size={32} color={colors.success} />
                <ThemedText type="body" style={[styles.quickAccessLabel, { color: colors.success }]}>
                  Find a Mentor
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Study Groups */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Study Groups
              </ThemedText>
              <TouchableOpacity style={getCursorStyle()}>
                <ThemedText type="body" style={[styles.viewAll, { color: colors.primary }]}>
                  View All
                </ThemedText>
              </TouchableOpacity>
            </View>

            {studyGroups.map((group) => (
              <View
                key={group.id}
                style={[
                  styles.groupCard,
                  { backgroundColor: colors.card },
                  createShadow(2, '#000', 0.1),
                ]}
              >
                <View style={styles.groupHeader}>
                  <View style={[styles.groupIcon, { backgroundColor: colors.primary + '20' }]}>
                    <MaterialIcons name="groups" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.groupInfo}>
                    <ThemedText type="h3" style={styles.groupName}>
                      {group.name}
                    </ThemedText>
                    <View style={styles.groupMeta}>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: group.active ? colors.success + '20' : colors.icon + '20' }
                      ]}>
                        <View style={[
                          styles.statusDot,
                          { backgroundColor: group.active ? colors.success : colors.icon }
                        ]} />
                        <ThemedText type="small" style={{
                          color: group.active ? colors.success : colors.icon,
                          fontWeight: '600',
                          marginLeft: 4,
                        }}>
                          {group.active ? 'Active' : 'Inactive'}
                        </ThemedText>
                      </View>
                      <ThemedText type="small" style={{ color: colors.icon, marginLeft: Spacing.sm }}>
                        {group.subject}
                      </ThemedText>
                    </View>
                  </View>
                </View>
                <ThemedText type="body" style={[styles.groupDescription, { color: colors.icon }]}>
                  {group.description}
                </ThemedText>
                <View style={styles.groupFooter}>
                  <View style={styles.memberCount}>
                    <MaterialIcons name="people" size={16} color={colors.icon} />
                    <ThemedText type="small" style={{ color: colors.icon, marginLeft: 4 }}>
                      {group.members} members
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    style={[styles.joinButton, { backgroundColor: colors.primary + '20' }]}
                    onPress={() => handleJoinGroup(group.id)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="add" size={20} color={colors.primary} />
                    <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600', marginLeft: 4 }}>
                      Join Group
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Tutoring Services */}
          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Tutoring Services
            </ThemedText>
            <View style={styles.servicesGrid}>
              {tutoringServices.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.serviceCard,
                    { backgroundColor: colors.card },
                    createShadow(2, '#000', 0.1),
                  ]}
                  onPress={() => handleBookTutoring(service.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.serviceIcon, { backgroundColor: service.color + '20' }]}>
                    <MaterialIcons name={service.icon} size={32} color={service.color} />
                  </View>
                  <ThemedText type="body" style={styles.serviceTitle}>
                    {service.title}
                  </ThemedText>
                  <ThemedText type="small" style={[styles.serviceSubject, { color: colors.icon }]}>
                    {service.subject}
                  </ThemedText>
                  <View style={[
                    styles.availableBadge,
                    { backgroundColor: service.available ? colors.success + '20' : colors.warning + '20' }
                  ]}>
                    <ThemedText type="small" style={{
                      color: service.available ? colors.success : colors.warning,
                      fontWeight: '600',
                    }}>
                      {service.available ? 'Available' : 'Limited'}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Academic Resources */}
          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Resources & Guides
            </ThemedText>
            {academicResources.map((resource) => (
              <TouchableOpacity
                key={resource.id}
                style={[
                  styles.resourceCard,
                  { backgroundColor: colors.card },
                  createShadow(1, '#000', 0.05),
                ]}
                activeOpacity={0.7}
              >
                <View style={[styles.resourceIcon, { backgroundColor: colors.surface }]}>
                  <MaterialIcons name={resource.icon} size={24} color={colors.primary} />
                </View>
                <View style={styles.resourceContent}>
                  <ThemedText type="body" style={styles.resourceTitle}>
                    {resource.title}
                  </ThemedText>
                  <ThemedText type="small" style={[styles.resourceType, { color: colors.icon }]}>
                    {resource.type}
                  </ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F5F5F5',
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  quickAccessSection: {
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  viewAll: {
    fontWeight: '600',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickAccessCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  quickAccessLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },
  groupCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  groupHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  groupDescription: {
    fontSize: 14,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  serviceCard: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  serviceIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  serviceTitle: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  serviceSubject: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  availableBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  resourceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  resourceType: {
    fontSize: 12,
  },
});



