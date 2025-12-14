/**
 * Authentication utilities for Supabase
 */

import { generatePseudonym } from '@/app/utils/anonymization';
import { createUser, getUser } from './database';
import { supabase } from './supabase';

export interface SignUpData {
  email: string;
  password: string;
  username?: string; // Anonymous username
  studentNumber: string; // Required - CUT format: Letter + 8 digits + Letter (e.g., C23155538O)
  phone: string; // Required for crisis contact
  emergencyContactName: string; // Required for crisis contact
  emergencyContactPhone: string; // Required for crisis contact
  location?: string; // Optional but recommended
  preferredContactMethod?: 'phone' | 'sms' | 'email' | 'in-person'; // Optional
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
    // Check if email already exists before attempting signup
    const { checkEmailAvailability } = await import('./database');
    const emailAvailable = await checkEmailAvailability(userData.email);
    
    if (!emailAvailable) {
      return { 
        user: null, 
        error: new Error('This email is already registered. Please use a different email or try signing in.') 
      };
    }

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (authError) {
      // Check if error is due to email already existing
      if (authError.message?.toLowerCase().includes('already registered') || 
          authError.message?.toLowerCase().includes('already exists') ||
          authError.message?.toLowerCase().includes('user already registered')) {
        return { 
          user: null, 
          error: new Error('This email is already registered. Please use a different email or try signing in.') 
        };
      }
      return { user: null, error: authError };
    }

    if (!authData.user) {
      return { user: null, error: new Error('User creation failed') };
    }

    // Generate pseudonym
    const pseudonym = generatePseudonym();

    // Create user record in database
    // Pass the auth user ID directly to avoid session timing issues
    // Note: Password is handled by Supabase Auth, not stored in users table
    const dbUser = await createUser({
      email: userData.email,
      username: userData.username ? userData.username.toLowerCase().trim() : undefined,
      student_number: userData.studentNumber,
      phone: userData.phone,
      emergency_contact_name: userData.emergencyContactName,
      emergency_contact_phone: userData.emergencyContactPhone,
      location: userData.location,
      preferred_contact_method: userData.preferredContactMethod,
      role: userData.role || 'student',
      pseudonym,
      profile_data: userData.profileData || {},
    }, authData.user.id); // Pass the auth user ID directly

    return { user: dbUser, error: null };
  } catch (error: any) {
    return { user: null, error };
  }
}

/**
 * Sign in an existing user (supports email or username)
 */
export async function signIn(credentials: SignInData): Promise<{ user: any; error: any; needsVerification?: boolean; email?: string }> {
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
      console.log('[signIn] Supabase error:', error.message, 'Status:', error.status);
      
      // Check if error is due to email not being confirmed
      const errorMessage = error.message?.toLowerCase() || '';
      if (errorMessage.includes('email not confirmed') || 
          errorMessage.includes('email not verified') ||
          errorMessage.includes('not confirmed') ||
          error.status === 400) {
        console.log('[signIn] Email not confirmed, redirecting to verification');
        return { 
          user: null, 
          error: new Error('Please verify your email address before signing in.'), 
          needsVerification: true,
          email: email 
        };
      }
      return { user: null, error };
    }

    if (!data.user) {
      return { user: null, error: new Error('Sign in failed') };
    }

    // Check if email is confirmed (even if sign-in succeeded, we want to ensure email is verified)
    const emailConfirmed = data.user.email_confirmed_at || data.user.confirmed_at;
    if (!emailConfirmed) {
      console.log('[signIn] User signed in but email not confirmed, redirecting to verification');
      // Sign out the user since email is not confirmed
      await supabase.auth.signOut();
      
      // Email not confirmed - redirect to verification
      return { 
        user: null, 
        error: new Error('Please verify your email address before signing in.'), 
        needsVerification: true,
        email: data.user.email || email 
      };
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
 * Verify OTP code using Supabase's built-in OTP verification
 * Supabase automatically sends the OTP token when signUp is called (if configured to use tokens)
 */
export async function verifyOTP(email: string, token: string, type: 'email' | 'signup' = 'email'): Promise<{ verified: boolean; error: any; session?: any }> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.toLowerCase().trim(),
      token: token.trim(),
      type: type,
    });

    if (error) {
      return { verified: false, error, session: null };
    }

    if (!data.session && !data.user) {
      return { verified: false, error: new Error('Invalid or expired OTP code'), session: null };
    }

    // OTP verified successfully - user is now confirmed and authenticated
    return { verified: true, error: null, session: data.session };
  } catch (error: any) {
    return { verified: false, error, session: null };
  }
}

/**
 * Resend OTP code using Supabase's resend method
 * This will send a new OTP token to the email for signup confirmation
 */
export async function resendOTP(email: string): Promise<{ error: any }> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    console.log('[resendOTP] Resending OTP to:', normalizedEmail);
    
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      const error = new Error('Invalid email address');
      console.error('[resendOTP] Invalid email:', normalizedEmail);
      return { error };
    }
    
    // Use Supabase's resend method to resend the signup confirmation OTP
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
    });

    console.log('[resendOTP] Response:', { 
      hasData: !!data, 
      hasError: !!error,
      errorMessage: error?.message,
      errorCode: error?.status 
    });

    if (error) {
      console.error('[resendOTP] Error details:', JSON.stringify(error, null, 2));
      
      // Provide more user-friendly error messages
      let errorMessage = error.message || 'Failed to resend verification code';
      
      if (error.message?.toLowerCase().includes('rate limit') || 
          error.message?.toLowerCase().includes('too many')) {
        errorMessage = 'Too many requests. Please wait a few minutes before requesting another code.';
      } else if (error.message?.toLowerCase().includes('not found') || 
                 error.message?.toLowerCase().includes('does not exist') ||
                 error.message?.toLowerCase().includes('user not found')) {
        errorMessage = 'Email not found. Please check your email address or sign up again.';
      } else if (error.message?.toLowerCase().includes('already confirmed') ||
                 error.message?.toLowerCase().includes('already verified')) {
        errorMessage = 'This email is already verified. You can sign in now.';
      } else if (error.status === 429) {
        errorMessage = 'Too many requests. Please wait before requesting another code.';
      }
      
      return { error: { ...error, message: errorMessage } };
    }

    console.log('[resendOTP] Success - OTP email should be sent');
    return { error: null };
  } catch (error: any) {
    console.error('[resendOTP] Exception:', error);
    const errorMessage = error?.message || 'An unexpected error occurred while resending the code';
    return { error: { message: errorMessage, originalError: error } };
  }
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

