/**
 * Club Information - About the Peer Educator Club
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createMembershipRequest, getCurrentUser, getMeetings, getPosts, getReplies } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { createShadow, getCursorStyle } from '@/utils/platform-styles';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Linking,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EXECUTIVE_COMMITTEE = [
  { 
    role: 'Club President', 
    name: 'Tafara Chakandinakira',
    image: require('@/assets/images/team/excutive/Tafara  Chakandinakira.jpg')
  },
  { 
    role: 'Vice President', 
    name: 'Tatenda Marundu',
    image: require('@/assets/images/team/excutive/Tatenda  Marundu                              .jpg')
  },
  { 
    role: 'Secretary', 
    name: 'Ashley Mashatise',
    image: require('@/assets/images/team/excutive/Ashley  Mashatise.jpg')
  },
  { 
    role: 'Treasurer', 
    name: 'Ruvarashe Mushonga',
    image: require('@/assets/images/team/excutive/Ruvarashe Mushonga   .jpg')
  },
  { 
    role: 'Information & Publicity', 
    name: 'Dalitso Chafuwa',
    image: require('@/assets/images/team/excutive/Dalitso Chafuwa.jpg')
  },
  { 
    role: 'Online Counselling Administrator', 
    name: 'Praise Masunga',
    image: require('@/assets/images/team/excutive/Praise Masunga.jpg')
  },
];

const COMMITTEE_MEMBERS = [
  {
    name: 'Anthony Manyadza',
    image: require('@/assets/images/team/Committe Members/Anthony Manyadza.jpg')
  },
  {
    name: 'Emily Chingwe',
    image: require('@/assets/images/team/Committe Members/Emily-Chingwe.jpg')
  },
  {
    name: 'Maita Muchenje',
    image: require('@/assets/images/team/Committe Members/Maita Muchenje.jpg')
  },
  {
    name: 'Moila Chiwota',
    image: require('@/assets/images/team/Committe Members/Moila Chiwota.jpg')
  },
  {
    name: 'Terrence Magura',
    image: require('@/assets/images/team/Committe Members/Terrence Magura.jpg')
  },
];

export default function ClubInfoScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const [user, setUser] = useState<any>(null);
  const [nextMeeting, setNextMeeting] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [membershipRequest, setMembershipRequest] = useState<any>(null);
  const [clubStats, setClubStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalResponses: 0,
    helpfulResponses: 0,
    upcomingMeetings: 0,
  });
  
  // Application form state
  const [motivation, setMotivation] = useState('');
  const [experience, setExperience] = useState('');
  const [availability, setAvailability] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        const isPeerEducator = ['peer-educator', 'peer-educator-executive', 'admin'].includes(currentUser.role);
        setIsMember(isPeerEducator);
      }

      // Get meetings
      const meetings = await getMeetings();
      const now = new Date();
      const upcoming = meetings
        .filter((m) => new Date(m.scheduledDate) >= now)
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
      
      if (upcoming.length > 0) {
        setNextMeeting(upcoming[0]);
      }

      // Load club statistics
      await loadClubStats();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadClubStats = async () => {
    try {
      // Get all peer educators
      const { data: members, error: membersError } = await supabase
        .from('users')
        .select('id, last_active')
        .in('role', ['peer-educator', 'peer-educator-executive']);

      if (membersError) throw membersError;

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const activeMembers = members?.filter((m: any) => 
        new Date(m.last_active) >= thirtyDaysAgo
      ).length || 0;

      // Get responses from peer educators
      const posts = await getPosts();
      const allReplies = await Promise.all(
        posts.map((p) => getReplies(p.id).catch(() => []))
      );
      const replies = allReplies.flat();
      
      // Filter replies from peer educators
      const memberIds = new Set(members?.map((m: any) => m.id) || []);
      const peerEducatorReplies = replies.filter((r) => memberIds.has(r.authorId));
      const helpfulResponses = peerEducatorReplies.filter((r) => r.isHelpful > 0).length;

      // Get upcoming meetings count
      const meetings = await getMeetings();
      const upcomingMeetings = meetings.filter((m) => 
        new Date(m.scheduledDate) >= now
      ).length;

      setClubStats({
        totalMembers: members?.length || 0,
        activeMembers,
        totalResponses: peerEducatorReplies.length,
        helpfulResponses,
        upcomingMeetings,
      });
    } catch (error) {
      console.error('Error loading club stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleJoinClub = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to join the club.');
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

    // Check if user has a rejected request
    if (membershipRequest && membershipRequest.status === 'rejected') {
      Alert.alert(
        'Application Rejected',
        `Your previous application was rejected.${membershipRequest.reviewNotes ? `\n\nReason: ${membershipRequest.reviewNotes}` : ''}\n\nYou can submit a new application if you wish.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Apply Again',
            onPress: () => setShowApplicationModal(true),
          },
        ]
      );
      return;
    }

    setShowApplicationModal(true);
  };

  const handleSubmitApplication = async () => {
    if (!motivation.trim()) {
      Alert.alert('Required Field', 'Please explain your motivation for joining the Peer Educator Club.');
      return;
    }

    if (motivation.trim().length < 50) {
      Alert.alert('Insufficient Detail', 'Please provide at least 50 characters explaining your motivation.');
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
      setShowApplicationModal(false);
      setMotivation('');
      setExperience('');
      setAvailability('');
      setAdditionalInfo('');

      Alert.alert(
        'Application Submitted',
        'Your membership application has been submitted successfully. The executive committee will review it and get back to you soon.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContact = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="h2" style={styles.headerTitle}>
              Club Information
            </ThemedText>
            <View style={{ width: 24 }} />
          </View>

          {/* About Section */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              About the Club
            </ThemedText>
            <ThemedText type="body" style={{ color: colors.text, lineHeight: 22, marginBottom: Spacing.md }}>
              The Peer Educator Club at Chinhoyi University of Technology is dedicated to providing
              anonymous peer support and early intervention for students facing various challenges.
              Our mission is to create a safe, supportive environment where students can seek help
              without fear of judgment or exposure.
            </ThemedText>
            <ThemedText type="body" style={{ color: colors.text, lineHeight: 22 }}>
              We provide support in areas including mental health, academic stress, relationships,
              substance abuse, sexual health, and crisis intervention. Our trained peer educators
              are here to listen, support, and guide students through difficult times.
            </ThemedText>
          </View>

          {/* Club Statistics */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Club Statistics
            </ThemedText>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <MaterialIcons name="people" size={24} color={colors.primary} />
                <ThemedText type="h3" style={{ color: colors.text, marginTop: Spacing.xs }}>
                  {clubStats.totalMembers}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Total Members
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <MaterialIcons name="check-circle" size={24} color={colors.success} />
                <ThemedText type="h3" style={{ color: colors.text, marginTop: Spacing.xs }}>
                  {clubStats.activeMembers}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Active (30 days)
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <MaterialIcons name="reply" size={24} color={colors.secondary} />
                <ThemedText type="h3" style={{ color: colors.text, marginTop: Spacing.xs }}>
                  {clubStats.totalResponses}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Total Responses
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <MaterialIcons name="thumb-up" size={24} color={colors.warning} />
                <ThemedText type="h3" style={{ color: colors.text, marginTop: Spacing.xs }}>
                  {clubStats.helpfulResponses}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Helpful Responses
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Executive Committee */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Executive Committee
            </ThemedText>
            {EXECUTIVE_COMMITTEE.map((member, index) => (
              <View key={index} style={styles.committeeMember}>
                <View style={styles.memberImageContainer}>
                  <ExpoImage
                    source={member.image}
                    style={styles.memberImage}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                </View>
                <View style={styles.memberInfo}>
                  <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }}>
                    {member.role}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                    {member.name}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>

          {/* Committee Members */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Committee Members
            </ThemedText>
            <View style={styles.committeeGrid}>
              {COMMITTEE_MEMBERS.map((member, index) => (
                <View key={index} style={styles.committeeMemberCard}>
                  <View style={styles.committeeMemberImageContainer}>
                    <ExpoImage
                      source={member.image}
                      style={styles.memberImage}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                    />
                  </View>
                  <ThemedText type="small" style={{ color: colors.text, marginTop: Spacing.xs, textAlign: 'center' }}>
                    {member.name}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* Meeting Schedule */}
          {nextMeeting && (
            <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <View style={styles.sectionHeader}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Next Meeting
              </ThemedText>
                {clubStats.upcomingMeetings > 1 && (
                  <ThemedText type="small" style={{ color: colors.primary }}>
                    +{clubStats.upcomingMeetings - 1} more
                  </ThemedText>
                )}
              </View>
              <TouchableOpacity
                style={styles.meetingInfo}
                onPress={() => router.push('/meetings' as any)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="event" size={24} color={colors.primary} />
                <View style={styles.meetingDetails}>
                  <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }}>
                    {nextMeeting.title}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                    {format(new Date(nextMeeting.scheduledDate), 'EEEE, MMMM dd, yyyy • HH:mm')}
                  </ThemedText>
                  {nextMeeting.location && (
                    <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                      📍 {nextMeeting.location}
                    </ThemedText>
                  )}
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>
          )}

          {/* Contact Information */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Contact Information
            </ThemedText>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleContact('studentaffairs@cut.ac.zw')}
            >
              <MaterialIcons name="email" size={20} color={colors.primary} />
              <ThemedText type="body" style={{ color: colors.text, marginLeft: Spacing.sm }}>
                studentaffairs@cut.ac.zw
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => Linking.openURL('tel:+26367222035')}
            >
              <MaterialIcons name="phone" size={20} color={colors.primary} />
              <ThemedText type="body" style={{ color: colors.text, marginLeft: Spacing.sm }}>
                +263 67 22203-5 Ext. 1297
              </ThemedText>
            </TouchableOpacity>
            <View style={styles.contactItem}>
              <MaterialIcons name="location-on" size={20} color={colors.primary} />
              <ThemedText type="body" style={{ color: colors.text, marginLeft: Spacing.sm }}>
                Division of Student Affairs{'\n'}
                Chinhoyi University of Technology{'\n'}
                P Bag 7724, Chinhoyi, Zimbabwe
              </ThemedText>
            </View>
          </View>

          {/* Join Club Button / Status */}
          {!isMember && (
            <>
              {membershipRequest?.status === 'pending' && (
                <View style={[styles.statusBadge, { backgroundColor: colors.warning + '20' }]}>
                  <MaterialIcons name="pending" size={24} color={colors.warning} />
                  <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                    <ThemedText type="body" style={{ color: colors.warning, fontWeight: '600' }}>
                      Application Pending Review
                    </ThemedText>
                    <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                      Submitted on {format(new Date(membershipRequest.createdAt), 'MMM dd, yyyy')}
                    </ThemedText>
                  </View>
                </View>
              )}
              
              {membershipRequest?.status === 'approved' && (
                <View style={[styles.memberBadge, { backgroundColor: colors.success + '20' }]}>
                  <MaterialIcons name="check-circle" size={24} color={colors.success} />
                  <ThemedText type="body" style={{ color: colors.success, fontWeight: '600', marginLeft: Spacing.sm }}>
                    Your application was approved! Please refresh to see your new status.
                  </ThemedText>
                </View>
              )}

              {(!membershipRequest || membershipRequest.status !== 'pending') && (
                <TouchableOpacity
                  style={[styles.joinButton, { backgroundColor: colors.primary }]}
                  onPress={handleJoinClub}
                >
                  <MaterialIcons name="person-add" size={24} color="#FFFFFF" />
                  <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: Spacing.sm }}>
                    Apply to Join the Club
                  </ThemedText>
                </TouchableOpacity>
              )}
            </>
          )}

          {isMember && (
            <View style={[styles.memberBadge, { backgroundColor: colors.success + '20' }]}>
              <MaterialIcons name="check-circle" size={24} color={colors.success} />
              <ThemedText type="body" style={{ color: colors.success, fontWeight: '600', marginLeft: Spacing.sm }}>
                You are a member of the Peer Educator Club
              </ThemedText>
            </View>
          )}
        </ScrollView>
      </ThemedView>

      {/* Application Modal */}
      <Modal
        visible={showApplicationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowApplicationModal(false)}
      >
        <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={() => setShowApplicationModal(false)} style={getCursorStyle()}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="h2" style={styles.modalTitle}>
              Apply to Join
            </ThemedText>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedText type="body" style={{ color: colors.text, marginBottom: Spacing.lg, lineHeight: 22 }}>
              Please fill out the application form below. The executive committee will review your application and get back to you.
            </ThemedText>

            <View style={styles.formGroup}>
              <ThemedText type="body" style={{ fontWeight: '600', color: colors.text, marginBottom: Spacing.sm }}>
                Motivation <ThemedText style={{ color: colors.danger }}>*</ThemedText>
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon, marginBottom: Spacing.xs }}>
                Why do you want to become a peer educator? (Minimum 50 characters)
              </ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={motivation}
                onChangeText={setMotivation}
                placeholder="Explain your motivation for joining the Peer Educator Club..."
                placeholderTextColor={colors.icon}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                {motivation.length} characters
              </ThemedText>
            </View>

            <View style={styles.formGroup}>
              <ThemedText type="body" style={{ fontWeight: '600', color: colors.text, marginBottom: Spacing.sm }}>
                Experience (Optional)
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon, marginBottom: Spacing.xs }}>
                Any relevant experience in counseling, mentoring, or peer support?
              </ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={experience}
                onChangeText={setExperience}
                placeholder="Describe any relevant experience..."
                placeholderTextColor={colors.icon}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText type="body" style={{ fontWeight: '600', color: colors.text, marginBottom: Spacing.sm }}>
                Availability (Optional)
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon, marginBottom: Spacing.xs }}>
                When are you typically available for club activities and meetings?
              </ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={availability}
                onChangeText={setAvailability}
                placeholder="e.g., Weekdays after 2 PM, Weekends..."
                placeholderTextColor={colors.icon}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText type="body" style={{ fontWeight: '600', color: colors.text, marginBottom: Spacing.sm }}>
                Additional Information (Optional)
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon, marginBottom: Spacing.xs }}>
                Anything else you'd like the committee to know?
              </ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={additionalInfo}
                onChangeText={setAdditionalInfo}
                placeholder="Additional information..."
                placeholderTextColor={colors.icon}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: submitting ? colors.icon : colors.primary,
                  opacity: submitting ? 0.6 : 1,
                },
              ]}
              onPress={handleSubmitApplication}
              disabled={submitting}
            >
              <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 20,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  committeeMember: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  memberImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginRight: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  memberImage: {
    width: '100%',
    height: '100%',
  },
  memberInfo: {
    flex: 1,
  },
  committeeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  committeeMemberCard: {
    width: '30%',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  committeeMemberImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  meetingInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  meetingDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontWeight: '700',
    fontSize: 20,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 100,
    maxHeight: 200,
  },
  submitButton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
});


