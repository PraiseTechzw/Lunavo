/**
 * Loading Skeleton Component - For better perceived performance
 */

import { useState, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [fadeAnim] = useState(new Animated.Value(0.3));

  useEffect(() => {
    const fadeInOut = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    fadeInOut.start();

    return () => fadeInOut.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surface,
          opacity: fadeAnim,
        },
        style,
      ]}
    />
  );
}

interface PostSkeletonProps {
  count?: number;
}

export function PostSkeleton({ count = 3 }: PostSkeletonProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.postCard}>
          <View style={styles.postHeader}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <View style={styles.postHeaderText}>
              <Skeleton width={120} height={16} />
              <Skeleton width={80} height={12} style={{ marginTop: Spacing.xs }} />
            </View>
          </View>
          <Skeleton width="100%" height={20} style={{ marginTop: Spacing.md }} />
          <Skeleton width="90%" height={20} style={{ marginTop: Spacing.xs }} />
          <Skeleton width="70%" height={20} style={{ marginTop: Spacing.xs }} />
          <View style={styles.postFooter}>
            <Skeleton width={60} height={16} />
            <Skeleton width={80} height={16} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  postCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  postHeaderText: {
    flex: 1,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
});

