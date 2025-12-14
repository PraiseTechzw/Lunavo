/**
 * Tab navigation layout - Role-aware
 * Different tabs shown based on user role
 */

import { Colors } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { getCurrentUser } from '@/lib/database';
import { UserRole } from '@/lib/permissions';
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setUserRole(user.role as UserRole);
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  // Determine which tabs to show based on role
  const shouldShowTab = (tabName: string): boolean => {
    if (!userRole) return true; // Show all tabs while loading
    
    // Counselors and Life Coaches should not see Forum
    if (tabName === 'forum' && (userRole === 'counselor' || userRole === 'life-coach')) {
      return false;
    }
    
    // Student Affairs should not see Forum or Chat
    if ((tabName === 'forum' || tabName === 'chat') && userRole === 'student-affairs') {
      return false;
    }
    
    return true;
  };

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
          // Hide forum tab for counselors and student affairs
          ...(shouldShowTab('forum') ? {} : { href: null }),
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
          // Hide chat tab for student affairs
          ...(shouldShowTab('chat') ? {} : { href: null }),
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

