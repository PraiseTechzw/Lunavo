/**
 * Professional Web Viewer Component
 * Secure in-app browser with disabled external redirects
 * Enterprise-grade for university mental health platform
 */

import { ThemedText } from '@/app/components/themed-text';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';

interface WebViewerProps {
  uri: string;
  title?: string;
  onClose: () => void;
  allowExternalRedirects?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function WebViewer({
  uri,
  title,
  onClose,
  allowExternalRedirects = false,
}: WebViewerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState(uri);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView Error:', nativeEvent);
    setIsLoading(false);
    setError('Failed to load page. Please check your connection and try again.');
  };

  const handleNavigationStateChange = (navState: any) => {
    setCurrentUrl(navState.url);
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    const { url } = request;

    // Allow the initial URL
    if (url === uri || url.startsWith(uri)) {
      return true;
    }

    // If external redirects are not allowed, block navigation
    if (!allowExternalRedirects) {
      // Extract domain from original URI
      try {
        const originalDomain = new URL(uri).hostname;
        const requestDomain = new URL(url).hostname;

        // Allow same domain navigation
        if (requestDomain === originalDomain || requestDomain.endsWith('.' + originalDomain)) {
          return true;
        }

        // Block external redirects
        Alert.alert(
          'External Link Blocked',
          'For your security, external links are disabled. All content is viewed within the app.',
          [{ text: 'OK' }]
        );
        return false;
      } catch (e) {
        // If URL parsing fails, allow it (could be a relative URL)
        return true;
      }
    }

    return true;
  };

  const goBack = () => {
    if (webViewRef.current && canGoBack) {
      webViewRef.current.goBack();
    }
  };

  const goForward = () => {
    if (webViewRef.current && canGoForward) {
      webViewRef.current.goForward();
    }
  };

  const reload = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar hidden={false} style={colorScheme === 'dark' ? 'light' : 'dark'} />
        
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.controlButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <ThemedText
              type="small"
              style={[styles.title, { color: colors.text }]}
              numberOfLines={1}
            >
              {title || 'Web Content'}
            </ThemedText>
            <ThemedText
              type="small"
              style={[styles.url, { color: colors.icon }]}
              numberOfLines={1}
            >
              {currentUrl}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={reload}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="refresh" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Navigation Bar */}
        <View
          style={[
            styles.navBar,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.navButton,
              { backgroundColor: canGoBack ? colors.primary + '20' : colors.surface },
            ]}
            onPress={goBack}
            disabled={!canGoBack}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={canGoBack ? colors.primary : colors.icon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navButton,
              { backgroundColor: canGoForward ? colors.primary + '20' : colors.surface },
            ]}
            onPress={goForward}
            disabled={!canGoForward}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={canGoForward ? colors.primary : colors.icon}
            />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          {!allowExternalRedirects && (
            <View style={styles.securityBadge}>
              <MaterialIcons name="lock" size={14} color={colors.success} />
              <ThemedText type="small" style={[styles.securityText, { color: colors.success }]}>
                Secure
              </ThemedText>
            </View>
          )}
        </View>

        {/* Web Content */}
        <View style={styles.contentContainer}>
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
                onPress={reload}
              >
                <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
                <ThemedText style={{ color: '#FFFFFF', marginLeft: Spacing.xs, fontWeight: '600' }}>
                  Retry
                </ThemedText>
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
                // Security settings
                mixedContentMode="never"
                thirdPartyCookiesEnabled={false}
                sharedCookiesEnabled={false}
                // Privacy settings
                incognito={true}
                renderLoading={() => (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <ThemedText style={[styles.loadingText, { color: colors.icon }]}>
                      Loading...
                    </ThemedText>
                  </View>
                )}
              />
              {isLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <ThemedText style={[styles.loadingText, { color: colors.icon }]}>
                    Loading...
                  </ThemedText>
                </View>
              )}
            </>
          )}
        </View>

        {/* Info Banner */}
        {!allowExternalRedirects && (
          <View
            style={[
              styles.infoBanner,
              {
                backgroundColor: colors.info + '15',
                borderTopColor: colors.border,
              },
            ]}
          >
            <MaterialIcons name="info-outline" size={16} color={colors.info} />
            <ThemedText type="small" style={[styles.infoText, { color: colors.text }]}>
              External links are disabled for your security. All content is viewed within the app.
            </ThemedText>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? Spacing.xl : Spacing.md,
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  controlButton: {
    padding: Spacing.xs,
  },
  titleContainer: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  url: {
    fontSize: 11,
    marginTop: 2,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    gap: 4,
  },
  securityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorTitle: {
    marginTop: Spacing.md,
    fontWeight: '700',
  },
  errorMessage: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.xs,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});
