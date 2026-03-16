/**
 * Ultra-Premium Onboarding Redesign
 * Immersive 3D visuals, Mesh Gradients, and Advanced Reanimated Orchestration
 */

import { PEACELogo } from "@/components/peace-logo";
import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { createShadow } from "@/utils/platform-styles";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View, Image, Platform } from "react-native";
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const ONBOARDING_KEY = "@peaceclub:onboarding_complete";

const onboardingData = [
  {
    title: "Welcome to Lunavo",
    subtitle: "REDEFINING WELLNESS",
    description: "Your digital sanctuary for health, mental wellness, and global student community.",
    image: require("@/assets/images/onboarding/wellness_3d.png"),
    colors: ["#6366F1", "#8B5CF6", "#4F46E5"],
    accent: "#C7D2FE",
  },
  {
    title: "The Student Pulse",
    subtitle: "VOICE & SUPPORT",
    description: "The heart of Lunavo. Access anonymous sharing, peer guidance, and instant help.",
    image: require("@/assets/images/onboarding/student_3d.png"),
    colors: ["#10B981", "#059669", "#065F46"],
    accent: "#A7F3D0",
  },
  {
    title: "Guided Expertise",
    subtitle: "PROFESSIONAL CARE",
    description: "Direct access to Life Coaches and Professional Counselors when you need it most.",
    image: require("@/assets/images/onboarding/support_3d.png"),
    colors: ["#3B82F6", "#2563EB", "#1E40AF"],
    accent: "#BFDBFE",
  },
  {
    title: "Safe Haven",
    subtitle: "SECURITY & OVERSIGHT",
    description: "Moderated, secure, and governed to ensure your safety and privacy at all times.",
    image: require("@/assets/images/onboarding/shield_3d.png"),
    colors: ["#F59E0B", "#D97706", "#92400E"],
    accent: "#FDE68A",
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const scrollX = useSharedValue(0);
  const scrollRef = useRef<Animated.ScrollView>(null);
  
  // Mesh Gradient Blob Positions
  const b1 = useSharedValue({ x: width * 0.1, y: height * 0.1 });
  const b2 = useSharedValue({ x: width * 0.8, y: height * 0.2 });
  const b3 = useSharedValue({ x: width * 0.2, y: height * 0.7 });
  const b4 = useSharedValue({ x: width * 0.7, y: height * 0.8 });

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const animateBlob = (sv: any, targets: { x: number, y: number }[]) => {
      sv.value = withRepeat(
        withSequence(
          ...targets.map(t => withTiming(t, { duration: 8000 + Math.random() * 4000, easing: Easing.inOut(Easing.ease) }))
        ),
        -1,
        true
      );
    };

    animateBlob(b1, [{ x: width * 0.4, y: height * 0.3 }, { x: width * 0.1, y: height * 0.1 }]);
    animateBlob(b2, [{ x: width * 0.5, y: height * 0.05 }, { x: width * 0.8, y: height * 0.2 }]);
    animateBlob(b3, [{ x: width * 0.05, y: height * 0.5 }, { x: width * 0.2, y: height * 0.7 }]);
    animateBlob(b4, [{ x: width * 0.9, y: height * 0.6 }, { x: width * 0.7, y: height * 0.8 }]);
  }, []);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleNext = () => {
    if (activeIndex < onboardingData.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/auth/login");
  };

  const bgStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      scrollX.value,
      onboardingData.map((_, i) => i * width),
      onboardingData.map(item => item.colors[0])
    );
    return { backgroundColor };
  });

  return (
    <Animated.View style={[styles.container, bgStyle]}>
      <StatusBar style="light" />
      
      {/* Mesh Gradient Layer */}
      <View style={StyleSheet.absoluteFill}>
        <Blob style={b1} color="rgba(255,255,255,0.15)" size={400} />
        <Blob style={b2} color="rgba(255,255,255,0.1)" size={350} />
        <Blob style={b3} color="rgba(255,255,255,0.12)" size={450} />
        <Blob style={b4} color="rgba(255,255,255,0.08)" size={300} />
        {Platform.OS === 'ios' ? (
          (() => { const { BlurView } = require('expo-blur'); return <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />; })()
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
        )}
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={handleComplete}>
              <ThemedText style={styles.skipText}>SKIP</ThemedText>
            </TouchableOpacity>
        </View>

        <Animated.ScrollView
          ref={scrollRef as any}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        >
          {onboardingData.map((item, index) => (
            <OnboardingItem key={index} item={item} index={index} scrollX={scrollX} />
          ))}
        </Animated.ScrollView>

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {onboardingData.map((_, i) => (
              <Dot key={i} index={i} scrollX={scrollX} />
            ))}
          </View>

          <TouchableOpacity onPress={handleNext} activeOpacity={0.9} style={styles.buttonContainer}>
            <LinearGradient colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']} style={styles.button}>
              <ThemedText style={styles.buttonText}>
                {activeIndex === onboardingData.length - 1 ? "ENTER LUNAVO" : "CONTINUE"}
              </ThemedText>
              <Ionicons name={activeIndex === onboardingData.length - 1 ? "planet" : "arrow-forward"} size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

function Blob({ style, color, size }: any) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: style.value.x }, { translateY: style.value.y }],
  }));
  return <Animated.View style={[styles.blob, { backgroundColor: color, width: size, height: size, borderRadius: size / 2 }, animatedStyle]} />;
}

function Dot({ index, scrollX }: any) {
  const dotStyle = useAnimatedStyle(() => {
    const dotWidth = interpolate(scrollX.value, [(index - 1) * width, index * width, (index + 1) * width], [8, 32, 8], "clamp");
    const opacity = interpolate(scrollX.value, [(index - 1) * width, index * width, (index + 1) * width], [0.3, 1, 0.3], "clamp");
    return { width: dotWidth, opacity };
  });
  return <Animated.View style={[styles.dot, dotStyle]} />;
}

function OnboardingItem({ item, index, scrollX }: any) {
  const imageStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollX.value, [(index - 0.5) * width, index * width, (index + 0.5) * width], [0.4, 1, 0.4], "clamp");
    const rotate = interpolate(scrollX.value, [(index - 0.5) * width, index * width, (index + 0.5) * width], [-15, 0, 15], "clamp");
    const translateY = interpolate(scrollX.value, [(index - 0.5) * width, index * width, (index + 0.5) * width], [100, 0, 100], "clamp");
    return { transform: [{ scale }, { rotate: `${rotate}deg` }, { translateY }] };
  });

  const textStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollX.value, [(index - 0.3) * width, index * width, (index + 0.3) * width], [0, 1, 0], "clamp");
    const translateY = interpolate(scrollX.value, [(index - 0.3) * width, index * width, (index + 0.3) * width], [20, 0, 20], "clamp");
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <View style={styles.page}>
      <Animated.View style={[styles.imageContainer, imageStyle]}>
        <Image source={item.image} style={styles.heroImage} resizeMode="contain" />
      </Animated.View>

      <Animated.View style={[styles.textContainer, textStyle]}>
        <ThemedText style={[styles.subtitle, { color: item.accent }]}>{item.subtitle}</ThemedText>
        <ThemedText style={styles.title}>{item.title}</ThemedText>
        <ThemedText style={styles.description}>{item.description}</ThemedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  blob: { position: 'absolute' },
  header: { 
    paddingHorizontal: 30, 
    paddingTop: 20, 
    alignItems: 'flex-end' 
  },
  skipText: { 
    color: 'rgba(255,255,255,0.6)', 
    fontSize: 12, 
    fontWeight: '900', 
    letterSpacing: 2 
  },
  page: { width, alignItems: 'center', justifyContent: 'center', padding: 40 },
  imageContainer: { 
    width: width * 0.8, 
    height: width * 0.8, 
    marginBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: { width: '100%', height: '100%' },
  textContainer: { alignItems: 'center' },
  subtitle: { 
    fontSize: 12, 
    fontWeight: '900', 
    letterSpacing: 4, 
    marginBottom: 10,
    textAlign: 'center',
  },
  title: { 
    color: '#FFF', 
    fontSize: 36, 
    fontWeight: '900', 
    textAlign: 'center', 
    lineHeight: 42,
    marginBottom: 20 
  },
  description: { 
    color: 'rgba(255,255,255,0.7)', 
    fontSize: 16, 
    textAlign: 'center', 
    lineHeight: 24,
    fontWeight: '500'
  },
  footer: { 
    padding: 40, 
    alignItems: 'center' 
  },
  pagination: { 
    flexDirection: 'row', 
    height: 8, 
    marginBottom: 40 
  },
  dot: { 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: '#FFF', 
    marginHorizontal: 4 
  },
  buttonContainer: { width: '100%' },
  button: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 18, 
    borderRadius: 24, 
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});
