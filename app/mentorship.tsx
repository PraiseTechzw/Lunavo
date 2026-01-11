/**
 * Peer Mentorship Channels - Connect students with mentors
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { getPEUsers, startNewSupportSession } from '@/lib/database';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Mentor {
  id: string;
  name: string;
  expertise: string[];
  availability: string;
  rating: number;
  studentsHelped: number;
  bio: string;
}



const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
const [mentors, setMentors] = useState<Mentor[]>([]);
const [loading, setLoading] = useState(true);
const [searchQuery, setSearchQuery] = useState('');

const mentorshipChannels = [
  {
    id: 'academic',
    name: 'Academic Mentorship',
    description: 'Get help with studies, assignments, and academic planning',
    icon: 'school' as const,
    color: '#4CAF50',
  },
  {
    id: 'career',
    name: 'Career Guidance',
    description: 'Career planning, CV building, and professional development',
    icon: 'work' as const,
    color: '#2196F3',
  },
  {
    id: 'personal',
    name: 'Personal Development',
    description: 'Life skills, personal growth, and self-improvement',
    icon: 'person' as const,
    color: '#9C27B0',
  },
  {
    id: 'mental-health',
    name: 'Mental Health Support',
    description: 'Stress management, coping strategies, and emotional support',
    icon: 'psychology' as const,
    color: '#FF9800',
  },
];

export default function MentorshipScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      const peUsers = await getPEUsers();
      const mapped = peUsers.map(u => ({
        id: u.id,
        name: u.fullName || u.username || u.pseudonym,
        expertise: (u.profile_data?.expertise as string[]) || ['Peer Support'],
        availability: 'Available', // In production, check online status
        rating: 5.0,
        studentsHelped: Math.floor(Math.random() * 50) + 10, // Mock stats for now but based on real user
        bio: u.profile_data?.bio || 'Trained Peer Educator ready to help.',
      }));
      setMentors(mapped);
    } catch (error) {
      console.error('Error fetching mentors:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleRequestMentor = async (mentor: Mentor) => {
    Alert.alert(
      'Connect with Peer',
      `Securely connect with ${mentor.name} for a private conversation?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Chat',
          onPress: async () => {
            try {
              const session = await startNewSupportSession({
                educator_id: mentor.id,
                category: selectedChannel || 'General Support',
              });
              router.push(`/chat/${session.id}`);
            } catch (error) {
              console.error('Error starting mentorship chat:', error);
              Alert.alert('Error', 'Failed to start a secure chat session.');
            }
          },
        },
      ]
    );
  };

  const currentChannel = mentorshipChannels.find(c => c.id === selectedChannel);

  const filteredMentors = mentors.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.expertise.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!selectedChannel) return matchesSearch;

    const channelExpertiseMap: Record<string, string> = {
      'academic': 'Academic Support',
      'career': 'Career Guidance',
      'personal': 'Personal Growth',
      'mental-health': 'Mental Health'
    };

    const targetExpertise = channelExpertiseMap[selectedChannel];
    return matchesSearch && (m.expertise.includes(targetExpertise) || m.expertise.includes('Peer Support'));
  });

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h2" style={styles.headerTitle}>
            Peer Mentorship
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text, backgroundColor: colors.surface }]}
            placeholder="Search mentors or topics..."
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {!selectedChannel ? (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Mentorship Channels
            </ThemedText>
            <ThemedText type="body" style={[styles.sectionDescription, { color: colors.icon }]}>
              Connect with trained peer mentors for personalized guidance and support
            </ThemedText>

            {mentorshipChannels.map((channel) => (
              <TouchableOpacity
                key={channel.id}
                style={[
                  styles.channelCard,
                  { backgroundColor: colors.card },
                  createShadow(3, '#000', 0.1),
                ]}
                onPress={() => setSelectedChannel(channel.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.channelIcon, { backgroundColor: channel.color + '20' }]}>
                  <MaterialIcons name={channel.icon} size={32} color={channel.color} />
                </View>
                <View style={styles.channelContent}>
                  <ThemedText type="h3" style={styles.channelName}>
                    {channel.name}
                  </ThemedText>
                  <ThemedText type="body" style={[styles.channelDescription, { color: colors.icon }]}>
                    {channel.description}
                  </ThemedText>
                  <View style={styles.channelFooter}>
                    <MaterialIcons name="people" size={16} color={colors.icon} />
                    <ThemedText type="small" style={{ color: colors.icon, marginLeft: 4 }}>
                      {mentors.length} total mentors
                    </ThemedText>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
              </TouchableOpacity>
            ))}

            <View style={{ height: Spacing.xl }} />
          </ScrollView>
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.channelHeader}>
              <TouchableOpacity
                onPress={() => setSelectedChannel(null)}
                style={styles.backButton}
              >
                <MaterialIcons name="arrow-back" size={20} color={colors.primary} />
                <ThemedText type="body" style={{ color: colors.primary, fontWeight: '600', marginLeft: 4 }}>
                  Back to Channels
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View style={[styles.channelBanner, { backgroundColor: currentChannel?.color + '20' }]}>
              <MaterialIcons name={currentChannel?.icon} size={48} color={currentChannel?.color} />
              <ThemedText type="h2" style={styles.bannerTitle}>
                {currentChannel?.name}
              </ThemedText>
              <ThemedText type="body" style={[styles.bannerDescription, { color: colors.icon }]}>
                {currentChannel?.description}
              </ThemedText>
            </View>

            <ThemedText type="h3" style={styles.mentorsTitle}>
              Available Mentors
            </ThemedText>

            {filteredMentors.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                <MaterialIcons name="person-off" size={48} color={colors.icon} />
                <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
                  {loading ? 'Fetching peers...' : 'No mentors found for this selection.'}
                </ThemedText>
              </View>
            ) : (
              filteredMentors.map((mentor: Mentor) => (
                <View
                  key={mentor.id}
                  style={[
                    styles.mentorCard,
                    { backgroundColor: colors.card },
                    createShadow(2, '#000', 0.1),
                  ]}
                >
                  <View style={styles.mentorHeader}>
                    <View style={[styles.mentorAvatar, { backgroundColor: (currentChannel?.color || colors.primary) + '20' }]}>
                      <MaterialIcons name="person" size={24} color={currentChannel?.color || colors.primary} />
                    </View>
                    <View style={styles.mentorInfo}>
                      <ThemedText type="h3" style={styles.mentorName}>
                        {mentor.name}
                      </ThemedText>
                      <View style={styles.mentorMeta}>
                        <View style={styles.ratingContainer}>
                          <MaterialIcons name="star" size={16} color="#FFD700" />
                          <ThemedText type="small" style={{ color: colors.text, fontWeight: '600', marginLeft: 2 }}>
                            {mentor.rating}
                          </ThemedText>
                        </View>
                        <ThemedText type="small" style={{ color: colors.icon, marginLeft: Spacing.sm }}>
                          {mentor.studentsHelped} students helped
                        </ThemedText>
                      </View>
                      <View style={[
                        styles.availabilityBadge,
                        { backgroundColor: mentor.availability === 'Available' ? colors.success + '20' : colors.warning + '20' }
                      ]}>
                        <View style={[
                          styles.availabilityDot,
                          { backgroundColor: mentor.availability === 'Available' ? colors.success : colors.warning }
                        ]} />
                        <ThemedText type="small" style={{
                          color: mentor.availability === 'Available' ? colors.success : colors.warning,
                          fontWeight: '600'
                        }}>
                          {mentor.availability}
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  <ThemedText type="body" style={[styles.mentorBio, { color: colors.icon }]}>
                    {mentor.bio}
                  </ThemedText>

                  <View style={styles.expertiseContainer}>
                    {mentor.expertise.map((exp: string, index: number) => (
                      <View
                        key={index}
                        style={[styles.expertiseTag, { backgroundColor: colors.surface }]}
                      >
                        <ThemedText type="small" style={{ color: colors.text }}>
                          {exp}
                        </ThemedText>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.requestButton,
                      {
                        backgroundColor: mentor.availability === 'Available' ? (currentChannel?.color || colors.primary) : colors.surface,
                        opacity: mentor.availability === 'Available' ? 1 : 0.5,
                      },
                    ]}
                    onPress={() => handleRequestMentor(mentor)}
                    disabled={mentor.availability !== 'Available'}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons
                      name="send"
                      size={20}
                      color={mentor.availability === 'Available' ? '#FFFFFF' : colors.icon}
                    />
                    <ThemedText
                      type="body"
                      style={{
                        color: mentor.availability === 'Available' ? '#FFFFFF' : colors.icon,
                        fontWeight: '600',
                        marginLeft: 4,
                      }}
                    >
                      Connect Now
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              ))
            )}

            <View style={{ height: Spacing.xl }} />
          </ScrollView>
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F5F5F5',
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    marginBottom: Spacing.md,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  channelIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelContent: {
    flex: 1,
  },
  channelName: {
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  channelDescription: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  channelFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  channelHeader: {
    marginBottom: Spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelBanner: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  bannerTitle: {
    fontWeight: '700',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  bannerDescription: {
    textAlign: 'center',
  },
  mentorsTitle: {
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  mentorCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  mentorHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  mentorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  mentorInfo: {
    flex: 1,
  },
  mentorName: {
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  mentorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  mentorBio: {
    fontSize: 14,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  expertiseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  expertiseTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  emptyCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});



