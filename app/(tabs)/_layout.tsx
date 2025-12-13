/**
 * Tab navigation layout
 */

import { Colors } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF', // Bright white for active tab
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.4)', // More transparent for inactive tabs
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? colors.background : '#101822', // Dark blue background
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          borderTopWidth: 1,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialIcons 
              name="home" 
              size={focused ? 28 : 24} 
              color={focused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)'} 
            />
          ),
          tabBarLabelStyle: {
            fontWeight: '700',
            fontSize: 13,
          },
        }}
      />
      <Tabs.Screen
        name="forum"
        options={{
          title: 'Forum',
          tabBarLabel: 'Forum',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialIcons 
              name="forum" 
              size={focused ? 28 : 24} 
              color={focused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)'} 
            />
          ),
          tabBarLabelStyle: {
            fontWeight: '500',
            fontSize: 12,
          },
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialIcons 
              name="chat" 
              size={focused ? 28 : 24} 
              color={focused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)'} 
            />
          ),
          tabBarLabelStyle: {
            fontWeight: '500',
            fontSize: 12,
          },
        }}
      />
      <Tabs.Screen
        name="resources"
        options={{
          title: 'Resources',
          tabBarLabel: 'Resources',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialIcons 
              name="book" 
              size={focused ? 28 : 24} 
              color={focused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)'} 
            />
          ),
          tabBarLabelStyle: {
            fontWeight: '500',
            fontSize: 12,
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialIcons 
              name="person" 
              size={focused ? 28 : 24} 
              color={focused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)'} 
            />
          ),
          tabBarLabelStyle: {
            fontWeight: '500',
            fontSize: 12,
          },
        }}
      />
    </Tabs>
  );
}

