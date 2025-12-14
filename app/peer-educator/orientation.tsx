/**
 * Orientation Materials - For new peer educators
 */

import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { createShadow, getCursorStyle } from '@/utils/platform-styles';
import { getResources, getCurrentUser } from '@/lib/database';
import { PostCategory } from '@/types';
import { useRoleGuard } from '@/hooks/use-auth-guard';

interface OrientationModule {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'document' | 'quiz';
  duration?: string;
  completed: boolean;
  progress: number;
}

export default function OrientationScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user, loading: authLoading } = useRoleGuard(
    ['peer-educator', 'peer-educator-executive', 'admin'],
    '/(tabs)'
  );
  
  const [refreshing, setRefreshing] = useState(false);
  const [modules, setModules] = useState<OrientationModule[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (user) {
      loadOrientationData();
    }
  }, [user]);

  const loadOrientationData = async () => {
    try {
      // Mock orientation modules - in production, these would come from database
      const orientationModules: OrientationModule[] = [
        {
          id: '1',
          title: 'Welcome to Peer Educator Club',
          description: 'Introduction to the club, its mission, and your role as a peer educator.',
          type: 'video',
          duration: '15 min',
          completed: false,
          progress: 0,
        },
        {
          id: '2',
          title: 'Active Listening Skills',
          description: 'Learn essential active listening techniques for supporting students.',
          type: 'video',
          duration: '20 min',
          completed: false,
          progress: 0,
        },
        {
          id: '3',
          title: 'Crisis Recognition',
          description: 'How to identify and respond to crisis situations.',
          type: 'video',
          duration: '25 min',
          completed: false,
          progress: 0,
        },
        {
          id: '4',
          title: 'Platform Guidelines',
          description: 'Understanding the platform rules, anonymity, and escalation procedures.',
          type: 'document',
          duration: '10 min',
          completed: false,
          progress: 0,
        },
        {
          id: '5',
          title: 'Orientation Quiz',
          description: 'Test your understanding of peer educator responsibilities.',
          type: 'quiz',
          duration: '15 min',
          completed: false,
          progress: 0,
        },
      ];

      setModules(orientationModules);
      
      // Calculate overall progress
      const completedCount = orientationModules.filter((m) => m.completed).length;
      setProgress((completedCount / orientationModules.length) * 100);
    } catch (error) {
      console.error('Error loading orientation data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrientationData();
    setRefreshing(false);
  };

  const handleModulePress = (module: OrientationModule) => {
    // TODO: Navigate to module detail/viewer
    Alert.alert('Module', `Opening ${module.title}`);
  };

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'video':
        return 'play-circle-filled';
      case 'document':
        return 'description';
      case 'quiz':
        return 'quiz';
      default:
        return 'article';
    }
  };

  const getModuleColor = (type: string) => {
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
              Orientation
            </ThemedText>
            <View style={{ width: 24 }} />
          </View>

          {/* Progress Card */}
          <View style={[styles.progressCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <View style={styles.progressHeader}>
              <MaterialIcons name="school" size={32} color={colors.primary} />
              <View style={styles.progressInfo}>
                <ThemedText type="h3" style={{ color: colors.text }}>
                  Orientation Progress
                </ThemedText>
                <ThemedText type="body" style={{ color: colors.icon }}>
                  {Math.round(progress)}% Complete
                </ThemedText>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
          </View>

          {/* Modules List */}
          <View style={styles.modulesSection}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Orientation Modules
            </ThemedText>
            {modules.map((module) => (
              <TouchableOpacity
                key={module.id}
                style={[styles.moduleCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}
                onPress={() => handleModulePress(module)}
                activeOpacity={0.7}
              >
                <View style={styles.moduleHeader}>
                  <View
                    style={[
                      styles.moduleIcon,
                      { backgroundColor: getModuleColor(module.type) + '20' },
                    ]}
                  >
                    <MaterialIcons
                      name={getModuleIcon(module.type) as any}
                      size={24}
                      color={getModuleColor(module.type)}
                    />
                  </View>
                  <View style={styles.moduleInfo}>
                    <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }}>
                      {module.title}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                      {module.description}
                    </ThemedText>
                    {module.duration && (
                      <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                        ⏱ {module.duration}
                      </ThemedText>
                    )}
                  </View>
                  {module.completed ? (
                    <MaterialIcons name="check-circle" size={24} color={colors.success} />
                  ) : (
                    <MaterialIcons name="play-circle-outline" size={24} color={colors.primary} />
                  )}
                </View>
                {module.progress > 0 && !module.completed && (
                  <View style={styles.moduleProgressBar}>
                    <View
                      style={[
                        styles.moduleProgressFill,
                        {
                          width: `${module.progress}%`,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>
                )}
              </TouchableOpacity>
            ))}
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
  progressCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  modulesSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  moduleCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  moduleIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleProgressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  moduleProgressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
});

