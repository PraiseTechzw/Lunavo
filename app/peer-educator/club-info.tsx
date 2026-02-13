/**
 * Club Information - About the Peer Educator Club
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { getCurrentUser, getMeetings, getPosts, getReplies } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
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
  const [clubStats, setClubStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalResponses: 0,
    helpfulResponses: 0,
    upcomingMeetings: 0,
  });

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadData = useCallback(async () => {
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
  }, []);

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

    Alert.alert(
      'Join Peer Educator Club',
      'To join the Peer Educator Club, please contact the club president or visit the Student Affairs office.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Contact',
          onPress: () => {
            Linking.openURL('mailto:studentaffairs@cut.ac.zw?subject=Peer Educator Club Membership');
          },
        },
      ]
    );
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

          {/* Join Club Button */}
          {!isMember && (
            <TouchableOpacity
              style={[styles.joinButton, { backgroundColor: colors.primary }]}
              onPress={handleJoinClub}
            >
              <MaterialIcons name="person-add" size={24} color="#FFFFFF" />
              <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: Spacing.sm }}>
                Join the Club
              </ThemedText>
            </TouchableOpacity>
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
});


