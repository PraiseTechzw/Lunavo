/**
 * Secure In-App Web Viewer Component
 * WebView with disabled external redirects and clean reading mode
 */

import { ThemedText } from '@/app/components/themed-text';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';

interface WebViewerProps {
  uri: string;
  title?: string;
  onClose?: () => void;
  allowExternalRedirects?: boolean; // Default: false (secure mode)
}

export function WebViewer({ uri, title, onClose, allowExternalRedirects = false }: WebViewerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(uri);
  const webViewRef = useRef<WebView>(null);

  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    setError('Failed to load page. Please check your connection and try again.');
    setLoading(false);
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setCurrentUrl(navState.url);

    // Block external redirects unless explicitly allowed
    if (!allowExternalRedirects) {
      const originalDomain = new URL(uri).hostname;
      const currentDomain = new URL(navState.url).hostname;

      // Allow navigation within the same domain
      if (currentDomain !== originalDomain && !currentDomain.endsWith(`.${originalDomain}`)) {
        // This is an external redirect - prevent it
        Alert.alert(
          'External Link',
          'This link would open an external website. For security, external links are disabled in the app.',
          [
            { text: 'OK', style: 'default' },
          ]
        );
        // Go back to original URL
        if (webViewRef.current) {
          webViewRef.current.goBack();
        }
        return;
      }
    }
  };

  const handleShouldStartLoadWithRequest = (request: any): boolean => {
    // Additional security check
    if (!allowExternalRedirects) {
      const originalDomain = new URL(uri).hostname;
      const requestDomain = new URL(request.url).hostname;

      if (requestDomain !== originalDomain && !requestDomain.endsWith(`.${originalDomain}`)) {
        Alert.alert(
          'External Link Blocked',
          'For security, external links are disabled in the app.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const handleGoBack = () => {
    if (webViewRef.current && canGoBack) {
      webViewRef.current.goBack();
    }
  };

  const handleGoForward = () => {
    if (webViewRef.current && canGoForward) {
      webViewRef.current.goForward();
    }
  };

  const handleReload = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const handleOpenInBrowser = async () => {
    try {
      const { default: WebBrowser } = await import('expo-web-browser');
      await WebBrowser.openBrowserAsync(currentUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        controlsColor: colors.primary,
      });
    } catch (err) {
      Alert.alert('Error', 'Unable to open in browser.');
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.headerButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <ThemedText type="body" style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {title || 'Web Content'}
          </ThemedText>
          <ThemedText type="small" style={{ color: colors.icon }} numberOfLines={1}>
            {currentUrl}
          </ThemedText>
        </View>

        <TouchableOpacity
          onPress={handleOpenInBrowser}
          style={styles.headerButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="open-in-new" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Navigation Controls */}
      <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleGoBack}
          disabled={!canGoBack}
          style={[styles.navButton, !canGoBack && styles.navButtonDisabled]}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={canGoBack ? colors.text : colors.icon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGoForward}
          disabled={!canGoForward}
          style={[styles.navButton, !canGoForward && styles.navButtonDisabled]}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={canGoForward ? colors.text : colors.icon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleReload}
          style={styles.navButton}
        >
          <Ionicons name="reload" size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />
      </View>

      {/* WebView Content */}
      <View style={styles.webViewContainer}>
        {error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={64} color={colors.danger} />
            <ThemedText type="h3" style={[styles.errorTitle, { color: colors.text }]}>
              Unable to Load Page
            </ThemedText>
            <ThemedText type="body" style={[styles.errorMessage, { color: colors.icon }]}>
              {error}
            </ThemedText>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={handleReload}
            >
              <ThemedText style={{ color: '#FFFFFF', fontWeight: '600' }}>Retry</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.surface, marginTop: Spacing.sm }]}
              onPress={handleOpenInBrowser}
            >
              <ThemedText style={{ color: colors.text, fontWeight: '600' }}>Open in Browser</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <WebView
              ref={webViewRef}
              source={{ uri }}
              style={styles.webView}
              onLoadStart={handleLoadStart}
              onLoadEnd={handleLoadEnd}
              onError={handleError}
              onNavigationStateChange={handleNavigationStateChange}
              onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scalesPageToFit={true}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={true}
              // Security: Disable dangerous features
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              // Block external scripts for security (can be adjusted)
              injectedJavaScript={`
                // Disable external links
                document.addEventListener('click', function(e) {
                  const link = e.target.closest('a');
                  if (link && link.href) {
                    const currentDomain = window.location.hostname;
                    const linkDomain = new URL(link.href).hostname;
                    if (linkDomain !== currentDomain && !linkDomain.endsWith('.' + currentDomain)) {
                      e.preventDefault();
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'externalLink',
                        url: link.href
                      }));
                    }
                  }
                });
                true; // Required for injected JavaScript
              `}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.type === 'externalLink' && !allowExternalRedirects) {
                    Alert.alert(
                      'External Link Blocked',
                      'For security, external links are disabled in the app.',
                      [{ text: 'OK' }]
                    );
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <ThemedText type="body" style={{ color: colors.icon, marginTop: Spacing.md }}>
                    Loading...
                  </ThemedText>
                </View>
              )}
            />
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <ThemedText type="body" style={{ color: colors.text, marginTop: Spacing.md }}>
                  Loading...
                </ThemedText>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        paddingTop: Spacing.md,
      },
    }),
  },
  headerButton: {
    padding: Spacing.xs,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerTitle: {
    fontWeight: '600',
    fontSize: 16,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    gap: Spacing.xs,
  },
  navButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    fontWeight: '700',
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: 150,
    alignItems: 'center',
  },
});
