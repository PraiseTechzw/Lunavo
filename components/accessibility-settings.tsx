/**
 * Accessibility Settings Component - Font size, high contrast, reduce motion
 */

import { useState, useEffect } from 'react';
import { View, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibility } from '@/hooks/use-accessibility';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { getCursorStyle } from '@/utils/platform-styles';
import { AccessibilitySettings } from '@/lib/accessibility';

export default function AccessibilitySettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { settings, updateSettings, getScaledSize } = useAccessibility();
  const [localSettings, setLocalSettings] = useState<AccessibilitySettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleFontSizeChange = (fontSize: AccessibilitySettings['fontSize']) => {
    setLocalSettings((prev) => ({ ...prev, fontSize }));
    updateSettings({ fontSize });
  };

  const handleHighContrastToggle = (value: boolean) => {
    setLocalSettings((prev) => ({ ...prev, highContrast: value }));
    updateSettings({ highContrast: value });
  };

  const handleReduceMotionToggle = (value: boolean) => {
    setLocalSettings((prev) => ({ ...prev, reduceMotion: value }));
    updateSettings({ reduceMotion: value });
  };

  const fontSizeOptions: Array<{ value: AccessibilitySettings['fontSize']; label: string; preview: string }> = [
    { value: 'small', label: 'Small', preview: 'Aa' },
    { value: 'medium', label: 'Medium', preview: 'Aa' },
    { value: 'large', label: 'Large', preview: 'Aa' },
    { value: 'extra-large', label: 'Extra Large', preview: 'Aa' },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h2" style={styles.headerTitle}>
            Accessibility
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Font Size */}
          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Font Size
            </ThemedText>
            <ThemedText type="body" style={[styles.sectionDescription, { color: colors.icon }]}>
              Adjust the text size to make it easier to read
            </ThemedText>
            <View style={styles.fontSizeOptions}>
              {fontSizeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.fontSizeOption,
                    {
                      backgroundColor: localSettings.fontSize === option.value ? colors.primary + '20' : colors.surface,
                      borderColor: localSettings.fontSize === option.value ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleFontSizeChange(option.value)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Font size ${option.label}`}
                  accessibilityState={{ selected: localSettings.fontSize === option.value }}
                >
                  <ThemedText
                    type="h1"
                    style={[
                      styles.fontSizePreview,
                      {
                        fontSize: getScaledSize(option.value === 'small' ? 20 : option.value === 'medium' ? 24 : option.value === 'large' ? 28 : 32),
                        color: localSettings.fontSize === option.value ? colors.primary : colors.text,
                      },
                    ]}
                  >
                    {option.preview}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={{
                      color: localSettings.fontSize === option.value ? colors.primary : colors.text,
                      fontWeight: localSettings.fontSize === option.value ? '600' : '400',
                    }}
                  >
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* High Contrast */}
          <View style={styles.section}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <ThemedText type="h3" style={styles.settingTitle}>
                  High Contrast
                </ThemedText>
                <ThemedText type="body" style={[styles.settingDescription, { color: colors.icon }]}>
                  Increase contrast for better visibility
                </ThemedText>
              </View>
              <Switch
                value={localSettings.highContrast}
                onValueChange={handleHighContrastToggle}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={localSettings.highContrast ? colors.primary : colors.icon}
                accessible={true}
                accessibilityRole="switch"
                accessibilityLabel="High contrast mode"
                accessibilityState={{ checked: localSettings.highContrast }}
              />
            </View>
          </View>

          {/* Reduce Motion */}
          <View style={styles.section}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <ThemedText type="h3" style={styles.settingTitle}>
                  Reduce Motion
                </ThemedText>
                <ThemedText type="body" style={[styles.settingDescription, { color: colors.icon }]}>
                  Minimize animations and transitions
                </ThemedText>
              </View>
              <Switch
                value={localSettings.reduceMotion}
                onValueChange={handleReduceMotionToggle}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={localSettings.reduceMotion ? colors.primary : colors.icon}
                accessible={true}
                accessibilityRole="switch"
                accessibilityLabel="Reduce motion"
                accessibilityState={{ checked: localSettings.reduceMotion }}
              />
            </View>
          </View>

          {/* Screen Reader Info */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name="info-outline" size={24} color={colors.primary} />
            <View style={styles.infoContent}>
              <ThemedText type="body" style={styles.infoTitle}>
                Screen Reader Support
              </ThemedText>
              <ThemedText type="small" style={[styles.infoText, { color: colors.icon }]}>
                This app is designed to work with screen readers. Enable VoiceOver (iOS) or TalkBack (Android) in your device settings.
              </ThemedText>
            </View>
          </View>

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  fontSizeOptions: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  fontSizeOption: {
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  fontSizePreview: {
    marginBottom: Spacing.xs,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingTitle: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  settingDescription: {
    fontSize: 14,
  },
  infoCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
});

