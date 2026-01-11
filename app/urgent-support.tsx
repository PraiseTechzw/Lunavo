/**
 * Urgent Support & Crisis Resources Screen - Premium Version
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { startNewSupportSession } from '@/lib/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

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

export default function UrgentSupportScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const crisisResources: CrisisResource[] = [
    { id: '1', name: 'Emergency Services', number: '999', description: 'Police, Fire, Ambulance', type: 'emergency', available: '24/7', icon: 'alert-circle', color: colors.danger },
    { id: '5', name: 'Zimbabwe Lifeline', number: '+263 4 700 800', description: 'Crisis counseling', type: 'crisis', available: '24/7', icon: 'call', color: colors.warning },
    { id: '8', name: 'CUT Counseling', number: '+263 67 22203', description: 'Student Affairs (Ext. 1297)', type: 'campus', available: '8am-5pm', icon: 'school', color: colors.primary },
  ];

  const handleCall = (resource: CrisisResource) => {
    Alert.alert(`Call ${resource.name}?`, `Dialing ${resource.number}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => Linking.openURL(`tel:${resource.number}`) },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h1">Crisis Center</ThemedText>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Urgent Banner */}
          <Animated.View entering={FadeIn.duration(800)}>
            <LinearGradient
              colors={colors.gradients.danger as any}
              style={styles.urgentBanner}
            >
              <View style={styles.bannerInfo}>
                <ThemedText style={styles.bannerTitle}>Immediate Life Danger?</ThemedText>
                <ThemedText style={styles.bannerSub}>Get help right now. Every second counts.</ThemedText>
              </View>
              <TouchableOpacity
                style={styles.callNowBtn}
                onPress={() => handleCall(crisisResources[0])}
              >
                <ThemedText style={styles.callBtnText}>CALL 999</ThemedText>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>

          <View style={styles.section}>
            <ThemedText type="h2" style={styles.sectionTitle}>Main Helplines</ThemedText>
            {crisisResources.map((res, idx) => (
              <Animated.View key={res.id} entering={FadeInDown.delay(200 + idx * 100)}>
                <TouchableOpacity
                  style={[styles.resourceCard, { backgroundColor: colors.card }]}
                  onPress={() => handleCall(res)}
                >
                  <View style={[styles.iconBox, { backgroundColor: res.color + '15' }]}>
                    <Ionicons name={res.icon as any} size={24} color={res.color} />
                  </View>
                  <View style={styles.resInfo}>
                    <ThemedText type="h3">{res.name}</ThemedText>
                    <ThemedText type="small" style={{ color: colors.icon }}>{res.description}</ThemedText>
                  </View>
                  <View style={styles.callIcon}>
                    <Ionicons name="call" size={20} color={res.color} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Peer Chat Quick Action */}
          <Animated.View entering={FadeInDown.delay(500)}>
            <TouchableOpacity
              style={[styles.chatAction, { backgroundColor: colors.secondary + '10', borderColor: colors.secondary + '30' }]}
              onPress={async () => {
                try {
                  const session = await startNewSupportSession({
                    category: 'Crisis',
                    priority: 'urgent'
                  });
                  router.push(`/chat/${session.id}`);
                } catch (error) {
                  console.error('Error starting crisis chat:', error);
                  Alert.alert('Error', 'Failed to start a secure chat session.');
                }
              }}
            >
              <View style={styles.chatActionLeft}>
                <Ionicons name="chatbubbles" size={30} color={colors.secondary} />
                <View style={{ marginLeft: Spacing.md }}>
                  <ThemedText type="h3" style={{ color: colors.secondary }}>Anonymous Chat</ThemedText>
                  <ThemedText type="small" style={{ color: colors.icon }}>Talk to a trained peer educator now</ThemedText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark" size={24} color={colors.success} />
            <ThemedText style={styles.infoText}>
              This service is private and anonymous. Your identity is protected by end-to-end encryption.
            </ThemedText>
          </View>

          <View style={{ height: 40 }} />
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
    padding: Spacing.lg,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  urgentBanner: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    marginBottom: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...PlatformStyles.premiumShadow,
  },
  bannerInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  bannerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
  },
  bannerSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  callNowBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  callBtnText: {
    color: '#EF4444',
    fontWeight: '900',
    fontSize: 14,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.sm,
    ...PlatformStyles.shadow,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  resInfo: {
    flex: 1,
  },
  callIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  chatActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    opacity: 0.6,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
