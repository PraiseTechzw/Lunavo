/**
 * Role-based permissions system
 */

import { User, UserRole } from '@/app/types';

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
 * Get the professional label for a role
 */
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    student: 'Student',
    'peer-educator': 'Peer Educator',
    'peer-educator-executive': 'PE Executive',
    moderator: 'Moderator',
    counselor: 'Counselor',
    'life-coach': 'Life Coach',
    'student-affairs': 'Student Affairs',
    admin: 'Admin',
  };
  return labels[role] || 'Community Member';
}

/**
 * Get the official description for a role
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    student: 'Access to community, resources, and basic support.',
    'peer-educator': 'Verified students assisting their peers.',
    'peer-educator-executive': 'Managing and coordinating the peer educator network.',
    moderator: 'Ensuring community safety and standards.',
    counselor: 'Licensed professional mental health support.',
    'life-coach': 'Guidance for personal development and life skills.',
    'student-affairs': 'Institutional oversight through data-driven insights.',
    admin: 'Full system orchestration and governance.',
  };
  return descriptions[role] || 'Member of the PEACE community.';
}

/**
 * Get the accent color for a role
 */
export function getRoleAccentColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    student: '#4CAF50', // Green
    'peer-educator': '#2196F3', // Blue
    'peer-educator-executive': '#009688', // Teal
    moderator: '#FFC107', // Yellow/Amber
    counselor: '#9C27B0', // Purple
    'life-coach': '#3F51B5', // Indigo
    'student-affairs': '#607D8B', // Gray/Navy
    admin: '#FF5722', // Orange/Red
  };
  return colors[role] || '#757575';
}

/**
 * Get the governance rank for a role (higher is more authoritative)
 */
export function getRoleRank(role: UserRole): number {
  const ranks: Record<UserRole, number> = {
    admin: 8,
    'student-affairs': 7,
    'peer-educator-executive': 6,
    moderator: 5,
    counselor: 4,
    'life-coach': 3,
    'peer-educator': 2,
    student: 1,
  };
  return ranks[role] || 0;
}

/**
 * Get all permissions and metadata for a role
 */
export function getRoleMetadata(role: UserRole) {
  return {
    label: getRoleLabel(role),
    description: getRoleDescription(role),
    accentColor: getRoleAccentColor(role),
    rank: getRoleRank(role),
    permissions: getPermissions(role),
  };
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

