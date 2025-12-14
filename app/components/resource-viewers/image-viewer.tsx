/**
 * Professional Image Viewer Component
 * Fullscreen image viewer with zoom, pan, and pinch gestures
 * Enterprise-grade for university mental health platform
 */

import { ThemedText } from '@/app/components/themed-text';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';

interface ImageViewerProps {
  uri: string;
  title?: string;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function ImageViewer({ uri, title, onClose }: ImageViewerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation values for zoom and pan
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  useEffect(() => {
    // Auto-hide controls after 3 seconds
    if (showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls]);

  const resetZoom = () => {
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const toggleControls = () => {
    setShowControls((prev) => !prev);
  };

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      // Limit zoom between 1x and 5x
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
      } else if (scale.value > 5) {
        scale.value = withSpring(5);
        savedScale.value = 5;
      }
    });

  // Pan gesture for moving zoomed image
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Double tap to zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        resetZoom();
      } else {
        scale.value = withSpring(2);
        savedScale.value = 2;
      }
    });

  // Compose gestures
  const composedGesture = Gesture.Simultaneous(
    Gesture.Race(doubleTapGesture, Gesture.Simultaneous(pinchGesture, panGesture))
  );

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: showControls ? withTiming(1, { duration: 200 }) : withTiming(0, { duration: 200 }),
    };
  });

  return (
    <Modal
      visible={true}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        <StatusBar hidden={true} />
        
        {/* Image with gestures */}
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={styles.imageContainer}>
            <Animated.View style={animatedImageStyle}>
              <ExpoImage
                source={{ uri }}
                style={styles.image}
                contentFit="contain"
                transition={200}
                cachePolicy="memory-disk"
                onLoadStart={() => {
                  setIsLoading(true);
                  setError(null);
                }}
                onLoadEnd={() => setIsLoading(false)}
                onError={(error) => {
                  console.error('Image viewer error:', error);
                  setIsLoading(false);
                  setError('Failed to load image. Please check your connection and try again.');
                }}
                placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
              />
            </Animated.View>
          </Animated.View>
        </GestureDetector>

        {/* Loading indicator */}
        {isLoading && !error && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <ThemedText style={[styles.loadingText, { color: '#FFFFFF' }]}>
              Loading image...
            </ThemedText>
          </View>
        )}

        {/* Error indicator */}
        {error && (
          <View style={styles.loadingOverlay}>
            <MaterialIcons name="error-outline" size={64} color="#FFFFFF" />
            <ThemedText style={[styles.loadingText, { color: '#FFFFFF', marginTop: Spacing.md }]}>
              {error}
            </ThemedText>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
              onPress={() => {
                setError(null);
                setIsLoading(true);
              }}
            >
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <ThemedText style={{ color: '#FFFFFF', marginLeft: Spacing.xs, fontWeight: '600' }}>
                Retry
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Controls overlay */}
        <Animated.View style={[styles.controlsOverlay, animatedContainerStyle]}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            {title && (
              <ThemedText
                type="body"
                style={[styles.title, { color: '#FFFFFF' }]}
                numberOfLines={1}
              >
                {title}
              </ThemedText>
            )}
            <View style={{ width: 28 }} />
          </View>

          {/* Bottom bar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={resetZoom}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="zoom-out-map" size={24} color="#FFFFFF" />
              <ThemedText style={[styles.actionText, { color: '#FFFFFF' }]}>
                Reset Zoom
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Tap area to toggle controls */}
        <TouchableOpacity
          style={styles.tapArea}
          activeOpacity={1}
          onPress={toggleControls}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? Spacing.xl : Spacing.md,
  },
  controlButton: {
    padding: Spacing.xs,
  },
  title: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    gap: Spacing.xs,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  tapArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
