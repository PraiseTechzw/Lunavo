/**
 * Enhanced Onboarding/Welcome screens
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { createShadow } from '@/app/utils/platform-styles';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const ONBOARDING_KEY = "@peaceclub:onboarding_complete";

const onboardingData: Array<{
  title: string;
  subtitle: string;
  description: string;
  illustration: any;
  illustrationType: "image" | "icon";
  gradient: [string, string];
  iconColor: string;
}> = [
    {
      title: "PEACE Platform",
      subtitle: "Peer Education Club",
      description: "Empowering student wellness through peer support and community advocacy.",
      illustration: require('@/assets/images/onboarding/welcome.jpg'),
      illustrationType: "image" as const,
      gradient: ["#E8F5E9", "#C8E6C9"],
      iconColor: "#4CAF50",
    },
    {
      title: "Peer Support",
      subtitle: "You're Not Alone",
      description: "Connect with students who understand what you're going through.",
      illustration: "chatbubbles",
      illustrationType: "icon" as const,
      gradient: ["#E3F2FD", "#BBDEFB"],
      iconColor: "#2196F3",
    },
    {
      title: "Privacy First",
      subtitle: "Your Identity Protected",
      description: "Share freely without fear. Your privacy is our priority.",
      illustration: "lock-closed",
      illustrationType: "icon" as const,
      gradient: ["#F3E5F5", "#E1BEE7"],
      iconColor: "#9C27B0",
    },
  ];

export default function OnboardingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Fade in animation when page changes
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentPage]);

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      scrollViewRef.current?.scrollTo({
        x: nextPage * width,
        animated: true,
      });
    } else {
      handleComplete();
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(tabs)');
  };

  const handleComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(tabs)');
  };

  const handlePageChange = (event: any) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / width);
    if (page !== currentPage) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      setCurrentPage(page);
    }
  };

  const currentData = onboardingData[currentPage];

  return (
    <ThemedView style={styles.container}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentPage + 1) / onboardingData.length) * 100}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
        </View>

        {/* Skip Button */}
        {currentPage < onboardingData.length - 1 && (
          <TouchableOpacity
            style={styles.skipButtonTop}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <ThemedText type="small" style={[styles.skipTextTop, { color: colors.icon }]}>
              Skip
            </ThemedText>
          </TouchableOpacity>
        )}
      </SafeAreaView>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handlePageChange}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={width}
        snapToAlignment="center"
        contentContainerStyle={styles.scrollContent}
      >
        {onboardingData.map((item, index) => (
          <View key={index} style={[styles.page, { width }]}>
            <Animated.View
              style={[
                styles.contentWrapper,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Illustration Container */}
              <View
                style={[
                  styles.illustrationContainer,
                  {
                    backgroundColor: item.gradient[0],
                  },
                  createShadow(8, '#000', 0.1),
                ]}
              >
                {item.illustrationType === 'image' ? (
                  typeof item.illustration === 'string' ? (
                    <ExpoImage
                      source={{ uri: item.illustration }}
                      style={styles.illustrationImage}
                      contentFit="cover"
                      transition={300}
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <Image
                      source={item.illustration}
                      style={styles.illustrationImage}
                      resizeMode="cover"
                    />
                  )
                ) : (
                  <View style={[styles.iconWrapper, { backgroundColor: item.iconColor + '20' }]}>
                    <Ionicons
                      name={item.illustration as any}
                      size={110}
                      color={item.iconColor}
                    />
                  </View>
                )}

                {/* Decorative Elements */}
                <View style={[styles.decorativeCircle1, { backgroundColor: item.iconColor + '15' }]} />
                <View style={[styles.decorativeCircle2, { backgroundColor: item.iconColor + '10' }]} />
              </View>

              {/* Content */}
              <View style={styles.content}>
                <View style={styles.titleContainer}>
                  <ThemedText type="h1" style={styles.title}>
                    {item.title}
                  </ThemedText>
                  <View style={[styles.titleUnderline, { backgroundColor: colors.primary + '30' }]} />
                </View>

                <ThemedText type="h2" style={[styles.subtitle, { color: colors.primary }]}>
                  {item.subtitle}
                </ThemedText>

                <ThemedText type="body" style={[styles.description, { color: colors.icon }]}>
                  {item.description}
                </ThemedText>
              </View>
            </Animated.View>
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <SafeAreaView edges={['bottom']} style={[styles.footer, { backgroundColor: colors.background }]}>
        {/* Dots Indicator */}
        <View style={styles.dots}>
          {onboardingData.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                fadeAnim.setValue(0);
                scaleAnim.setValue(0.8);
                setCurrentPage(index);
                scrollViewRef.current?.scrollTo({
                  x: index * width,
                  animated: true,
                });
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      index === currentPage ? colors.primary : colors.border,
                    width: index === currentPage ? 32 : 8,
                    height: 8,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: colors.primary },
              createShadow(4, colors.primary, 0.3),
            ]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <ThemedText type="body" style={[styles.nextButtonText, { color: '#FFFFFF' }]}>
              {currentPage === onboardingData.length - 1 ? 'Get Started' : 'Continue'}
            </ThemedText>
            <Ionicons
              name={currentPage === onboardingData.length - 1 ? 'checkmark-circle' : 'arrow-forward'}
              size={22}
              color="#FFFFFF"
              style={{ marginLeft: Spacing.xs }}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  safeAreaTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  progressContainer: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  skipButtonTop: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.lg,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  skipTextTop: {
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: 200,
  },
  contentWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  illustrationContainer: {
    width: Math.min(width * 0.8, 340),
    height: Math.min(width * 0.8, 340),
    maxWidth: 340,
    maxHeight: 340,
    borderRadius: BorderRadius.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl + Spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.xl * 2,
    backgroundColor: 'transparent',
  },
  iconWrapper: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -50,
    right: -50,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    bottom: -30,
    left: -30,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    width: '100%',
    maxWidth: 400,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
    fontWeight: '800',
    fontSize: 36,
    letterSpacing: -1,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    borderRadius: 2,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  subtitle: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 20,
    letterSpacing: 0.3,
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
    marginTop: Spacing.md,
    fontSize: 17,
    paddingHorizontal: Spacing.lg,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  dot: {
    borderRadius: 4,
  },
  buttonContainer: {
    width: '100%',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: Spacing.md + 4,
    borderRadius: BorderRadius.lg,
  },
  nextButtonText: {
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.5,
  },
});
