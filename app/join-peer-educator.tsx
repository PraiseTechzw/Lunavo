/**
 * Join Peer Educator Club Screen
 * Dedicated screen for students to apply to become peer educators
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createMembershipRequest, getCurrentUser, getMembershipRequestByUserId } from '@/lib/database';
import { createInputStyle, getCursorStyle } from '@/utils/platform-styles';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function JoinPeerEducatorScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [membershipRequest, setMembershipRequest] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Application form state
  const [motivation, setMotivation] = useState('');
  const [experience, setExperience] = useState('');
  const [availability, setAvailability] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        // Check if user is already a peer educator
        const isPeerEducator = ['peer-educator', 'peer-educator-executive', 'admin'].includes(currentUser.role);
        if (isPeerEducator) {
          Alert.alert(
            'Already a Member',
            'You are already a member of the Peer Educator Club!',
            [
              {
                text: 'View Club Info',
                onPress: () => router.push('/peer-educator/club-info'),
              },
              {
                text: 'Go Back',
                style: 'cancel',
                onPress: () => router.back(),
              },
            ]
          );
          return;
        }

        // Check for existing membership request
        const request = await getMembershipRequestByUserId(currentUser.id);
        setMembershipRequest(request);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to apply.');
      return;
    }

    if (!motivation.trim()) {
      Alert.alert('Required Field', 'Please explain your motivation for joining the Peer Educator Club.');
      return;
    }

    if (motivation.trim().length < 50) {
      Alert.alert('Insufficient Detail', 'Please provide at least 50 characters explaining your motivation.');
      return;
    }

    // Check if user already has a pending request
    if (membershipRequest && membershipRequest.status === 'pending') {
      Alert.alert(
        'Application Pending',
        'You already have a pending membership request. Please wait for it to be reviewed by the executive committee.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSubmitting(true);
    try {
      const request = await createMembershipRequest({
        motivation: motivation.trim(),
        experience: experience.trim() || undefined,
        availability: availability.trim() || undefined,
        additionalInfo: additionalInfo.trim() || undefined,
      });

      setMembershipRequest(request);
      setMotivation('');
      setExperience('');
      setAvailability('');
      setAdditionalInfo('');

      Alert.alert(
        'Application Submitted',
        'Your membership application has been submitted successfully. The executive committee will review it and get back to you soon.',
        [
          {
            text: 'View Club Info',
            onPress: () => router.push('/peer-educator/club-info'),
          },
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ThemedView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText type="body" style={{ marginTop: Spacing.md, color: colors.text }}>
              Loading...
            </ThemedText>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  // If user is already a peer educator, show message
  if (user && ['peer-educator', 'peer-educator-executive', 'admin'].includes(user.role)) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="h2" style={styles.headerTitle}>
              Join Peer Educator Club
            </ThemedText>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.alreadyMemberContainer}>
            <MaterialIcons name="check-circle" size={64} color={colors.success} />
            <ThemedText type="h3" style={[styles.alreadyMemberTitle, { color: colors.text }]}>
              You're Already a Member!
            </ThemedText>
            <ThemedText type="body" style={[styles.alreadyMemberText, { color: colors.icon }]}>
              You are already a member of the Peer Educator Club.
            </ThemedText>
            <TouchableOpacity
              style={[styles.viewClubButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/peer-educator/club-info')}
            >
              <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                View Club Information
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
                <MaterialIcons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <ThemedText type="h2" style={styles.headerTitle}>
                Join Peer Educator Club
              </ThemedText>
              <View style={{ width: 24 }} />
            </View>

            {/* Status Display */}
            {membershipRequest?.status === 'pending' && (
              <View style={[styles.statusCard, { backgroundColor: colors.warning + '20', borderColor: colors.warning + '40' }]}>
                <MaterialIcons name="pending" size={32} color={colors.warning} />
                <View style={styles.statusContent}>
                  <ThemedText type="body" style={[styles.statusTitle, { color: colors.warning }]}>
                    Application Pending Review
                  </ThemedText>
                  <ThemedText type="small" style={[styles.statusText, { color: colors.icon }]}>
                    Submitted on {format(new Date(membershipRequest.createdAt), 'MMM dd, yyyy')}
                  </ThemedText>
                  <ThemedText type="small" style={[styles.statusText, { color: colors.icon, marginTop: Spacing.xs }]}>
                    The executive committee will review your application and get back to you soon.
                  </ThemedText>
                </View>
              </View>
            )}

            {membershipRequest?.status === 'approved' && (
              <View style={[styles.statusCard, { backgroundColor: colors.success + '20', borderColor: colors.success + '40' }]}>
                <MaterialIcons name="check-circle" size={32} color={colors.success} />
                <View style={styles.statusContent}>
                  <ThemedText type="body" style={[styles.statusTitle, { color: colors.success }]}>
                    Application Approved!
                  </ThemedText>
                  <ThemedText type="small" style={[styles.statusText, { color: colors.icon }]}>
                    Congratulations! Your application has been approved. You are now a member of the Peer Educator Club.
                  </ThemedText>
                </View>
              </View>
            )}

            {membershipRequest?.status === 'rejected' && (
              <View style={[styles.statusCard, { backgroundColor: '#F44336' + '20', borderColor: '#F44336' + '40' }]}>
                <MaterialIcons name="cancel" size={32} color="#F44336" />
                <View style={styles.statusContent}>
                  <ThemedText type="body" style={[styles.statusTitle, { color: '#F44336' }]}>
                    Application Rejected
                  </ThemedText>
                  <ThemedText type="small" style={[styles.statusText, { color: colors.icon }]}>
                    {membershipRequest.reviewNotes || 'Your application was not approved at this time.'}
                  </ThemedText>
                  <ThemedText type="small" style={[styles.statusText, { color: colors.icon, marginTop: Spacing.xs }]}>
                    You can submit a new application if you wish.
                  </ThemedText>
                </View>
              </View>
            )}

            {/* Application Form - Only show if no pending request */}
            {(!membershipRequest || membershipRequest.status !== 'pending') && (
              <>
                {/* Info Section */}
                <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
                  <MaterialIcons name="info" size={24} color={colors.primary} />
                  <View style={styles.infoContent}>
                    <ThemedText type="body" style={[styles.infoTitle, { color: colors.text }]}>
                      About the Peer Educator Club
                    </ThemedText>
                    <ThemedText type="small" style={[styles.infoText, { color: colors.icon }]}>
                      The Peer Educator Club at Chinhoyi University of Technology is dedicated to providing peer support, mental health awareness, and student wellness initiatives. As a peer educator, you'll help support fellow students through active listening, providing resources, and creating a supportive community.
                    </ThemedText>
                  </View>
                </View>

                {/* Application Form */}
                <View style={styles.formSection}>
                  <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
                    Application Form
                  </ThemedText>

                  {/* Motivation - Required */}
                  <View style={styles.inputGroup}>
                    <ThemedText type="body" style={[styles.label, { color: colors.text }]}>
                      Why do you want to join? <ThemedText style={{ color: colors.danger }}>*</ThemedText>
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.textArea,
                        createInputStyle(),
                        { color: colors.text, minHeight: 120 },
                      ]}
                      placeholder="Please explain your motivation for joining the Peer Educator Club (minimum 50 characters)..."
                      placeholderTextColor={colors.icon}
                      value={motivation}
                      onChangeText={setMotivation}
                      multiline
                      numberOfLines={6}
                      textAlignVertical="top"
                    />
                    <ThemedText type="small" style={[styles.helperText, { color: colors.icon }]}>
                      {motivation.length}/50 characters minimum
                    </ThemedText>
                  </View>

                  {/* Experience - Optional */}
                  <View style={styles.inputGroup}>
                    <ThemedText type="body" style={[styles.label, { color: colors.text }]}>
                      Relevant Experience (Optional)
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.textArea,
                        createInputStyle(),
                        { color: colors.text, minHeight: 100 },
                      ]}
                      placeholder="Any previous experience in peer support, counseling, or related fields..."
                      placeholderTextColor={colors.icon}
                      value={experience}
                      onChangeText={setExperience}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Availability - Optional */}
                  <View style={styles.inputGroup}>
                    <ThemedText type="body" style={[styles.label, { color: colors.text }]}>
                      Availability (Optional)
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.textArea,
                        createInputStyle(),
                        { color: colors.text, minHeight: 80 },
                      ]}
                      placeholder="Your availability for meetings and activities..."
                      placeholderTextColor={colors.icon}
                      value={availability}
                      onChangeText={setAvailability}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Additional Info - Optional */}
                  <View style={styles.inputGroup}>
                    <ThemedText type="body" style={[styles.label, { color: colors.text }]}>
                      Additional Information (Optional)
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.textArea,
                        createInputStyle(),
                        { color: colors.text, minHeight: 80 },
                      ]}
                      placeholder="Any other information you'd like to share..."
                      placeholderTextColor={colors.icon}
                      value={additionalInfo}
                      onChangeText={setAdditionalInfo}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      {
                        backgroundColor: colors.primary,
                        opacity: motivation.trim().length >= 50 && !submitting ? 1 : 0.5,
                      },
                    ]}
                    onPress={handleSubmitApplication}
                    disabled={motivation.trim().length < 50 || submitting}
                    activeOpacity={0.8}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <MaterialIcons name="send" size={20} color="#FFFFFF" />
                        <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: Spacing.sm }}>
                          Submit Application
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Bottom Spacing */}
            <View style={{ height: Spacing.xl }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontWeight: '700',
  },
  statusCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  statusContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  statusTitle: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  statusText: {
    lineHeight: 20,
  },
  alreadyMemberContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  alreadyMemberTitle: {
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  alreadyMemberText: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  viewClubButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  infoCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  infoTitle: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  infoText: {
    lineHeight: 20,
  },
  formSection: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  textArea: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: 16,
    borderWidth: 1,
  },
  helperText: {
    marginTop: Spacing.xs,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
});
