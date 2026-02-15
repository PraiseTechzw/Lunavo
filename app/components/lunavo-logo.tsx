import { Colors } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
    Easing,
    useAnimatedProps,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface LunavoLogoProps {
    size?: number;
    style?: ViewStyle;
    animate?: boolean;
}

export const LunavoLogo: React.FC<LunavoLogoProps> = ({ size = 100, style, animate = true }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    // Animation values
    const rotation = useSharedValue(0);
    const pulse = useSharedValue(1);
    const starPulse = useSharedValue(1);

    useEffect(() => {
        if (animate) {
            // Gentle float/pulse for the moon
            pulse.value = withRepeat(
                withSequence(
                    withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );

            // Twinkle for the star
            starPulse.value = withRepeat(
                withSequence(
                    withTiming(1.2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );

            // Subtle rotation for background or aura
            rotation.value = withRepeat(
                withTiming(360, { duration: 20000, easing: Easing.linear }),
                -1,
                false
            );
        }
    }, [animate]);

    const animatedMoonProps = useAnimatedProps(() => ({
        transform: [
            { translateX: 50 },
            { translateY: 50 },
            { scale: pulse.value },
            { translateX: -50 },
            { translateY: -50 }
        ]
    }));

    const animatedStarProps = useAnimatedProps(() => ({
        transform: [
            { translateX: 72 }, // Position relative to star center (approx 72, 35)
            { translateY: 35 },
            { scale: starPulse.value },
            { translateX: -72 },
            { translateY: -35 }
        ]
    }));

    return (
        <View style={[styles.container, { width: size, height: size }, style]}>
            <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
                <Defs>
                    <LinearGradient id="lunavoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#818CF8" />
                        <Stop offset="100%" stopColor="#C084FC" />
                    </LinearGradient>
                    <LinearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#FDE047" />
                        <Stop offset="100%" stopColor="#F59E0B" />
                    </LinearGradient>
                </Defs>

                {/* Main Crescent Moon Shape */}
                <AnimatedPath
                    // M50 15 A35 35 0 1 1 50 85 A28 28 0 1 0 50 15 Z -- Roughly a crescent
                    d="M 55 15 A 35 35 0 1 1 55 85 A 28 28 0 1 0 55 15 Z"
                    fill="url(#lunavoGrad)"
                    // filter="url(#glow)" // React Native SVG filters are tricky, skip for now
                    animatedProps={animatedMoonProps}
                />

                {/* Companion Star/Sparkle */}
                <AnimatedPath
                    // 4-point star shape at roughly (72, 35)
                    d="M 72 28 L 74 33 L 79 35 L 74 37 L 72 42 L 70 37 L 65 35 L 70 33 Z"
                    fill="url(#starGrad)"
                    animatedProps={animatedStarProps}
                />

                {/* Optional Orbit Ring (Subtle) */}
                <AnimatedCircle
                    cx="50"
                    cy="50"
                    r="48"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    fill="none"
                />

            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
