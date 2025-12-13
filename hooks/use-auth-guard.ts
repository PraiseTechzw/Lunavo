/**
 * Custom hook for authentication and permission guards
 */

import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { getCurrentUser, getSession } from '@/lib/auth';
import { hasPermission, UserRole, getPermissions } from '@/lib/permissions';
import { User } from '@/app/types';

/**
 * Hook to check authentication and redirect if not authenticated
 */
export function useAuthGuard(redirectTo: string = '/auth/login') {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const session = await getSession();
      if (!session) {
        router.replace(redirectTo);
        return;
      }

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.replace(redirectTo);
        return;
      }

      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.replace(redirectTo);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, isAuthenticated };
}

/**
 * Hook to check if user has a specific permission
 */
export function usePermissionGuard(
  permission: keyof ReturnType<typeof getPermissions>,
  redirectTo: string = '/(tabs)'
) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      if (!currentUser) {
        router.replace('/auth/login');
        return;
      }

      const access = hasPermission(currentUser, permission);
      setHasAccess(access);

      if (!access) {
        router.replace(redirectTo);
      }
    } catch (error) {
      console.error('Permission check failed:', error);
      router.replace(redirectTo);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, hasAccess };
}

/**
 * Hook to check if user has one of the allowed roles
 */
export function useRoleGuard(
  allowedRoles: UserRole[],
  redirectTo: string = '/(tabs)'
) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkRole();
  }, []);

  const checkRole = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      if (!currentUser) {
        router.replace('/auth/login');
        return;
      }

      const access = allowedRoles.includes(currentUser.role as UserRole);
      setHasAccess(access);

      if (!access) {
        router.replace(redirectTo);
      }
    } catch (error) {
      console.error('Role check failed:', error);
      router.replace(redirectTo);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, hasAccess };
}

/**
 * Hook to get current user with loading state
 */
export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to load user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, refetch: loadUser };
}

