/**
 * Modern Multi-Step Registration Screen - Dark blue header with wave pattern
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createInputStyle, createShadow } from '@/utils/platform-styles';
import { useToast } from '@/utils/useToast';
import { signUp } from '@/lib/auth';
import { checkEmailAvailability, checkStudentNumberAvailability, checkUsernameAvailability } from '@/lib/database';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

// Beautiful Wave pattern component with elegant curves
const WavePattern = ({ color }: { color: string }) => (
  <Svg width="100%" height="160" viewBox="0 0 375 160" preserveAspectRatio="none">
    {/* Main wave - elegant flowing curve */}
    <Path
      d="M0,100 C93.75,60 140,70 187.5,80 C235,90 281.25,75 375,95 L375,160 L0,160 Z"
      fill={color}
      opacity="0.35"
    />
    {/* Secondary wave - subtle depth */}
    <Path
      d="M0,110 C100,85 150,90 187.5,95 C225,100 275,90 375,105 L375,160 L0,160 Z"
      fill={color}
      opacity="0.25"
    />
    {/* Accent wave - fine detail */}
    <Path
      d="M0,120 C80,105 130,108 187.5,110 C245,112 295,105 375,115 L375,160 L0,160 Z"
      fill={color}
      opacity="0.15"
    />
  </Svg>
);

type Step = 1 | 2 | 3 | 4;

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { showToast, ToastComponent } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  
  // Step 1: Email, Password & Student Number
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const emailCheckTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [studentNumberStatus, setStudentNumberStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const studentNumberCheckTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Step 2: Username
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const usernameCheckTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Step 3: Contact Information
  const [phone, setPhone] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [location, setLocation] = useState('');
  const [preferredContactMethod, setPreferredContactMethod] = useState<'phone' | 'sms' | 'email' | 'in-person' | ''>('');
  
  // Step 4: Terms
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Real-time email availability check
  useEffect(() => {
    if (emailCheckTimeout.current) {
      clearTimeout(emailCheckTimeout.current);
    }

    if (!email || !email.trim()) {
      setEmailStatus('idle');
      return;
    }

    // Validate email format
    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(normalizedEmail)) {
      setEmailStatus('invalid');
      return;
    }

    setEmailStatus('checking');
    emailCheckTimeout.current = setTimeout(async () => {
      try {
        const isAvailable = await checkEmailAvailability(normalizedEmail);
        console.log('Email check result:', normalizedEmail, 'available:', isAvailable);
        setEmailStatus(isAvailable ? 'available' : 'taken');
      } catch (error) {
        console.error('Error checking email availability:', error);
        // On error, set to taken to prevent proceeding with potentially invalid email
        setEmailStatus('taken');
      }
    }, 500);

    return () => {
      if (emailCheckTimeout.current) {
        clearTimeout(emailCheckTimeout.current);
      }
    };
  }, [email]);

  // Real-time username availability check
  useEffect(() => {
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    if (!username || username.trim().length < 3) {
      setUsernameStatus('idle');
      return;
    }

    // Validate format
    const normalizedUsername = username.toLowerCase().trim();
    if (!/^[a-z0-9_-]{3,20}$/.test(normalizedUsername)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    usernameCheckTimeout.current = setTimeout(async () => {
      try {
        const isAvailable = await checkUsernameAvailability(normalizedUsername);
        console.log('Username check result:', normalizedUsername, 'available:', isAvailable);
        setUsernameStatus(isAvailable ? 'available' : 'taken');
      } catch (error) {
        console.error('Error checking username availability:', error);
        // On error, set to taken to prevent proceeding with potentially invalid username
        setUsernameStatus('taken');
      }
    }, 500);

    return () => {
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }
    };
  }, [username]);

  // Real-time student number availability check
  useEffect(() => {
    if (studentNumberCheckTimeout.current) {
      clearTimeout(studentNumberCheckTimeout.current);
    }

    if (!studentNumber || !studentNumber.trim()) {
      setStudentNumberStatus('idle');
      return;
    }

    // Validate CUT student number format: Letter + 8 digits + Letter
    const normalizedStudentNumber = studentNumber.trim().toUpperCase();
    const studentNumberRegex = /^[A-Z]\d{8}[A-Z]$/;
    if (!studentNumberRegex.test(normalizedStudentNumber)) {
      setStudentNumberStatus('invalid');
      return;
    }

    setStudentNumberStatus('checking');
    studentNumberCheckTimeout.current = setTimeout(async () => {
      try {
        const isAvailable = await checkStudentNumberAvailability(normalizedStudentNumber);
        console.log('Student number check result:', normalizedStudentNumber, 'available:', isAvailable);
        setStudentNumberStatus(isAvailable ? 'available' : 'taken');
      } catch (error) {
        console.error('Error checking student number availability:', error);
        // On error, set to taken to prevent proceeding with potentially invalid student number
        setStudentNumberStatus('taken');
      }
    }, 500);

    return () => {
      if (studentNumberCheckTimeout.current) {
        clearTimeout(studentNumberCheckTimeout.current);
      }
    };
  }, [studentNumber]);

  const getPasswordStrength = (pwd: string): { strength: number; label: string; color: string } => {
    if (pwd.length === 0) return { strength: 0, label: '', color: '#FFFFFF' };
    if (pwd.length < 6) return { strength: 1, label: 'Weak', color: '#EF4444' };
    if (pwd.length < 8) return { strength: 2, label: 'Fair', color: '#F59E0B' };
    
    // Check for required characters
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
    
    const requirementsMet = [hasUpper, hasLower, hasNumber].filter(Boolean).length;
    
    if (pwd.length < 12 || requirementsMet < 3) {
      return { strength: 3, label: 'Good', color: '#3B82F6' };
    }
    if (hasSpecial && pwd.length >= 12) {
      return { strength: 4, label: 'Strong', color: '#10B981' };
    }
    return { strength: 4, label: 'Strong', color: '#10B981' };
  };

  const passwordStrength = getPasswordStrength(password);

  // Validate CUT student number format: Letter + 8 digits + Letter
  // Example: C23155538O
  const isValidStudentNumber = (num: string): boolean => {
    const normalized = num.trim().toUpperCase();
    // Must start with a letter, have 8 digits, and end with a letter
    return /^[A-Z]\d{8}[A-Z]$/.test(normalized);
  };

  const canProceedToStep2 = () => {
    return email.trim() && 
           emailStatus === 'available' &&
           password.trim() && 
           confirmPassword.trim() && 
           password === confirmPassword && 
           password.length >= 8 &&
           passwordStrength.strength >= 3 &&
           studentNumber.trim() &&
           isValidStudentNumber(studentNumber) &&
           studentNumberStatus === 'available';
  };

  const canProceedToStep3 = () => {
    return username.trim().length >= 3 && usernameStatus === 'available';
  };

  const canProceedToStep4 = () => {
    return phone.trim() && 
           emergencyContactName.trim() && 
           emergencyContactPhone.trim();
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!email.trim()) {
        showToast('Please enter your email address', 'warning');
        return;
      }
      if (emailStatus === 'invalid') {
        showToast('Please enter a valid email address', 'error');
        return;
      }
      if (emailStatus === 'checking') {
        showToast('Please wait while we check email availability', 'info');
        return;
      }
      if (emailStatus === 'taken') {
        showToast('This email is already registered. Please use a different email or try signing in.', 'error');
        return;
      }
      if (emailStatus !== 'available') {
        showToast('Please wait for email validation to complete', 'warning');
        return;
      }
      if (!password.trim()) {
        showToast('Please enter a password', 'warning');
        return;
      }
      if (password.length < 8) {
        showToast('Password must be at least 8 characters long', 'warning');
        return;
      }
      if (passwordStrength.strength < 3) {
        showToast('Password is too weak. Please use a stronger password with uppercase, lowercase, and numbers.', 'warning');
        return;
      }
      if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }
      if (!studentNumber.trim()) {
        showToast('Please enter your CUT student number', 'warning');
        return;
      }
      if (!isValidStudentNumber(studentNumber)) {
        showToast('Invalid student number format. Must start with a letter, have 8 digits, and end with a letter (e.g., C23155538O)', 'error');
        return;
      }
      if (studentNumberStatus === 'checking') {
        showToast('Please wait while we check student number availability', 'info');
        return;
      }
      if (studentNumberStatus === 'taken') {
        showToast('This student number is already registered. Please use a different student number or contact support if this is an error.', 'error');
        return;
      }
      if (studentNumberStatus !== 'available') {
        showToast('Please wait for student number validation to complete', 'warning');
        return;
      }
      if (canProceedToStep2()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (!username.trim()) {
        showToast('Please enter a username', 'warning');
        return;
      }
      if (usernameStatus === 'taken') {
        showToast('This username is already taken. Please choose another.', 'error');
        return;
      }
      if (usernameStatus === 'invalid') {
        showToast('Username must be 3-20 characters, alphanumeric, underscore, or hyphen only', 'error');
        return;
      }
      if (usernameStatus !== 'available') {
        showToast('Please wait for username availability check to complete', 'info');
        return;
      }
      if (canProceedToStep3()) {
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      if (!phone.trim()) {
        showToast('Please enter your phone number', 'warning');
        return;
      }
      if (!emergencyContactName.trim()) {
        showToast('Please enter emergency contact name', 'warning');
        return;
      }
      if (!emergencyContactPhone.trim()) {
        showToast('Please enter emergency contact phone number', 'warning');
        return;
      }
      if (canProceedToStep4()) {
        setCurrentStep(4);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/auth/login' as any);
      }
    }
  };

  const handleRegister = async () => {
    console.log('handleRegister called');
    console.log('acceptedTerms:', acceptedTerms);
    console.log('Form data:', {
      email: email.trim(),
      username: username.trim(),
      studentNumber: studentNumber.trim(),
      phone: phone.trim(),
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
    });

    if (!acceptedTerms) {
      console.log('Terms not accepted');
      showToast('Please accept the terms and conditions to continue', 'warning');
      // Fallback alert in case toast doesn't show
      Alert.alert('Terms Required', 'Please accept the terms and conditions to continue');
      return;
    }

    // Validate all required fields
    if (!email.trim()) {
      showToast('Please enter your email address', 'warning');
      return;
    }
    if (emailStatus === 'invalid') {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    if (emailStatus === 'checking') {
      showToast('Please wait while we check email availability', 'info');
      return;
    }
    if (emailStatus === 'taken') {
      showToast('This email is already registered. Please use a different email or try signing in.', 'error');
      return;
    }
    if (emailStatus !== 'available') {
      showToast('Please wait for email validation to complete', 'warning');
      return;
    }
    if (!password.trim()) {
      showToast('Please enter a password', 'warning');
      return;
    }
    if (password.length < 8) {
      showToast('Password must be at least 8 characters long', 'warning');
      return;
    }
    // Check password requirements
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasUpper || !hasLower || !hasNumber) {
      showToast('Password must contain at least one uppercase letter, one lowercase letter, and one number', 'warning');
      return;
    }
    if (passwordStrength.strength < 3) {
      showToast('Password is too weak. Please use a stronger password.', 'warning');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (!username.trim()) {
      showToast('Please enter a username', 'warning');
      return;
    }
    if (!studentNumber.trim()) {
      showToast('Please enter your CUT student number', 'warning');
      return;
    }
    if (!isValidStudentNumber(studentNumber)) {
      showToast('Invalid student number format. Must start with a letter, have 8 digits, and end with a letter (e.g., C23155538O)', 'error');
      return;
    }
    if (studentNumberStatus === 'checking') {
      showToast('Please wait while we check student number availability', 'info');
      return;
    }
    if (studentNumberStatus === 'taken') {
      showToast('This student number is already registered. Please contact support if this is an error.', 'error');
      return;
    }
    if (studentNumberStatus !== 'available') {
      showToast('Please wait for student number validation to complete', 'warning');
      return;
    }
    if (!phone.trim()) {
      showToast('Please enter your phone number', 'warning');
      return;
    }
    if (!emergencyContactName.trim()) {
      showToast('Please enter emergency contact name', 'warning');
      return;
    }
    if (!emergencyContactPhone.trim()) {
      showToast('Please enter emergency contact phone number', 'warning');
      return;
    }

    setLoading(true);
    console.log('Loading set to true, starting registration...');
    
    try {
      // Normalize student number to uppercase
      const normalizedStudentNumber = studentNumber.trim().toUpperCase();
      
      console.log('Calling signUp...');
      const { user, error } = await signUp({
        email: email.trim(),
        password,
        username: username.trim().toLowerCase(),
        studentNumber: normalizedStudentNumber,
        phone: phone.trim(),
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
        location: location.trim() || undefined,
        preferredContactMethod: preferredContactMethod || undefined,
        role: 'student',
      });

      console.log('signUp response:', { user: !!user, error });

      if (error) {
        console.error('SignUp error:', error);
        const errorMsg = error.message || 'Registration failed. Please try again.';
        showToast(errorMsg, 'error', 5000);
        // Fallback alert
        Alert.alert('Registration Failed', errorMsg);
        setLoading(false);
        return;
      }

      if (!user) {
        console.error('No user returned from signUp');
        const errorMsg = 'Registration failed. Please try again.';
        showToast(errorMsg, 'error', 5000);
        // Fallback alert
        Alert.alert('Registration Failed', errorMsg);
        setLoading(false);
        return;
      }

      console.log('User created successfully!');
      showToast('Account created! Check your email for the verification code.', 'success', 3000);
      
      // Supabase automatically sends the OTP token via email when signUp is called
      // (if configured to use tokens in Supabase dashboard)
      // Redirect to verification screen
      console.log('Registration successful, redirecting to verification...');
      setTimeout(() => {
        router.replace({
          pathname: '/auth/verify-email',
          params: { email: email.trim() },
        });
      }, 2000);
    } catch (error: any) {
      console.error('Registration exception:', error);
      showToast(error?.message || 'An error occurred. Please try again.', 'error', 5000);
      setLoading(false);
    }
  };

  const headerColor = '#1E40AF'; // Always dark blue
  const waveColor = '#60A5FA'; // Always light blue

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header with Wave Pattern */}
        <View style={[styles.header, { backgroundColor: headerColor }]}>
          <View style={styles.headerContent}>
            <ThemedText type="h1" style={styles.headerTitle}>
              Create Account
            </ThemedText>
            <ThemedText type="body" style={styles.headerSubtitle}>
              Create your anonymous account to join the support community
            </ThemedText>
          </View>
          <View style={styles.waveContainer}>
            <WavePattern color={waveColor} />
          </View>
        </View>

        {/* Curved separator for visual effect */}
        <View style={styles.curveSeparator} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.mainContent}>
                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                  {[1, 2, 3, 4].map((step) => (
                    <View key={step} style={styles.progressStep}>
                      <View
                        style={[
                          styles.progressDot,
                          {
                            backgroundColor: step <= currentStep ? '#8B5CF6' : '#FFFFFF40',
                          },
                        ]}
                      />
                      {step < 4 && (
                        <View
                          style={[
                            styles.progressLine,
                            {
                              backgroundColor: step < currentStep ? '#8B5CF6' : '#FFFFFF40',
                            },
                          ]}
                        />
                      )}
                    </View>
                  ))}
                </View>

                <ThemedText type="h1" style={styles.title}>
                  Sign up
                </ThemedText>

                {/* Step 1: Email & Password */}
                {currentStep === 1 && (
                  <View style={styles.stepContent}>
                    <View style={styles.inputContainer}>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: '#2A2A3E',
                            borderColor: 
                              emailStatus === 'taken' ? '#EF4444' :
                              emailStatus === 'available' ? '#10B981' :
                              emailStatus === 'invalid' ? '#EF4444' :
                              focusedInput === 'email' ? '#8B5CF6' : '#FFFFFF20',
                            borderWidth: focusedInput === 'email' || emailStatus !== 'idle' ? 2 : 1,
                          },
                        ]}
                      >
                        <Ionicons 
                          name="mail-outline" 
                          size={20} 
                          color={
                            emailStatus === 'taken' ? '#EF4444' :
                            emailStatus === 'available' ? '#10B981' :
                            emailStatus === 'invalid' ? '#EF4444' :
                            '#FFFFFF'
                          }
                          style={styles.inputIcon} 
                        />
                        <TextInput
                          style={[styles.input, styles.inputText, createInputStyle()]}
                          placeholder="Enter your email"
                          placeholderTextColor="#FFFFFF80"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!loading}
                          onFocus={() => setFocusedInput('email')}
                          onBlur={() => setFocusedInput(null)}
                        />
                        {emailStatus === 'checking' && (
                          <ActivityIndicator size="small" color="#3B82F6" style={{ marginRight: 10 }} />
                        )}
                        {emailStatus === 'available' && (
                          <Ionicons name="checkmark-circle" size={20} color="#10B981" style={{ marginRight: 10 }} />
                        )}
                        {emailStatus === 'taken' && (
                          <Ionicons name="close-circle" size={20} color="#EF4444" style={{ marginRight: 10 }} />
                        )}
                        {emailStatus === 'invalid' && email.length > 0 && (
                          <Ionicons name="alert-circle" size={20} color="#EF4444" style={{ marginRight: 10 }} />
                        )}
                      </View>
                      {emailStatus === 'taken' && (
                        <ThemedText type="small" style={{ color: '#EF4444', marginTop: 5, marginLeft: 5 }}>
                          This email is already registered. Please use a different email or try signing in.
                        </ThemedText>
                      )}
                      {emailStatus === 'invalid' && email.length > 0 && (
                        <ThemedText type="small" style={{ color: '#EF4444', marginTop: 5, marginLeft: 5 }}>
                          Please enter a valid email address.
                        </ThemedText>
                      )}
                      {emailStatus === 'available' && (
                        <ThemedText type="small" style={{ color: '#10B981', marginTop: 5, marginLeft: 5 }}>
                          Email is available ✓
                        </ThemedText>
                      )}
                    </View>

                    <View style={styles.inputContainer}>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: '#2A2A3E',
                            borderColor: focusedInput === 'password' ? '#8B5CF6' : '#FFFFFF20',
                            borderWidth: focusedInput === 'password' ? 2 : 1,
                          },
                        ]}
                      >
                        <Ionicons 
                          name="lock-closed-outline" 
                          size={20} 
                          color="#FFFFFF" 
                          style={styles.inputIcon} 
                        />
                        <TextInput
                          style={[styles.input, styles.inputText, createInputStyle()]}
                          placeholder="Enter your Password"
                          placeholderTextColor="#FFFFFF80"
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          autoComplete="off"
                          textContentType="none"
                          passwordRules="minlength: 8; required: lower; required: upper; required: digit;"
                          editable={!loading}
                          onFocus={() => setFocusedInput('password')}
                          onBlur={() => setFocusedInput(null)}
                          onSelectionChange={() => {
                            // Prevent clipboard access on password field
                            // This is handled by secureTextEntry and textContentType
                          }}
                          contextMenuHidden={true}
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword(!showPassword)}
                          style={styles.eyeIcon}
                        >
                          <Ionicons
                            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                            size={20}
                            color="#FFFFFF"
                          />
                        </TouchableOpacity>
                      </View>
                      {password.length > 0 && (
                        <View style={styles.strengthContainer}>
                          <View style={styles.strengthBar}>
                            {[1, 2, 3, 4].map((level) => (
                              <View
                                key={level}
                                style={[
                                  styles.strengthSegment,
                                  {
                                    backgroundColor:
                                      level <= passwordStrength.strength
                                        ? passwordStrength.color
                                        : colors.border,
                                  },
                                ]}
                              />
                            ))}
                          </View>
                          <ThemedText type="small" style={{ color: passwordStrength.color, fontWeight: '600' }}>
                            {passwordStrength.label}
                          </ThemedText>
                        </View>
                      )}
                      {focusedInput === 'password' && (
                        <View style={{ marginTop: 8, marginLeft: 5 }}>
                          <ThemedText type="small" style={{ color: '#9CA3AF', marginBottom: 4 }}>
                            Password must contain:
                          </ThemedText>
                          <View style={{ marginLeft: 10 }}>
                            <ThemedText 
                              type="small" 
                              style={{ 
                                color: password.length >= 8 ? '#10B981' : '#6B7280',
                                marginBottom: 2 
                              }}
                            >
                              {password.length >= 8 ? '✓' : '•'} At least 8 characters
                            </ThemedText>
                            <ThemedText 
                              type="small" 
                              style={{ 
                                color: /[A-Z]/.test(password) ? '#10B981' : '#6B7280',
                                marginBottom: 2 
                              }}
                            >
                              {/[A-Z]/.test(password) ? '✓' : '•'} One uppercase letter
                            </ThemedText>
                            <ThemedText 
                              type="small" 
                              style={{ 
                                color: /[a-z]/.test(password) ? '#10B981' : '#6B7280',
                                marginBottom: 2 
                              }}
                            >
                              {/[a-z]/.test(password) ? '✓' : '•'} One lowercase letter
                            </ThemedText>
                            <ThemedText 
                              type="small" 
                              style={{ 
                                color: /[0-9]/.test(password) ? '#10B981' : '#6B7280',
                                marginBottom: 2 
                              }}
                            >
                              {/[0-9]/.test(password) ? '✓' : '•'} One number
                            </ThemedText>
                          </View>
                        </View>
                      )}
                    </View>

                    <View style={styles.inputContainer}>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: '#2A2A3E',
                            borderColor:
                              focusedInput === 'confirmPassword'
                                ? colors.primary
                                : confirmPassword.length > 0 && password !== confirmPassword
                                ? colors.danger
                                : colors.border,
                            borderWidth: focusedInput === 'confirmPassword' ? 2 : 1,
                          },
                        ]}
                      >
                        <Ionicons 
                          name="lock-closed-outline" 
                          size={20} 
                          color="#FFFFFF" 
                          style={styles.inputIcon} 
                        />
                        <TextInput
                          style={[styles.input, styles.inputText, createInputStyle()]}
                          placeholder="Confirm your Password"
                          placeholderTextColor="#FFFFFF80"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          autoComplete="off"
                          textContentType="none"
                          passwordRules="minlength: 8; required: lower; required: upper; required: digit;"
                          editable={!loading}
                          contextMenuHidden={true}
                          onFocus={() => setFocusedInput('confirmPassword')}
                          onBlur={() => setFocusedInput(null)}
                        />
                        <TouchableOpacity
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={styles.eyeIcon}
                        >
                          <Ionicons
                            name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                            size={20}
                            color="#FFFFFF"
                          />
                        </TouchableOpacity>
                      </View>
                      {confirmPassword.length > 0 && password !== confirmPassword && (
                        <ThemedText type="small" style={{ color: '#EF4444', marginTop: Spacing.xs }}>
                          Passwords do not match
                        </ThemedText>
                      )}
                    </View>

                    <View style={styles.inputContainer}>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: '#2A2A3E',
                            borderColor:
                              focusedInput === 'studentNumber'
                                ? '#8B5CF6'
                                : studentNumberStatus === 'taken'
                                ? '#EF4444'
                                : studentNumberStatus === 'available'
                                ? '#10B981'
                                : studentNumber.length > 0 && !isValidStudentNumber(studentNumber)
                                ? '#EF4444'
                                : isValidStudentNumber(studentNumber) && studentNumberStatus === 'idle'
                                ? '#10B981'
                                : '#FFFFFF20',
                            borderWidth: focusedInput === 'studentNumber' ? 2 : 1,
                          },
                        ]}
                      >
                        <Ionicons 
                          name="school-outline" 
                          size={20} 
                          color="#FFFFFF" 
                          style={styles.inputIcon} 
                        />
                        <TextInput
                          style={[styles.input, styles.inputText, createInputStyle()]}
                          placeholder="CUT Student Number (e.g., C23155538O)"
                          placeholderTextColor="#FFFFFF80"
                          value={studentNumber}
                          onChangeText={(text) => setStudentNumber(text.toUpperCase())}
                          autoCapitalize="characters"
                          autoCorrect={false}
                          editable={!loading}
                          onFocus={() => setFocusedInput('studentNumber')}
                          onBlur={() => setFocusedInput(null)}
                        />
                        {studentNumberStatus === 'checking' && (
                          <ActivityIndicator size="small" color="#8B5CF6" style={styles.statusIcon} />
                        )}
                        {studentNumberStatus === 'available' && (
                          <Ionicons name="checkmark-circle" size={24} color="#10B981" style={styles.statusIcon} />
                        )}
                        {studentNumberStatus === 'taken' && (
                          <Ionicons name="close-circle" size={24} color="#EF4444" style={styles.statusIcon} />
                        )}
                        {studentNumber.length > 0 && !isValidStudentNumber(studentNumber) && studentNumberStatus === 'idle' && (
                          <Ionicons name="close-circle" size={24} color="#EF4444" style={styles.statusIcon} />
                        )}
                        {isValidStudentNumber(studentNumber) && studentNumberStatus === 'idle' && (
                          <Ionicons name="checkmark-circle" size={24} color="#10B981" style={styles.statusIcon} />
                        )}
                      </View>
                      {studentNumber.length > 0 && !isValidStudentNumber(studentNumber) && (
                        <ThemedText type="small" style={{ color: '#EF4444', marginTop: Spacing.xs }}>
                          Format: Letter + 8 digits + Letter (e.g., C23155538O)
                        </ThemedText>
                      )}
                      {studentNumberStatus === 'checking' && (
                        <ThemedText type="small" style={{ color: '#8B5CF6', marginTop: Spacing.xs }}>
                          Checking availability...
                        </ThemedText>
                      )}
                      {studentNumberStatus === 'taken' && (
                        <ThemedText type="small" style={{ color: '#EF4444', marginTop: Spacing.xs }}>
                          ✗ This student number is already registered. Please contact support if this is an error.
                        </ThemedText>
                      )}
                      {studentNumberStatus === 'available' && (
                        <ThemedText type="small" style={{ color: '#10B981', marginTop: Spacing.xs }}>
                          ✓ Valid and available student number
                        </ThemedText>
                      )}
                      {isValidStudentNumber(studentNumber) && studentNumberStatus === 'idle' && (
                        <ThemedText type="small" style={{ color: '#10B981', marginTop: Spacing.xs }}>
                          ✓ Valid CUT student number
                        </ThemedText>
                      )}
                    </View>
                  </View>
                )}

                {/* Step 2: Username */}
                {currentStep === 2 && (
                  <View style={styles.stepContent}>
                    <ThemedText type="body" style={styles.stepDescription}>
                      Choose a unique anonymous username. This will be how others see you on the platform.
                    </ThemedText>
                    <View style={styles.inputContainer}>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: '#2A2A3E',
                            borderColor:
                              focusedInput === 'username'
                                ? '#8B5CF6'
                                : usernameStatus === 'taken' || usernameStatus === 'invalid'
                                ? '#EF4444'
                                : usernameStatus === 'available'
                                ? '#10B981'
                                : '#FFFFFF20',
                            borderWidth: focusedInput === 'username' ? 2 : 1,
                          },
                        ]}
                      >
                        <Ionicons 
                          name="person-outline" 
                          size={20} 
                          color="#FFFFFF" 
                          style={styles.inputIcon} 
                        />
                        <TextInput
                          style={[styles.input, styles.inputText, createInputStyle()]}
                          placeholder="Enter anonymous username"
                          placeholderTextColor="#FFFFFF80"
                          value={username}
                          onChangeText={setUsername}
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!loading}
                          onFocus={() => setFocusedInput('username')}
                          onBlur={() => setFocusedInput(null)}
                        />
                        {usernameStatus === 'checking' && (
                          <ActivityIndicator size="small" color="#8B5CF6" style={styles.statusIcon} />
                        )}
                        {usernameStatus === 'available' && (
                          <Ionicons name="checkmark-circle" size={24} color="#10B981" style={styles.statusIcon} />
                        )}
                        {usernameStatus === 'taken' && (
                          <Ionicons name="close-circle" size={24} color="#EF4444" style={styles.statusIcon} />
                        )}
                        {usernameStatus === 'invalid' && (
                          <Ionicons name="close-circle" size={24} color="#EF4444" style={styles.statusIcon} />
                        )}
                      </View>
                      <View style={styles.usernameHint}>
                        {username.length === 0 ? (
                          <ThemedText type="small" style={{ color: '#FFFFFF80' }}>
                            Enter a username to check availability
                          </ThemedText>
                        ) : username.length < 3 ? (
                          <ThemedText type="small" style={{ color: '#FFFFFF80' }}>
                            Minimum 3 characters
                          </ThemedText>
                        ) : usernameStatus === 'checking' ? (
                          <View style={styles.hintRow}>
                            <ActivityIndicator size="small" color="#8B5CF6" style={styles.hintIcon} />
                            <ThemedText type="small" style={{ color: '#FFFFFF' }}>
                              Checking availability...
                            </ThemedText>
                          </View>
                        ) : usernameStatus === 'available' ? (
                          <View style={styles.hintRow}>
                            <Ionicons name="checkmark-circle" size={18} color="#10B981" style={styles.hintIcon} />
                            <ThemedText type="small" style={{ color: '#10B981', fontWeight: '600' }}>
                              ✓ Username is available!
                            </ThemedText>
                          </View>
                        ) : usernameStatus === 'taken' ? (
                          <View style={styles.hintRow}>
                            <Ionicons name="close-circle" size={16} color="#EF4444" style={styles.hintIcon} />
                            <ThemedText type="small" style={{ color: '#EF4444', fontWeight: '600' }}>
                              ✗ Username is already taken. Please choose another.
                            </ThemedText>
                          </View>
                        ) : usernameStatus === 'invalid' ? (
                          <View style={styles.hintRow}>
                            <Ionicons name="close-circle" size={16} color="#EF4444" style={styles.hintIcon} />
                            <ThemedText type="small" style={{ color: '#EF4444', fontWeight: '600' }}>
                              ✗ Username must be 3-20 characters, alphanumeric, underscore, or hyphen only
                            </ThemedText>
                          </View>
                        ) : (
                          <ThemedText type="small" style={{ color: '#FFFFFF80' }}>
                            Type a username to check availability
                          </ThemedText>
                        )}
                      </View>
                    </View>
                  </View>
                )}

                {/* Step 3: Contact Information */}
                {currentStep === 3 && (
                  <View style={styles.stepContent}>
                    <ThemedText type="body" style={styles.stepDescription}>
                      Provide contact information for crisis intervention. This information is only accessible to authorized counselors and will only be used in emergency situations.
                    </ThemedText>
                    
                    <View style={styles.inputContainer}>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: '#2A2A3E',
                            borderColor: focusedInput === 'phone' ? '#8B5CF6' : '#FFFFFF20',
                            borderWidth: focusedInput === 'phone' ? 2 : 1,
                          },
                        ]}
                      >
                        <Ionicons 
                          name="call-outline" 
                          size={20} 
                          color="#FFFFFF" 
                          style={styles.inputIcon} 
                        />
                        <TextInput
                          style={[styles.input, styles.inputText, createInputStyle()]}
                          placeholder="Your Phone Number"
                          placeholderTextColor="#FFFFFF80"
                          value={phone}
                          onChangeText={setPhone}
                          keyboardType="phone-pad"
                          editable={!loading}
                          onFocus={() => setFocusedInput('phone')}
                          onBlur={() => setFocusedInput(null)}
                        />
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: '#2A2A3E',
                            borderColor: focusedInput === 'emergencyContactName' ? '#8B5CF6' : '#FFFFFF20',
                            borderWidth: focusedInput === 'emergencyContactName' ? 2 : 1,
                          },
                        ]}
                      >
                        <Ionicons 
                          name="person-outline" 
                          size={20} 
                          color="#FFFFFF" 
                          style={styles.inputIcon} 
                        />
                        <TextInput
                          style={[styles.input, styles.inputText, createInputStyle()]}
                          placeholder="Emergency Contact Name"
                          placeholderTextColor="#FFFFFF80"
                          value={emergencyContactName}
                          onChangeText={setEmergencyContactName}
                          editable={!loading}
                          onFocus={() => setFocusedInput('emergencyContactName')}
                          onBlur={() => setFocusedInput(null)}
                        />
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: '#2A2A3E',
                            borderColor: focusedInput === 'emergencyContactPhone' ? '#8B5CF6' : '#FFFFFF20',
                            borderWidth: focusedInput === 'emergencyContactPhone' ? 2 : 1,
                          },
                        ]}
                      >
                        <Ionicons 
                          name="call-outline" 
                          size={20} 
                          color="#FFFFFF" 
                          style={styles.inputIcon} 
                        />
                        <TextInput
                          style={[styles.input, styles.inputText, createInputStyle()]}
                          placeholder="Emergency Contact Phone"
                          placeholderTextColor="#FFFFFF80"
                          value={emergencyContactPhone}
                          onChangeText={setEmergencyContactPhone}
                          keyboardType="phone-pad"
                          editable={!loading}
                          onFocus={() => setFocusedInput('emergencyContactPhone')}
                          onBlur={() => setFocusedInput(null)}
                        />
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: '#2A2A3E',
                            borderColor: focusedInput === 'location' ? '#8B5CF6' : '#FFFFFF20',
                            borderWidth: focusedInput === 'location' ? 2 : 1,
                          },
                        ]}
                      >
                        <Ionicons 
                          name="location-outline" 
                          size={20} 
                          color="#FFFFFF" 
                          style={styles.inputIcon} 
                        />
                        <TextInput
                          style={[styles.input, styles.inputText, createInputStyle()]}
                          placeholder="Location (Optional - e.g., Dorm/Hostel, Room Number)"
                          placeholderTextColor="#FFFFFF80"
                          value={location}
                          onChangeText={setLocation}
                          editable={!loading}
                          onFocus={() => setFocusedInput('location')}
                          onBlur={() => setFocusedInput(null)}
                        />
                      </View>
                    </View>
                  </View>
                )}

                {/* Step 4: Terms */}
                {currentStep === 4 && (
                  <View style={styles.stepContent}>
                    <ThemedText type="body" style={styles.stepDescription}>
                      Review and accept the terms to complete your registration.
                    </ThemedText>
                    <TouchableOpacity
                      style={styles.termsContainer}
                      onPress={() => setAcceptedTerms(!acceptedTerms)}
                      disabled={loading}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          {
                            backgroundColor: acceptedTerms ? '#8B5CF6' : 'transparent',
                            borderColor: acceptedTerms ? '#8B5CF6' : '#FFFFFF40',
                          },
                        ]}
                      >
                        {acceptedTerms && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                      </View>
                      <ThemedText type="small" style={[styles.termsText, { color: colors.text }]}>
                        I agree to the{' '}
                        <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600' }}>
                          Terms & Conditions
                        </ThemedText>
                        {' '}and{' '}
                        <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600' }}>
                          Privacy Policy
                        </ThemedText>
                        . I understand that my anonymous username will be used throughout the platform and I will maintain respectful and supportive interactions.
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Navigation Buttons */}
                <View style={styles.buttonRow}>
                  {currentStep > 1 && (
                    <TouchableOpacity
                      style={[styles.backButton, { borderColor: colors.border }]}
                      onPress={handleBack}
                      disabled={loading}
                    >
                      <Ionicons name="arrow-back" size={20} color={colors.text} />
                      <ThemedText type="body" style={[styles.backButtonText, { color: colors.text }]}>
                        Back
                      </ThemedText>
                    </TouchableOpacity>
                  )}

                  {currentStep < 4 ? (
                    <TouchableOpacity
                      style={[
                        styles.nextButton,
                        { backgroundColor: '#8B5CF6' },
                        ((currentStep === 1 && !canProceedToStep2()) || 
                         (currentStep === 2 && !canProceedToStep3()) ||
                         (currentStep === 3 && !canProceedToStep4())) && styles.buttonDisabled,
                      ]}
                      onPress={handleNext}
                      disabled={
                        loading ||
                        (currentStep === 1 && !canProceedToStep2()) ||
                        (currentStep === 2 && !canProceedToStep3()) ||
                        (currentStep === 3 && !canProceedToStep4())
                      }
                      activeOpacity={0.8}
                    >
                        <View style={styles.buttonTextContainer}>
                          <ThemedText type="body" style={styles.buttonText}>
                            Next
                          </ThemedText>
                          <ThemedText type="body" style={styles.buttonArrow}>
                            →
                          </ThemedText>
                        </View>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.nextButton,
                        { backgroundColor: loading ? '#6D28D9' : '#8B5CF6' },
                        (!acceptedTerms || loading) && styles.buttonDisabled,
                        createShadow(4, colors.primary, 0.3),
                      ]}
                      onPress={() => {
                        // Haptic feedback
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        
                        console.log('Sign up button pressed');
                        console.log('acceptedTerms:', acceptedTerms);
                        console.log('loading:', loading);
                        
                        if (!acceptedTerms) {
                          showToast('Please accept the terms and conditions to continue', 'warning');
                          return;
                        }
                        
                        if (loading) {
                          console.log('Already loading, ignoring press');
                          return;
                        }
                        
                        handleRegister();
                      }}
                      disabled={loading}
                      activeOpacity={0.7}
                    >
                      {loading ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <ActivityIndicator color="#FFFFFF" size="small" />
                          <ThemedText type="body" style={styles.buttonText}>
                            Creating account...
                          </ThemedText>
                        </View>
                      ) : (
                        <>
                          <ThemedText type="body" style={styles.buttonText}>
                            Sign up
                          </ThemedText>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Sign In Link */}
                <View style={styles.signInContainer}>
                  <ThemedText type="body" style={styles.signInText}>
                    Already have an account?
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => router.push('/auth/login')}
                    disabled={loading}
                    style={styles.signInLinkContainer}
                  >
                    <ThemedText type="body" style={styles.signInLink}>
                      Sign in
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
        <ToastComponent />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.xl + 10,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl + 20,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E0E7FF',
    lineHeight: 24,
    opacity: 0.95,
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  curveSeparator: {
    height: 32,
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    zIndex: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressLine: {
    flex: 1,
    height: 2,
    marginHorizontal: Spacing.xs,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  mainContent: {
    padding: Spacing.xl,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    minHeight: '100%',
    backgroundColor: '#0F172A',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: Spacing.xl,
    color: '#FFFFFF',
  },
  stepContent: {
    marginBottom: Spacing.xl,
  },
  stepDescription: {
    marginBottom: Spacing.lg,
    lineHeight: 22,
    color: '#FFFFFF',
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 56,
  },
  inputText: {
    color: '#FFFFFF',
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  statusIcon: {
    marginLeft: Spacing.xs,
  },
  eyeIcon: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  strengthBar: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  usernameHint: {
    marginTop: Spacing.sm,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  hintIcon: {
    marginRight: 0,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    lineHeight: 20,
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    flex: 1,
    gap: Spacing.xs,
  },
  backButtonText: {
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    flex: 2,
    height: 56,
  },
  buttonTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 20,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    fontStyle: 'italic',
  },
  buttonArrow: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 20,
    marginLeft: Spacing.xs,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    fontStyle: 'italic',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  signInText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  signInLinkContainer: {
    alignItems: 'flex-end',
  },
  signInLink: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
    textAlign: 'right',
  },
});
