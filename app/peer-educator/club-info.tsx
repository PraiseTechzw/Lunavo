/**
 * Club Information - About the Peer Educator Club
 */

import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { getMeetings, getCurrentUser } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

const EXECUTIVE_COMMITTEE = [
  { role: 'Club President', name: 'Tafara Chakandinakira' },
  { role: 'Vice President', name: 'Tatenda Marundu' },
  { role: 'Secretary', name: 'Ashley Mashatise' },
  { role: 'Treasurer', name: 'Ruvarashe Mushonga' },
  { role: 'Information & Publicity', name: 'Dalitso Chafuwa' },
  { role: 'Online Counselling Administrator', name: 'Praise Masunga' },
];

export default function ClubInfoScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const [user, setUser] = useState<any>(null);
  const [nextMeeting, setNextMeeting] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);

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

      // Get next meeting
      const meetings = await getMeetings();
      const now = new Date();
      const upcoming = meetings
        .filter((m) => new Date(m.scheduledDate) >= now)
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
      
      if (upcoming.length > 0) {
        setNextMeeting(upcoming[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
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
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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
            <ThemedText type="body" style={{ color: colors.text, lineHeight: 22 }}>
              The Peer Educator Club at Chinhoyi University of Technology is dedicated to providing
              anonymous peer support and early intervention for students facing various challenges.
              Our mission is to create a safe, supportive environment where students can seek help
              without fear of judgment or exposure.
            </ThemedText>
          </View>

          {/* Executive Committee */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Executive Committee
            </ThemedText>
            {EXECUTIVE_COMMITTEE.map((member, index) => (
              <View key={index} style={styles.committeeMember}>
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

          {/* Meeting Schedule */}
          {nextMeeting && (
            <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Next Meeting
              </ThemedText>
              <View style={styles.meetingInfo}>
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
              </View>
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
  committeeMember: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  memberInfo: {
    flex: 1,
  },
  meetingInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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


