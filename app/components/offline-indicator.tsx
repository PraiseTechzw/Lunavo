/**
 * Offline Indicator Component
 */

import { useState, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { ThemedText } from './themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing } from '@/app/constants/theme';
// import { isOnline } from '@/lib/offline-support';

// Simplified version - in production, use actual network detection
const isOnline = async () => true;

export function OfflineIndicator() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [online, setOnline] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!online) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [online]);

  const checkConnection = async () => {
    const connected = await isOnline();
    setOnline(connected);
  };

  if (online) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.danger,
          opacity: fadeAnim,
        },
      ]}
    >
      <MaterialIcons name="cloud-off" size={16} color="#FFFFFF" />
      <ThemedText type="small" style={styles.text}>
        No Internet Connection
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

