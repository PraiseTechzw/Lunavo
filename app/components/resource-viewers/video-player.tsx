/**
 * In-App Video Player Component
 * Professional video player with fullscreen support and controls
 * Uses expo-video (replaces deprecated expo-av)
 */

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface VideoPlayerProps {
  uri: string;
  thumbnailUri?: string;
  title?: string;
  onClose?: () => void;
}

export function VideoPlayer({ uri, thumbnailUri, title, onClose }: VideoPlayerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const videoViewRef = useRef<VideoView>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Create video player
  const player = useVideoPlayer(uri, (player) => {
    // Setup player when created
    player.loop = false;
    player.muted = false;
  });

  // Listen to player events
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  
  // Track current time and duration for UI updates
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  useEffect(() => {
    // Set up time update interval
    player.timeUpdateEventInterval = 0.5; // Update every 0.5 seconds
    
    // Update time and duration from player properties
    const interval = setInterval(() => {
      setCurrentTime(player.currentTime);
      setDuration(player.duration);
    }, 500);
    
    // Initial values
    setCurrentTime(player.currentTime);
    setDuration(player.duration);
    
    return () => {
      clearInterval(interval);
    };
  }, [player]);

  const isLoading = status === 'loading';
  const hasError = status === 'error';
  const progress = duration && duration > 0 ? currentTime / duration : 0;

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

  const togglePlayPause = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setShowControls(true);
  };

  const toggleFullscreen = async () => {
    if (videoViewRef.current) {
      if (isFullscreen) {
        await videoViewRef.current.exitFullscreen();
        setIsFullscreen(false);
      } else {
        await videoViewRef.current.enterFullscreen();
        setIsFullscreen(true);
      }
    }
  };

  const seekTo = (position: number) => {
    player.currentTime = position;
    setShowControls(true);
  };

  const formatTime = (seconds: number) => {
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTapVideo = () => {
    setShowControls(!showControls);
  };

  const handleRetry = () => {
    player.replace(uri);
    setShowControls(true);
  };

  return (
    <Modal visible={true} animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView edges={['top', 'bottom']} style={[styles.container, { backgroundColor: '#000' }]}>
        {isFullscreen && <StatusBar hidden={true} />}

        <TouchableOpacity
          style={styles.videoContainer}
          activeOpacity={1}
          onPress={handleTapVideo}
        >
          <VideoView
            ref={videoViewRef}
            player={player}
            style={styles.video}
            contentFit="contain"
            nativeControls={false}
            allowsFullscreen={true}
            onFullscreenEnter={() => setIsFullscreen(true)}
            onFullscreenExit={() => setIsFullscreen(false)}
            onFirstFrameRender={() => {
              // Video loaded successfully
            }}
          />

          {isLoading && !hasError && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <ThemedText style={[styles.loadingText, { color: '#FFFFFF' }]}>
                Loading video...
              </ThemedText>
            </View>
          )}

          {hasError && (
            <View style={styles.errorOverlay}>
              <MaterialIcons name="error-outline" size={64} color="#FFFFFF" />
              <ThemedText style={[styles.errorTitle, { color: '#FFFFFF' }]}>
                Unable to Play Video
              </ThemedText>
              <ThemedText style={[styles.errorMessage, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                This video cannot be played. It may be in an unsupported format or the file may be corrupted.
              </ThemedText>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={handleRetry}
              >
                <Ionicons name="refresh" size={20} color="#FFFFFF" style={{ marginRight: Spacing.xs }} />
                <ThemedText style={{ color: '#FFFFFF', fontWeight: '600' }}>
                  Retry
                </ThemedText>
              </TouchableOpacity>
              {onClose && (
                <TouchableOpacity
                  style={[styles.closeErrorButton, { borderColor: 'rgba(255, 255, 255, 0.5)' }]}
                  onPress={onClose}
                >
                  <ThemedText style={{ color: '#FFFFFF' }}>
                    Close
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          )}

          {showControls && !isLoading && !hasError && (
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
                  {formatTime(currentTime)}
                </ThemedText>

                {/* Progress Bar */}
                <TouchableOpacity
                  style={styles.progressBarContainer}
                  onPress={(e) => {
                    if (!duration) return;
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
                  {formatTime(duration || 0)}
                </ThemedText>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
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
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: Spacing.xl,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  closeErrorButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
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
