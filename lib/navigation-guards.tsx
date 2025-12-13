/**
 * Role-based navigation guards
 * Use these components to protect routes based on user permissions
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { getCurrentUser } from './auth';
import { hasPermission, UserRole } from './permissions';
import { User } from '@/app/types';
import React from 'react';

/**
 * Hook to check if user has permission and redirect if not
 */
export function usePermissionGuard(
  permission: keyof ReturnType<typeof import('./permissions').getPermissions>,
  redirectTo: string = '/(tabs)'
) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      if (!currentUser || !hasPermission(currentUser, permission)) {
        router.replace(redirectTo);
      }
    } catch (error) {
      console.error('Permission check failed:', error);
      router.replace(redirectTo);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading };
}

/**
 * Hook to check if user has any of the required roles
 */
export function useRoleGuard(
  allowedRoles: UserRole[],
  redirectTo: string = '/(tabs)'
) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkRole();
  }, []);

  const checkRole = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      if (!currentUser || !allowedRoles.includes(currentUser.role as UserRole)) {
        router.replace(redirectTo);
      }
    } catch (error) {
      console.error('Role check failed:', error);
      router.replace(redirectTo);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading };
}

/**
 * Higher-order component to protect a screen with permission check
 */
export function withPermissionGuard<P extends object>(
  Component: React.ComponentType<P>,
  permission: keyof ReturnType<typeof import('./permissions').getPermissions>,
  redirectTo: string = '/(tabs)'
) {
  return function ProtectedComponent(props: P) {
    const { user, loading } = usePermissionGuard(permission, redirectTo);

    if (loading) {
      return null; // Or a loading spinner
    }

    if (!user) {
      return null; // Will redirect
    }

    return <Component {...props} />;
  };
}

/**
 * Higher-order component to protect a screen with role check
 */
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: UserRole[],
  redirectTo: string = '/(tabs)'
) {
  return function ProtectedComponent(props: P) {
    const { user, loading } = useRoleGuard(allowedRoles, redirectTo);

    if (loading) {
      return null; // Or a loading spinner
    }

    if (!user) {
      return null; // Will redirect
    }

    return <Component {...props} />;
  };
}

