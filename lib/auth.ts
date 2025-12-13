/**
 * Authentication utilities for Supabase
 */

import { supabase } from './supabase';
import { createUser, getUserByEmail, getUserByUsername, getUser } from './database';
import { generatePseudonym } from '@/app/utils/anonymization';

export interface SignUpData {
  email: string;
  password: string;
  username?: string; // Anonymous username
  studentNumber?: string;
  role?: 'student' | 'peer-educator' | 'peer-educator-executive' | 'moderator' | 'counselor' | 'life-coach' | 'student-affairs' | 'admin';
  profileData?: Record<string, any>;
}

export interface SignInData {
  emailOrUsername: string; // Can be email or username
  password: string;
}

/**
 * Sign up a new user
 */
export async function signUp(userData: SignUpData): Promise<{ user: any; error: any }> {
  try {
    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (authError) {
      return { user: null, error: authError };
    }

    if (!authData.user) {
      return { user: null, error: new Error('User creation failed') };
    }

    // Generate pseudonym
    const pseudonym = generatePseudonym();

    // Create user record in database
    // Note: Password is handled by Supabase Auth, not stored in users table
    const dbUser = await createUser({
      email: userData.email,
      username: userData.username ? userData.username.toLowerCase().trim() : undefined,
      student_number: userData.studentNumber,
      role: userData.role || 'student',
      pseudonym,
      profile_data: userData.profileData || {},
    });

    return { user: dbUser, error: null };
  } catch (error: any) {
    return { user: null, error };
  }
}

/**
 * Sign in an existing user (supports email or username)
 */
export async function signIn(credentials: SignInData): Promise<{ user: any; error: any }> {
  try {
    // Determine if input is email or username
    const isEmail = credentials.emailOrUsername.includes('@');
    let email = credentials.emailOrUsername;

    // If username, find the user's email from database
    if (!isEmail) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('username', credentials.emailOrUsername.toLowerCase().trim())
        .single();

      if (userError || !userData) {
        return { user: null, error: new Error('Invalid username or password') };
      }
      email = userData.email;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: credentials.password,
    });

    if (error) {
      return { user: null, error };
    }

    if (!data.user) {
      return { user: null, error: new Error('Sign in failed') };
    }

    // Get user from database
    const dbUser = await getUser(data.user.id);
    if (!dbUser) {
      return { user: null, error: new Error('User not found in database') };
    }

    return { user: dbUser, error: null };
  } catch (error: any) {
    return { user: null, error };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: any }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<any> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  return getUser(user.id);
}

/**
 * Get the current session
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

/**
 * Reset password
 */
export async function resetPassword(email: string): Promise<{ error: any }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'lunavo://reset-password',
  });
  return { error };
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string): Promise<{ error: any }> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { error };
}

/**
 * Verify student (for CUT student verification)
 * This would typically integrate with CUT's student database
 */
export async function verifyStudent(
  studentNumber: string,
  name: string,
  department?: string,
  year?: number
): Promise<{ verified: boolean; error?: any }> {
  // TODO: Implement actual verification with CUT's system
  // For now, this is a placeholder
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { verified: false, error: new Error('Not authenticated') };
    }

    // Update user with student number
    const { error } = await supabase
      .from('users')
      .update({
        student_number: studentNumber,
        verified: true,
        profile_data: {
          name,
          department,
          year,
        },
      })
      .eq('id', user.id);

    if (error) {
      return { verified: false, error };
    }

    return { verified: true };
  } catch (error: any) {
    return { verified: false, error };
  }
}

