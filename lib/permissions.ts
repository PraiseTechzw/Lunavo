/**
 * Role-based permissions system
 */

import { User } from '@/types';

export type UserRole =
  | 'student'
  | 'peer-educator'
  | 'peer-educator-executive'
  | 'moderator'
  | 'counselor'
  | 'life-coach'
  | 'student-affairs'
  | 'admin';

/**
 * Check if user can view dashboard
 */
export function canViewDashboard(role: UserRole): boolean {
  return [
    'student',
    'peer-educator',
    'peer-educator-executive',
    'moderator',
    'counselor',
    'life-coach',
    'student-affairs',
    'admin',
  ].includes(role);
}

/**
 * Check if user can moderate content
 */
export function canModerate(role: UserRole): boolean {
  return ['moderator', 'admin'].includes(role);
}

/**
 * Check if user can escalate posts
 */
export function canEscalate(role: UserRole): boolean {
  return [
    'peer-educator',
    'peer-educator-executive',
    'moderator',
    'counselor',
    'life-coach',
    'admin',
  ].includes(role);
}

/**
 * Check if user can manage meetings
 */
export function canManageMeetings(role: UserRole): boolean {
  return ['peer-educator-executive', 'admin'].includes(role);
}

/**
 * Check if user can view analytics
 */
export function canViewAnalytics(role: UserRole): boolean {
  return ['student-affairs', 'admin'].includes(role);
}

/**
 * Check if user can manage users
 */
export function canManageUsers(role: UserRole): boolean {
  return ['admin'].includes(role);
}

/**
 * Check if user can view escalated posts
 */
export function canViewEscalations(role: UserRole): boolean {
  return ['counselor', 'life-coach', 'admin'].includes(role);
}

/**
 * Check if user can respond as volunteer
 */
export function canRespondAsVolunteer(role: UserRole): boolean {
  return [
    'peer-educator',
    'peer-educator-executive',
    'moderator',
    'counselor',
    'life-coach',
    'admin',
  ].includes(role);
}

/**
 * Check if user can create resources
 */
export function canCreateResources(role: UserRole): boolean {
  return ['peer-educator-executive', 'student-affairs', 'admin'].includes(role);
}

/**
 * Check if user can view admin dashboard
 */
export function canViewAdminDashboard(role: UserRole): boolean {
  return ['admin'].includes(role);
}

/**
 * Check if user can view student affairs dashboard
 */
export function canViewStudentAffairsDashboard(role: UserRole): boolean {
  return ['student-affairs', 'admin'].includes(role);
}

/**
 * Check if user can view peer educator dashboard
 */
export function canViewPeerEducatorDashboard(role: UserRole): boolean {
  return ['peer-educator', 'peer-educator-executive', 'admin'].includes(role);
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole) {
  return {
    canViewDashboard: canViewDashboard(role),
    canModerate: canModerate(role),
    canEscalate: canEscalate(role),
    canManageMeetings: canManageMeetings(role),
    canViewAnalytics: canViewAnalytics(role),
    canManageUsers: canManageUsers(role),
    canViewEscalations: canViewEscalations(role),
    canRespondAsVolunteer: canRespondAsVolunteer(role),
    canCreateResources: canCreateResources(role),
    canViewAdminDashboard: canViewAdminDashboard(role),
    canViewStudentAffairsDashboard: canViewStudentAffairsDashboard(role),
    canViewPeerEducatorDashboard: canViewPeerEducatorDashboard(role),
  };
}

/**
 * Check if user has permission
 */
export function hasPermission(user: User | null, permission: keyof ReturnType<typeof getPermissions>): boolean {
  if (!user) return false;
  const permissions = getPermissions(user.role as UserRole);
  return permissions[permission];
}

