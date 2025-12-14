/**
 * In-App Video Player Component
 * Professional video player with fullscreen support and controls
 * Uses expo-video (replaces deprecated expo-av)
 */

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useEvent } from 'expo';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
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
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const settingsOpacity = useRef(new Animated.Value(0)).current;
  const [showThumbnail, setShowThumbnail] = useState(!!thumbnailUri);
  
  // Get colors for styling (fix potential undefined)
  const primaryColor = colors?.primary || '#6366F1';

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
    // Animate controls fade in/out
    Animated.timing(controlsOpacity, {
      toValue: showControls ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Animate settings menu
    Animated.timing(settingsOpacity, {
      toValue: showSettings ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Auto-hide controls after 3 seconds when playing
    if (isPlaying && showControls && !showSettings) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, showControls, showSettings, controlsOpacity, settingsOpacity]);

  useEffect(() => {
    // Hide thumbnail when video starts playing
    if (isPlaying && showThumbnail) {
      setShowThumbnail(false);
    }
  }, [isPlaying, showThumbnail]);

  const togglePlayPause = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
      setShowThumbnail(false);
    }
    setShowControls(true);
  };

  const changePlaybackRate = (rate: number) => {
    player.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  const seekForward = () => {
    seekTo(Math.min(currentTime + 10, duration));
  };

  const seekBackward = () => {
    seekTo(Math.max(currentTime - 10, 0));
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
              setShowThumbnail(false);
            }}
          />

          {/* Thumbnail overlay (shown when paused) */}
          {showThumbnail && thumbnailUri && !isPlaying && (
            <View style={styles.thumbnailOverlay}>
              <ExpoImage
                source={{ uri: thumbnailUri }}
                style={styles.thumbnailImage}
                contentFit="cover"
                transition={200}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.3)']}
                style={styles.thumbnailGradient}
              />
            </View>
          )}

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

          {!isLoading && !hasError && (
            <Animated.View
              style={[
                styles.controlsOverlay,
                {
                  opacity: controlsOpacity,
                  pointerEvents: showControls ? 'auto' : 'none',
                },
              ]}
            >
              {/* Top Controls with Gradient */}
              <LinearGradient
                colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.4)', 'transparent']}
                style={styles.topControlsGradient}
              >
                <View style={styles.topControls}>
                  {onClose && (
                    <TouchableOpacity
                      style={[styles.controlButton, styles.controlButtonGlass]}
                      onPress={onClose}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                  {title && (
                    <View style={styles.titleContainer}>
                      <ThemedText
                        type="body"
                        style={[styles.videoTitle, { color: '#FFFFFF' }]}
                        numberOfLines={1}
                      >
                        {title}
                      </ThemedText>
                    </View>
                  )}
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity
                    style={[styles.controlButton, styles.controlButtonGlass]}
                    onPress={() => setShowSettings(!showSettings)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.controlButton, styles.controlButtonGlass]}
                    onPress={toggleFullscreen}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={isFullscreen ? 'contract' : 'expand'}
                      size={24}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              {/* Settings Menu */}
              {showSettings && (
                <Animated.View
                  style={[
                    styles.settingsMenu,
                    {
                      opacity: settingsOpacity,
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    },
                  ]}
                >
                  <ThemedText style={[styles.settingsTitle, { color: '#FFFFFF' }]}>
                    Playback Speed
                  </ThemedText>
                  <View style={styles.speedOptions}>
                    {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                      <TouchableOpacity
                        key={speed}
                        style={[
                          styles.speedButton,
                          playbackRate === speed && styles.speedButtonActive,
                          playbackRate === speed && { borderColor: primaryColor },
                        ]}
                        onPress={() => changePlaybackRate(speed)}
                      >
                        <ThemedText
                          style={[
                            styles.speedButtonText,
                            {
                              color: playbackRate === speed ? primaryColor : '#FFFFFF',
                              fontWeight: playbackRate === speed ? '700' : '400',
                            },
                          ]}
                        >
                          {speed}x
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Animated.View>
              )}

              {/* Center Controls with Gesture Buttons */}
              <View style={styles.centerControls}>
                <TouchableOpacity
                  style={styles.seekButton}
                  onPress={seekBackward}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <Ionicons name="play-back" size={32} color="rgba(255, 255, 255, 0.8)" />
                  <ThemedText style={[styles.seekLabel, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                    10s
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.centerPlayButton}
                  onPress={togglePlayPause}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <View style={styles.playButtonGlow}>
                    <MaterialIcons
                      name={isPlaying ? 'pause-circle-filled' : 'play-circle-filled'}
                      size={80}
                      color="#FFFFFF"
                    />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.seekButton}
                  onPress={seekForward}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <Ionicons name="play-forward" size={32} color="rgba(255, 255, 255, 0.8)" />
                  <ThemedText style={[styles.seekLabel, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                    10s
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {/* Bottom Controls with Gradient */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
                style={styles.bottomControlsGradient}
              >
                <View style={styles.bottomControls}>
                  <ThemedText style={[styles.timeText, { color: '#FFFFFF' }]}>
                    {formatTime(currentTime)}
                  </ThemedText>

                  {/* Enhanced Progress Bar */}
                  <View style={styles.progressBarContainer}>
                    <TouchableOpacity
                      style={styles.progressBarTouchable}
                      onPress={(e) => {
                        if (!duration) return;
                        const { locationX } = e.nativeEvent;
                        const width = Dimensions.get('window').width - 120;
                        const newPosition = (locationX / width) * duration;
                        seekTo(newPosition);
                      }}
                      activeOpacity={1}
                    >
                      <View
                        style={[
                          styles.progressBarBackground,
                          { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${progress * 100}%`,
                              backgroundColor: primaryColor,
                            },
                          ]}
                        />
                        <View
                          style={[
                            styles.progressBarThumb,
                            {
                              left: `${progress * 100}%`,
                              backgroundColor: primaryColor,
                            },
                          ]}
                        />
                      </View>
                    </TouchableOpacity>
                    {isSeeking && (
                      <View style={styles.seekPreview}>
                        <ThemedText style={[styles.seekPreviewText, { color: '#FFFFFF' }]}>
                          {formatTime((currentTime / duration) * duration || 0)}
                        </ThemedText>
                      </View>
                    )}
                  </View>

                  <ThemedText style={[styles.timeText, { color: '#FFFFFF' }]}>
                    {formatTime(duration || 0)}
                  </ThemedText>
                </View>
              </LinearGradient>
            </Animated.View>
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
  thumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  topControlsGradient: {
    paddingTop: Platform.OS === 'ios' ? Spacing.lg : Spacing.md,
  },
  controlButtonGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.full,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...PlatformStyles.shadow,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  seekButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  seekLabel: {
    fontSize: 10,
    marginTop: Spacing.xs,
    fontWeight: '600',
  },
  playButtonGlow: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  bottomControlsGradient: {
    paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.md,
  },
  progressBarTouchable: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  progressBarThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
    top: '50%',
    marginTop: -8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  seekPreview: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  seekPreviewText: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingsMenu: {
    position: 'absolute',
    top: 70,
    right: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    minWidth: 200,
    ...PlatformStyles.cardShadow,
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  speedOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  speedButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 50,
    alignItems: 'center',
  },
  speedButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    borderWidth: 1,
  },
  speedButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
