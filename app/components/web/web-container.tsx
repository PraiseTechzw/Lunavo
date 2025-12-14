/**
 * Web Container Component
 * Responsive container for web layouts with max-width and padding
 */

import { Colors } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

export interface WebContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  padding?: number;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function WebContainer({ 
  children, 
  maxWidth = 1400, 
  padding = 24,
  style,
  fullWidth = false 
}: WebContainerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (Platform.OS !== 'web' && !fullWidth) {
    return <View style={style}>{children}</View>;
  }

  return (
    <View 
      style={[
        styles.container,
        {
          maxWidth: fullWidth ? '100%' : maxWidth,
          paddingHorizontal: padding,
        },
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? {
      marginHorizontal: 'auto',
      height: '100%',
    } : {}),
  },
});


