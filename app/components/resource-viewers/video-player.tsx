/**
 * In-App Video Player Component
 * Professional video player with fullscreen support and controls
 */

import { ThemedText } from '@/app/components/themed-text';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

interface VideoPlayerProps {
  uri: string;
  thumbnailUri?: string;
  title?: string;
  onClose?: () => void;
}

export function VideoPlayer({ uri, thumbnailUri, title, onClose }: VideoPlayerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isPlaying = status?.isLoaded && status.isPlaying;
  const duration = status?.isLoaded ? status.durationMillis : 0;
  const position = status?.isLoaded ? status.positionMillis : 0;
  const progress = duration > 0 ? position / duration : 0;

  useEffect(() => {
    // Auto-hide controls after 3 seconds when playing
    if (isPlaying && showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, showControls]);

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    }
    setShowControls(true);
  };

  const toggleFullscreen = async () => {
    if (videoRef.current) {
      if (isFullscreen) {
        await videoRef.current.dismissFullscreenPlayer();
        setIsFullscreen(false);
      } else {
        await videoRef.current.presentFullscreenPlayer();
        setIsFullscreen(true);
      }
    }
  };

  const seekTo = async (position: number) => {
    if (videoRef.current && status?.isLoaded) {
      await videoRef.current.setPositionAsync(position);
      setShowControls(true);
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    setStatus(status);
    if (status.isLoaded) {
      setIsLoading(false);
    }
  };

  const handleTapVideo = () => {
    setShowControls(!showControls);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      {isFullscreen && (
        <StatusBar hidden={true} />
      )}
      
      <TouchableOpacity
        style={styles.videoContainer}
        activeOpacity={1}
        onPress={handleTapVideo}
      >
        <Video
          ref={videoRef}
          source={{ uri }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls={false}
          shouldPlay={false}
          isLooping={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onLoadStart={() => setIsLoading(true)}
          onLoad={() => setIsLoading(false)}
          onError={(error) => {
            console.error('Video playback error:', error);
            setIsLoading(false);
          }}
        />

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <ThemedText style={[styles.loadingText, { color: '#FFFFFF' }]}>
              Loading video...
            </ThemedText>
          </View>
        )}

        {showControls && !isLoading && (
          <View style={styles.controlsOverlay}>
            {/* Top Controls */}
            <View style={styles.topControls}>
              {onClose && (
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {title && (
                <ThemedText
                  type="body"
                  style={[styles.videoTitle, { color: '#FFFFFF' }]}
                  numberOfLines={1}
                >
                  {title}
                </ThemedText>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                style={styles.controlButton}
                onPress={toggleFullscreen}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={isFullscreen ? 'contract' : 'expand'}
                  size={28}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            {/* Center Play/Pause Button */}
            <TouchableOpacity
              style={styles.centerPlayButton}
              onPress={togglePlayPause}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <MaterialIcons
                name={isPlaying ? 'pause-circle-filled' : 'play-circle-filled'}
                size={80}
                color="rgba(255, 255, 255, 0.9)"
              />
            </TouchableOpacity>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              <ThemedText style={[styles.timeText, { color: '#FFFFFF' }]}>
                {formatTime(position)}
              </ThemedText>

              {/* Progress Bar */}
              <TouchableOpacity
                style={styles.progressBarContainer}
                onPress={(e) => {
                  const { locationX } = e.nativeEvent;
                  const width = Dimensions.get('window').width - 120;
                  const newPosition = (locationX / width) * duration;
                  seekTo(newPosition);
                }}
                activeOpacity={1}
              >
                <View style={[styles.progressBarBackground, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progress * 100}%`, backgroundColor: colors.primary },
                    ]}
                  />
                </View>
              </TouchableOpacity>

              <ThemedText style={[styles.timeText, { color: '#FFFFFF' }]}>
                {formatTime(duration)}
              </ThemedText>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
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
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? Spacing.lg : Spacing.md,
  },
  controlButton: {
    padding: Spacing.xs,
  },
  videoTitle: {
    marginLeft: Spacing.sm,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  centerPlayButton: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.md,
    gap: Spacing.sm,
  },
  progressBarContainer: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  progressBarBackground: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 45,
    textAlign: 'right',
  },
});
