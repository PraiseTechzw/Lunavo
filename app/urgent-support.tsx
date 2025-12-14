/**
 * Urgent Support & Crisis Resources Screen
 * Comprehensive crisis support with one-tap calling, chat, and resources
 */

import { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { createShadow, getCursorStyle } from '@/utils/platform-styles';

interface CrisisResource {
  id: string;
  name: string;
  number: string;
  description: string;
  type: 'emergency' | 'crisis' | 'counseling' | 'campus';
  available: string;
  icon: string;
  color: string;
}

const crisisResources: CrisisResource[] = [
  {
    id: '1',
    name: 'Emergency Services',
    number: '999',
    description: 'Police, Fire, Ambulance (Zimbabwe)',
    type: 'emergency',
    available: '24/7',
    icon: 'emergency',
    color: '#EF4444',
  },
  {
    id: '2',
    name: 'Police Emergency',
    number: '995',
    description: 'Zimbabwe Republic Police',
    type: 'emergency',
    available: '24/7',
    icon: 'security',
    color: '#EF4444',
  },
  {
    id: '3',
    name: 'Ambulance',
    number: '994',
    description: 'Medical Emergency Services',
    type: 'emergency',
    available: '24/7',
    icon: 'medical-services',
    color: '#EF4444',
  },
  {
    id: '4',
    name: 'FIRE Emergency',
    number: '993',
    description: 'Fire & Rescue Services',
    type: 'emergency',
    available: '24/7',
    icon: 'local-fire-department',
    color: '#EF4444',
  },
  {
    id: '5',
    name: 'Zimbabwe Lifeline',
    number: '+263 4 700 800',
    description: 'Crisis counseling & suicide prevention',
    type: 'crisis',
    available: '24/7',
    icon: 'support-agent',
    color: '#F59E0B',
  },
  {
    id: '6',
    name: 'Mental Health Helpline',
    number: '+263 4 700 800',
    description: 'Mental health support & counseling',
    type: 'crisis',
    available: '24/7',
    icon: 'psychology',
    color: '#8B5CF6',
  },
  {
    id: '7',
    name: 'Childline Zimbabwe',
    number: '116',
    description: 'Child protection & support',
    type: 'counseling',
    available: '24/7',
    icon: 'child-care',
    color: '#10B981',
  },
  {
    id: '8',
    name: 'CUT Counseling Services',
    number: '+263 67 22203-5',
    description: 'Division of Student Affairs - Life Skills Section (Ext. 1297)',
    type: 'campus',
    available: 'Mon-Fri 8am-5pm',
    icon: 'school',
    color: '#3B82F6',
  },
  {
    id: '9',
    name: 'CUT Emergency',
    number: '+263 67 22203-5',
    description: 'Campus security & emergency services',
    type: 'campus',
    available: '24/7',
    icon: 'security',
    color: '#10B981',
  },
  {
    id: '11',
    name: 'CUT Drug & Substance Abuse Section',
    number: '+263 67 22203-5',
    description: 'Student Affairs - Drug & Substance Abuse Section (Ext. 1297)',
    type: 'campus',
    available: 'Mon-Fri 8am-5pm',
    icon: 'medical-services',
    color: '#EC4899',
  },
  {
    id: '10',
    name: 'Zimbabwe National AIDS Council',
    number: '+263 4 791 000',
    description: 'HIV/AIDS support & counseling',
    type: 'counseling',
    available: 'Mon-Fri 8am-5pm',
    icon: 'favorite',
    color: '#EC4899',
  },
];

const quickActions = [
  {
    id: 'chat',
    title: 'Chat with Counselor',
    description: 'Connect with a trained counselor instantly',
    icon: 'chat' as const,
    color: '#3B82F6',
    action: 'chat',
  },
  {
    id: 'safety',
    title: 'Safety Planning',
    description: 'Create a personalized safety plan',
    icon: 'shield' as const,
    color: '#10B981',
    action: 'safety',
  },
  {
    id: 'resources',
    title: 'Crisis Resources',
    description: 'Access helpful guides and information',
    icon: 'menu-book' as const,
    color: '#8B5CF6',
    action: 'resources',
  },
  {
    id: 'self-care',
    title: 'Self-Care Tools',
    description: 'Breathing exercises and grounding techniques',
    icon: 'self-improvement' as const,
    color: '#F59E0B',
    action: 'self-care',
  },
];

export default function UrgentSupportScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handleCall = (resource: CrisisResource) => {
    Alert.alert(
      `Call ${resource.name}?`,
      `This will call ${resource.number}\n\n${resource.description}\nAvailable: ${resource.available}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            const phoneNumber = Platform.select({
              ios: `telprompt:${resource.number}`,
              android: `tel:${resource.number}`,
              default: `tel:${resource.number}`,
            });
            Linking.openURL(phoneNumber).catch((err) => {
              Alert.alert('Error', 'Unable to make call. Please dial manually.');
              console.error('Error calling:', err);
            });
          },
        },
      ]
    );
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'chat':
        router.push('/chat/crisis');
        break;
      case 'safety':
        Alert.alert(
          'Safety Planning',
          'Safety planning helps you identify warning signs and create a plan for when you\'re in crisis. Would you like to create a safety plan?',
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Create Plan', onPress: () => router.push('/safety-plan') },
          ]
        );
        break;
      case 'resources':
        router.push('/(tabs)/resources?filter=crisis');
        break;
      case 'self-care':
        router.push('/self-care');
        break;
    }
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
            Urgent Support
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Emergency Banner */}
          <View style={[styles.emergencyBanner, { backgroundColor: colors.danger + '20' }]}>
            <MaterialIcons name="emergency" size={32} color={colors.danger} />
            <View style={styles.bannerContent}>
              <ThemedText type="h3" style={[styles.bannerTitle, { color: colors.danger }]}>
                In Immediate Danger?
              </ThemedText>
              <ThemedText type="body" style={[styles.bannerText, { color: colors.text }]}>
                Call Emergency Services at 999 right away
              </ThemedText>
            </View>
            <TouchableOpacity
              style={[styles.emergencyButton, { backgroundColor: colors.danger }]}
              onPress={() => handleCall(crisisResources[0])}
              activeOpacity={0.8}
            >
              <MaterialIcons name="phone" size={20} color="#FFFFFF" />
              <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '700', marginLeft: 4 }}>
                CALL 999
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Quick Actions
            </ThemedText>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.quickActionCard,
                    { backgroundColor: colors.card },
                    createShadow(2, '#000', 0.1),
                  ]}
                  onPress={() => handleQuickAction(action.action)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                    <MaterialIcons name={action.icon} size={28} color={action.color} />
                  </View>
                  <ThemedText type="body" style={styles.quickActionTitle}>
                    {action.title}
                  </ThemedText>
                  <ThemedText type="small" style={[styles.quickActionDesc, { color: colors.icon }]}>
                    {action.description}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Emergency Services */}
          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Emergency Services
            </ThemedText>
            {crisisResources
              .filter((r) => r.type === 'emergency')
              .map((resource) => (
                <TouchableOpacity
                  key={resource.id}
                  style={[
                    styles.resourceCard,
                    { backgroundColor: colors.card },
                    createShadow(2, '#000', 0.1),
                  ]}
                  onPress={() => handleCall(resource)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.resourceIcon, { backgroundColor: resource.color + '20' }]}>
                    <MaterialIcons name={resource.icon as any} size={24} color={resource.color} />
                  </View>
                  <View style={styles.resourceContent}>
                    <ThemedText type="h3" style={styles.resourceName}>
                      {resource.name}
                    </ThemedText>
                    <ThemedText type="body" style={[styles.resourceDesc, { color: colors.icon }]}>
                      {resource.description}
                    </ThemedText>
                    <ThemedText type="small" style={[styles.resourceAvailable, { color: colors.icon }]}>
                      Available: {resource.available}
                    </ThemedText>
                  </View>
                  <View style={styles.resourceAction}>
                    <MaterialIcons name="phone" size={24} color={resource.color} />
                    <ThemedText type="body" style={[styles.resourceNumber, { color: resource.color }]}>
                      {resource.number}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
          </View>

          {/* Crisis Helplines */}
          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Crisis Helplines
            </ThemedText>
            {crisisResources
              .filter((r) => r.type === 'crisis')
              .map((resource) => (
                <TouchableOpacity
                  key={resource.id}
                  style={[
                    styles.resourceCard,
                    { backgroundColor: colors.card },
                    createShadow(2, '#000', 0.1),
                  ]}
                  onPress={() => handleCall(resource)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.resourceIcon, { backgroundColor: resource.color + '20' }]}>
                    <MaterialIcons name={resource.icon as any} size={24} color={resource.color} />
                  </View>
                  <View style={styles.resourceContent}>
                    <ThemedText type="h3" style={styles.resourceName}>
                      {resource.name}
                    </ThemedText>
                    <ThemedText type="body" style={[styles.resourceDesc, { color: colors.icon }]}>
                      {resource.description}
                    </ThemedText>
                    <ThemedText type="small" style={[styles.resourceAvailable, { color: colors.icon }]}>
                      Available: {resource.available}
                    </ThemedText>
                  </View>
                  <View style={styles.resourceAction}>
                    <MaterialIcons name="phone" size={24} color={resource.color} />
                    <ThemedText type="body" style={[styles.resourceNumber, { color: resource.color }]}>
                      {resource.number}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
          </View>

          {/* Campus Resources */}
          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Campus Resources
            </ThemedText>
            {crisisResources
              .filter((r) => r.type === 'campus')
              .map((resource) => (
                <TouchableOpacity
                  key={resource.id}
                  style={[
                    styles.resourceCard,
                    { backgroundColor: colors.card },
                    createShadow(2, '#000', 0.1),
                  ]}
                  onPress={() => handleCall(resource)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.resourceIcon, { backgroundColor: resource.color + '20' }]}>
                    <MaterialIcons name={resource.icon as any} size={24} color={resource.color} />
                  </View>
                  <View style={styles.resourceContent}>
                    <ThemedText type="h3" style={styles.resourceName}>
                      {resource.name}
                    </ThemedText>
                    <ThemedText type="body" style={[styles.resourceDesc, { color: colors.icon }]}>
                      {resource.description}
                    </ThemedText>
                    <ThemedText type="small" style={[styles.resourceAvailable, { color: colors.icon }]}>
                      Available: {resource.available}
                    </ThemedText>
                  </View>
                  <View style={styles.resourceAction}>
                    <MaterialIcons name="phone" size={24} color={resource.color} />
                    <ThemedText type="body" style={[styles.resourceNumber, { color: resource.color }]}>
                      {resource.number}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
          </View>

          {/* Additional Resources */}
          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Additional Support
            </ThemedText>
            {crisisResources
              .filter((r) => r.type === 'counseling')
              .map((resource) => (
                <TouchableOpacity
                  key={resource.id}
                  style={[
                    styles.resourceCard,
                    { backgroundColor: colors.card },
                    createShadow(2, '#000', 0.1),
                  ]}
                  onPress={() => handleCall(resource)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.resourceIcon, { backgroundColor: resource.color + '20' }]}>
                    <MaterialIcons name={resource.icon as any} size={24} color={resource.color} />
                  </View>
                  <View style={styles.resourceContent}>
                    <ThemedText type="h3" style={styles.resourceName}>
                      {resource.name}
                    </ThemedText>
                    <ThemedText type="body" style={[styles.resourceDesc, { color: colors.icon }]}>
                      {resource.description}
                    </ThemedText>
                    <ThemedText type="small" style={[styles.resourceAvailable, { color: colors.icon }]}>
                      Available: {resource.available}
                    </ThemedText>
                  </View>
                  <View style={styles.resourceAction}>
                    <MaterialIcons name="phone" size={24} color={resource.color} />
                    <ThemedText type="body" style={[styles.resourceNumber, { color: resource.color }]}>
                      {resource.number}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
          </View>

          {/* Important Notice */}
          <View style={[styles.noticeCard, { backgroundColor: colors.info + '20' }]}>
            <MaterialIcons name="info" size={24} color={colors.info} />
            <View style={styles.noticeContent}>
              <ThemedText type="body" style={[styles.noticeTitle, { color: colors.info }]}>
                Remember
              </ThemedText>
              <ThemedText type="small" style={[styles.noticeText, { color: colors.text }]}>
                You are not alone. Reaching out for help is a sign of strength. All services are
                confidential and free.
              </ThemedText>
            </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  bannerText: {
    fontSize: 14,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  quickActionCard: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionTitle: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  quickActionDesc: {
    fontSize: 12,
    textAlign: 'center',
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
  resourceName: {
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  resourceDesc: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  resourceAvailable: {
    fontSize: 12,
  },
  resourceAction: {
    alignItems: 'center',
  },
  resourceNumber: {
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  noticeCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 20,
  },
});

