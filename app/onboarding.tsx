/**
 * Premium Onboarding Screen
 * Uses Glassmorphism, Reanimated, and Haptic feedback
 */

import { PEACELogo } from '@/app/components/peace-logo';
import { ThemedText } from '@/app/components/themed-text';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { createShadow } from '@/app/utils/platform-styles';
import { getUserCount } from '@/lib/database';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const ONBOARDING_KEY = "@peaceclub:onboarding_complete";

const onboardingData = [
  {
    title: "Welcome to PEACE",
    subtitle: "Peer Education Club",
    description: "Your digital community for health, mental wellness, and peer-to-peer support. Built by students, for students.",
    icon: "heart-outline",
    type: 'logo',
    colors: ['#6366F1', '#8B5CF6'],
  },
  {
    title: "1. The Student",
    subtitle: "The Core Heart",
    description: "The foundation of PEACE. Access a safe community, anonymous sharing, and instant resources whenever you need them.",
    icon: "person-outline",
    illustration: require('@/assets/images/onboarding/welcome.png'),
    colors: ['#4CAF50', '#81C784'],
  },
  {
    title: "2. Peer Educators",
    subtitle: "Frontline Support",
    description: "Verified students trained to provide first-line guidance, mental health awareness, and club activity leadership.",
    icon: "school-outline",
    illustration: require('@/assets/images/onboarding/support.png'),
    colors: ['#2196F3', '#64B5F6'],
  },
  {
    title: "3. Life Coaches",
    subtitle: "Professional Guidance",
    description: "Experts dedicated to your personal growth, providing life skills training and developmental coaching.",
    icon: "star-outline",
    illustration: require('@/assets/images/onboarding/mentorship.png'),
    colors: ['#3F51B5', '#7986CB'],
  },
  {
    title: "4. Counselors",
    subtitle: "Specialized Intervention",
    description: "Licensed psychologists and therapists ready to provide professional intervention for deeper emotional needs.",
    icon: "medical-outline",
    illustration: require('@/assets/images/onboarding/privacy.png'),
    colors: ['#9C27B0', '#BA68C8'],
  },
  {
    title: "5. Moderators",
    subtitle: "Community Protectors",
    description: "Guardians of our digital space ensuring safety, privacy, and adherence to community guidelines.",
    icon: "shield-half-outline",
    colors: ['#FFC107', '#FFD54F'],
  },
  {
    title: "6. PE Executives",
    subtitle: "System Orchestrators",
    description: "Elected student leaders managing operations and coordinating the entire Peer Education network.",
    icon: "briefcase-outline",
    colors: ['#009688', '#4DB6AC'],
  },
  {
    title: "8. Admin & Affairs",
    subtitle: "Global Oversight",
    description: "Institutional governance ensuring system integrity and data-driven wellness strategies for the university.",
    icon: "planet-outline",
    colors: ['#FF5722', '#FF8A65'],
  },
];

const ONBOARDING_ITEM_WIDTH = width;

export default function OnboardingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const scrollX = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFoundingMember, setIsFoundingMember] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const count = await getUserCount();
        if (count < 8) setIsFoundingMember(true);
      } catch (e) {
        // Silently fail if DB is unavailable
      }
    };
    checkStatus();
  }, []);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleNext = () => {
    if (activeIndex < onboardingData.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Manual scroll would trigger onScroll
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(tabs)');
  };

  const backgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      scrollX.value,
      onboardingData.map((_, i) => i * width),
      onboardingData.map((item) => item.colors[0])
    );
    return { backgroundColor };
  });

  return (
    <Animated.View style={[styles.container, backgroundStyle]}>
      <StatusBar style="light" />

      {/* Animated Blobs */}
      <View style={styles.blobContainer}>
        <View style={[styles.blob, { top: -50, right: -50, backgroundColor: 'rgba(255,255,255,0.2)' }]} />
        <View style={[styles.blob, { bottom: 100, left: -100, width: 300, height: 300, backgroundColor: 'rgba(255,255,255,0.1)' }]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <Animated.ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setActiveIndex(index);
          }}
        >
          {onboardingData.map((item, index) => (
            <OnboardingItem
              key={index}
              item={item}
              index={index}
              scrollX={scrollX}
              colors={colors}
            />
          ))}
        </Animated.ScrollView>

        <View style={styles.footer}>
          {/* Pagination */}
          <View style={styles.pagination}>
            {onboardingData.map((_, i) => {
              const dotStyle = useAnimatedStyle(() => {
                const dotWidth = interpolate(
                  scrollX.value,
                  [(i - 1) * width, i * width, (i + 1) * width],
                  [8, 24, 8],
                  'clamp'
                );
                const opacity = interpolate(
                  scrollX.value,
                  [(i - 1) * width, i * width, (i + 1) * width],
                  [0.5, 1, 0.5],
                  'clamp'
                );
                return { width: dotWidth, opacity };
              });
              return <Animated.View key={i} style={[styles.dot, dotStyle]} />;
            })}
          </View>

          {/* Button */}
          <TouchableOpacity
            onPress={activeIndex === onboardingData.length - 1 ? handleComplete : undefined}
            activeOpacity={0.8}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.mainButton}
            >
              <ThemedText style={styles.buttonText}>
                {activeIndex === onboardingData.length - 1 ? "Start Journey" : "Swipe to Continue"}
              </ThemedText>
              <Ionicons
                name={activeIndex === onboardingData.length - 1 ? "rocket" : "arrow-forward"}
                size={20}
                color="#FFF"
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

function OnboardingItem({ item, index, scrollX, colors }: any) {
  const contentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      [(index - 0.5) * width, index * width, (index + 0.5) * width],
      [0, 1, 0],
      'clamp'
    );
    const translateY = interpolate(
      scrollX.value,
      [(index - 0.5) * width, index * width, (index + 0.5) * width],
      [50, 0, 50],
      'clamp'
    );
    return { opacity, transform: [{ translateY }] };
  });

  const iconStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      [(index - 0.5) * width, index * width, (index + 0.5) * width],
      [0.5, 1, 0.5],
      'clamp'
    );
    const rotate = interpolate(
      scrollX.value,
      [(index - 0.5) * width, index * width, (index + 0.5) * width],
      [-30, 0, 30],
      'clamp'
    );
    return { transform: [{ scale }, { rotate: `${rotate}deg` }] };
  });

  const imageStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      [(index - 0.5) * width, index * width, (index + 0.5) * width],
      [1.2, 1, 1.2],
      'clamp'
    );
    return { transform: [{ scale }] };
  });

  return (
    <View style={[styles.page, { width }]}>
      <Animated.View style={[styles.glassCard, contentStyle]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
          style={styles.glassGradient}
        >
          <View style={styles.imageWrapper}>
            {item.type === 'logo' ? (
              <View style={styles.logoWrapper}>
                <PEACELogo size={180} />
                {item.type === 'logo' && index === 0 && (
                  <View style={styles.founderBadge}>
                    <ThemedText style={styles.founderText}>FOUNDING PIONEER</ThemedText>
                  </View>
                )}
              </View>
            ) : item.illustration ? (
              <Animated.Image
                source={item.illustration}
                style={[styles.illustration, imageStyle]}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.iconFallback}>
                <Animated.View style={iconStyle}>
                  <Ionicons name={item.icon} size={120} color="#FFF" />
                </Animated.View>
              </View>
            )}
            {item.illustration && (
              <Animated.View style={[styles.miniIcon, iconStyle]}>
                <Ionicons name={item.icon} size={30} color="#FFF" />
              </Animated.View>
            )}
          </View>

          <ThemedText style={styles.itemSubtitle}>{item.subtitle}</ThemedText>
          <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
          <View style={styles.divider} />
          <ThemedText style={styles.itemDescription}>{item.description}</ThemedText>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  blobContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  page: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  glassCard: {
    width: '100%',
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    ...createShadow(20, '#000', 0.2),
  },
  glassGradient: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: 240,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  miniIcon: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logoWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  itemSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  itemTitle: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  divider: {
    width: 40,
    height: 4,
    backgroundColor: '#FFF',
    borderRadius: 2,
    marginBottom: Spacing.xl,
    opacity: 0.5,
  },
  itemDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    height: 8,
    marginBottom: Spacing.xxl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    marginHorizontal: 4,
  },
  buttonWrapper: {
    width: '100%',
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: Spacing.sm,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  founderBadge: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  founderText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

