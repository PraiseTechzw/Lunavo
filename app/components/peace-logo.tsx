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
    withSpring,
    withTiming
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

interface PEACELogoProps {
    size?: number;
    style?: ViewStyle;
    animate?: boolean;
}

export const PEACELogo: React.FC<PEACELogoProps> = ({ size = 100, style, animate = true }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    // Animation values
    const rotation = useSharedValue(0);
    const pulse = useSharedValue(1);
    const dashOffset = useSharedValue(280);

    useEffect(() => {
        if (animate) {
            // Continuous rotation for outer ring
            rotation.value = withRepeat(
                withTiming(360, { duration: 8000, easing: Easing.linear }),
                -1,
                false
            );

            // Gentle pulse for the heart
            pulse.value = withRepeat(
                withSequence(
                    withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );

            // Draw-in effect for the ring on mount
            dashOffset.value = withSpring(0, { damping: 12, stiffness: 80 });
        }
    }, [animate]);

    const animatedPathProps = useAnimatedProps(() => ({
        transform: [
            { translateX: 50 },
            { translateY: 45 },
            { scale: pulse.value },
            { translateX: -50 },
            { translateY: -45 }
        ]
    }));

    const animatedRingProps = useAnimatedProps(() => ({
        strokeDashoffset: dashOffset.value,
        transform: [
            { translateX: 50 },
            { translateY: 50 },
            { rotate: `${rotation.value}deg` },
            { translateX: -50 },
            { translateY: -50 }
        ]
    }));

    return (
        <View style={[styles.container, { width: size, height: size }, style]}>
            <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
                <Defs>
                    <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={colors.primary} />
                        <Stop offset="100%" stopColor={colors.secondary} />
                    </LinearGradient>
                </Defs>

                {/* Outer Ring - Animated connection */}
                <AnimatedCircle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="url(#grad)"
                    strokeWidth="8"
                    strokeDasharray="280"
                    strokeLinecap="round"
                    animatedProps={animatedRingProps}
                />

                {/* Inner Heart/Hand shape - Pulsing support */}
                <AnimatedPath
                    d="M50 75C50 75 25 60 25 40C25 25 40 20 50 35C60 20 75 25 75 40C75 60 50 75 50 75Z"
                    fill="url(#grad)"
                    opacity="0.9"
                    animatedProps={animatedPathProps}
                />

                {/* Center Point - The Hub */}
                <Circle cx="50" cy="45" r="6" fill="#FFF" />
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
