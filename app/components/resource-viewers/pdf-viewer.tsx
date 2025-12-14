/**
 * In-App PDF Viewer Component
 * Professional PDF viewer with zoom, scroll, and page navigation
 */

import { ThemedText } from '@/app/components/themed-text';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

interface PDFViewerProps {
  uri: string;
  title?: string;
  onClose?: () => void;
}

export function PDFViewer({ uri, title, onClose }: PDFViewerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // For web, use Google Docs Viewer or PDF.js
  // For native, use WebView with PDF.js or native PDF viewer
  const pdfViewerUrl = Platform.select({
    web: `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(uri)}`,
    default: `https://docs.google.com/viewer?url=${encodeURIComponent(uri)}&embedded=true`,
  });

  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('PDF load error:', nativeEvent);
    setError('Failed to load PDF. Please check your connection and try again.');
    setLoading(false);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  // Fallback: Try opening in browser if WebView fails
  const handleOpenInBrowser = async () => {
    try {
      const { default: WebBrowser } = await import('expo-web-browser');
      await WebBrowser.openBrowserAsync(uri, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        controlsColor: colors.primary,
      });
    } catch (err) {
      Alert.alert('Error', 'Unable to open PDF in browser.');
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
            {title || 'PDF Document'}
          </ThemedText>
          {totalPages > 0 && (
            <ThemedText type="small" style={{ color: colors.icon }}>
              Page {currentPage} of {totalPages}
            </ThemedText>
          )}
        </View>

        <TouchableOpacity
          onPress={handleOpenInBrowser}
          style={styles.headerButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="open-in-new" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* PDF Content */}
      <View style={styles.webViewContainer}>
        {error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={64} color={colors.danger} />
            <ThemedText type="h3" style={[styles.errorTitle, { color: colors.text }]}>
              Unable to Load PDF
            </ThemedText>
            <ThemedText type="body" style={[styles.errorMessage, { color: colors.icon }]}>
              {error}
            </ThemedText>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setError(null);
                setLoading(true);
              }}
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
              source={{ uri: pdfViewerUrl || uri }}
              style={styles.webView}
              onLoadStart={handleLoadStart}
              onLoadEnd={handleLoadEnd}
              onError={handleError}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scalesPageToFit={true}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={true}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <ThemedText type="body" style={{ color: colors.icon, marginTop: Spacing.md }}>
                    Loading PDF...
                  </ThemedText>
                </View>
              )}
            />
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <ThemedText type="body" style={{ color: colors.text, marginTop: Spacing.md }}>
                  Loading PDF...
                </ThemedText>
              </View>
            )}
          </>
        )}
      </View>

      {/* Zoom Controls (Optional - can be added for better UX) */}
      <View style={[styles.controlsBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <ThemedText type="small" style={{ color: colors.icon }}>
          Pinch to zoom • Scroll to navigate
        </ThemedText>
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
  webViewContainer: {
    flex: 1,
    backgroundColor: '#525252', // PDF.js background
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
  controlsBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    alignItems: 'center',
  },
});
