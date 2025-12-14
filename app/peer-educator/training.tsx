/**
 * Training Resources - Ongoing training for peer educators
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createShadow, getCursorStyle } from '@/utils/platform-styles';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getResourceIconMaterial } from '@/utils/resource-utils';

interface TrainingResource {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'document' | 'quiz';
  category: string;
  duration?: string;
  completed: boolean;
  certificate?: boolean;
}

export default function TrainingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user, loading: authLoading } = useRoleGuard(
    ['peer-educator', 'peer-educator-executive', 'admin'],
    '/(tabs)'
  );
  
  const [refreshing, setRefreshing] = useState(false);
  const [resources, setResources] = useState<TrainingResource[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadTrainingResources();
    }
  }, [user, selectedCategory]);

  const loadTrainingResources = async () => {
    try {
      // Mock training resources - in production, these would come from database
      const trainingResources: TrainingResource[] = [
        {
          id: '1',
          title: 'Advanced Crisis Intervention',
          description: 'Deep dive into crisis intervention techniques and protocols.',
          type: 'video',
          category: 'crisis',
          duration: '45 min',
          completed: false,
          certificate: true,
        },
        {
          id: '2',
          title: 'Mental Health First Aid',
          description: 'Comprehensive guide to mental health first aid for students.',
          type: 'video',
          category: 'mental-health',
          duration: '60 min',
          completed: false,
          certificate: true,
        },
        {
          id: '3',
          title: 'Substance Abuse Awareness',
          description: 'Understanding substance abuse and how to support affected students.',
          type: 'document',
          category: 'substance-abuse',
          duration: '30 min',
          completed: false,
        },
        {
          id: '4',
          title: 'Training Quiz: Crisis Response',
          description: 'Test your knowledge of crisis response procedures.',
          type: 'quiz',
          category: 'crisis',
          duration: '20 min',
          completed: false,
        },
      ];

      let filtered = trainingResources;
      if (selectedCategory !== 'all') {
        filtered = trainingResources.filter((r) => r.category === selectedCategory);
      }

      setResources(filtered);
    } catch (error) {
      console.error('Error loading training resources:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTrainingResources();
    setRefreshing(false);
  };

  const handleResourcePress = (resource: TrainingResource) => {
    // TODO: Navigate to resource viewer
    Alert.alert('Training Resource', `Opening ${resource.title}`);
  };

  const getResourceIcon = (type: string) => getResourceIconMaterial(type);

  const getResourceColor = (type: string) => {
    switch (type) {
      case 'video':
        return '#3B82F6';
      case 'document':
        return '#10B981';
      case 'quiz':
        return '#F59E0B';
      default:
        return colors.primary;
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

  const categories = ['all', 'crisis', 'mental-health', 'substance-abuse', 'sexual-health'];

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="h2" style={styles.headerTitle}>
              Training Resources
            </ThemedText>
            <View style={{ width: 24 }} />
          </View>

          {/* Category Filters */}
          <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: selectedCategory === category ? colors.primary : colors.surface,
                    },
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <ThemedText
                    type="small"
                    style={{
                      color: selectedCategory === category ? '#FFFFFF' : colors.text,
                      fontWeight: '600',
                    }}
                  >
                    {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Resources List */}
          <View style={styles.resourcesSection}>
            {resources.map((resource) => (
              <TouchableOpacity
                key={resource.id}
                style={[styles.resourceCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}
                onPress={() => handleResourcePress(resource)}
                activeOpacity={0.7}
              >
                <View style={styles.resourceHeader}>
                  <View
                    style={[
                      styles.resourceIcon,
                      { backgroundColor: getResourceColor(resource.type) + '20' },
                    ]}
                  >
                    <MaterialIcons
                      name={getResourceIcon(resource.type) as any}
                      size={24}
                      color={getResourceColor(resource.type)}
                    />
                  </View>
                  <View style={styles.resourceInfo}>
                    <View style={styles.resourceTitleRow}>
                      <ThemedText type="body" style={{ fontWeight: '600', color: colors.text, flex: 1 }}>
                        {resource.title}
                      </ThemedText>
                      {resource.certificate && (
                        <MaterialIcons name="verified" size={20} color={colors.success} />
                      )}
                    </View>
                    <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                      {resource.description}
                    </ThemedText>
                    {resource.duration && (
                      <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                        ⏱ {resource.duration}
                      </ThemedText>
                    )}
                  </View>
                  {resource.completed ? (
                    <MaterialIcons name="check-circle" size={24} color={colors.success} />
                  ) : (
                    <MaterialIcons name="play-circle-outline" size={24} color={colors.primary} />
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {resources.length === 0 && (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="school" size={64} color={colors.icon} />
                <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
                  No training resources available
                </ThemedText>
              </View>
            )}
          </View>
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
  filtersContainer: {
    marginBottom: Spacing.lg,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  resourcesSection: {
    marginBottom: Spacing.lg,
  },
  resourceCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  resourceIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
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


