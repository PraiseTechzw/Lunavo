import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import { BorderRadius, Colors, PlatformStyles, Spacing } from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { User } from "@/app/types";
import { getCounsellingProviders } from "@/lib/database";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight, ZoomIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const timeSlots = [
  "10:00 AM",
  "11:30 AM",
  "01:00 PM",
  "02:30 PM",
  "04:00 PM",
  "05:30 PM",
];

export default function BookCounsellorScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [meetingType, setMeetingType] = useState<"online" | "in-person">(
    "in-person",
  );
  const [providers, setProviders] = useState<User[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [selectedCounsellor, setSelectedCounsellor] = useState<string | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [selectedTime, setSelectedTime] = useState("11:30 AM");

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingProviders(true);
        const list = await getCounsellingProviders();
        setProviders(list);
      } catch (e) {
        Alert.alert("Could not load counselors", "Please try again.");
        setProviders([]);
      } finally {
        setLoadingProviders(false);
      }
    };
    load();
  }, []);

  const counsellors = useMemo(
    () =>
      providers.map((p) => ({
        id: p.id,
        name: p.fullName || p.pseudonym,
        specialty:
          p.specialization ||
          (p.role === "life-coach"
            ? "Life Coaching"
            : "Peer Executive Support"),
        iconName: p.role === "life-coach" ? "heart" : "account-heart",
        color: p.role === "life-coach" ? "#10B981" : "#6366F1",
        avatarUrl: p.avatarUrl,
      })),
    [providers],
  );

  const handleConfirm = () => {
    if (!selectedCounsellor) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Selection Required", "Please choose a professional who resonates with you.");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const selected = counsellors.find((c) => c.id === selectedCounsellor);
    Alert.alert(
      "Appointment Scheduled",
      `Your session with ${selected?.name} has been successfully booked for tomorrow at ${selectedTime}.`,
      [
        {
          text: "Wonderful",
          onPress: () => router.back(),
        },
      ],
    );
  };

  const renderCounsellor = (counsellor: (typeof counsellors)[0], index: number) => {
    const isSelected = selectedCounsellor === counsellor.id;
    return (
      <Animated.View
        key={counsellor.id}
        entering={FadeInRight.delay(200 + index * 100)}
      >
        <TouchableOpacity
          style={[
            styles.counsellorCard,
            {
              backgroundColor: colors.card,
              borderColor: isSelected ? colors.primary : "transparent",
              borderWidth: 2,
            },
            PlatformStyles.premiumShadow,
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            setSelectedCounsellor(counsellor.id);
          }}
          activeOpacity={0.7}
        >
          {isSelected && (
            <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark" size={12} color="#FFF" />
            </View>
          )}
          <View
            style={[
              styles.counsellorAvatar,
              { backgroundColor: counsellor.color + "15" },
            ]}
          >
            <MaterialCommunityIcons
              name={counsellor.iconName as any}
              size={32}
              color={counsellor.color}
            />
          </View>
          <View style={styles.counsellorInfo}>
            <ThemedText style={styles.counsellorName} numberOfLines={1}>
              {counsellor.name}
            </ThemedText>
            <ThemedText style={styles.counsellorSpecialty}>
              {counsellor.specialty}
            </ThemedText>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Premium Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.card }, PlatformStyles.premiumShadow]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <ThemedText type="h2">Book Support</ThemedText>
            <ThemedText type="small" style={{ opacity: 0.6 }}>Expert care on your terms</ThemedText>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Meeting Type */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Engagement Preference
            </ThemedText>
            <View style={[styles.segmentedWrapper, { backgroundColor: colors.surface }]}>
              <TouchableOpacity
                style={[
                  styles.segment,
                  meetingType === "online" && { backgroundColor: colors.card },
                  meetingType === "online" && PlatformStyles.premiumShadow,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setMeetingType("online");
                }}
              >
                <Ionicons
                  name="videocam"
                  size={20}
                  color={meetingType === "online" ? colors.primary : colors.icon}
                />
                <ThemedText style={[styles.segmentText, { color: meetingType === "online" ? colors.text : colors.icon }]}>
                  Virtual Session
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segment,
                  meetingType === "in-person" && { backgroundColor: colors.card },
                  meetingType === "in-person" && PlatformStyles.premiumShadow,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setMeetingType("in-person");
                }}
              >
                <Ionicons
                  name="people"
                  size={20}
                  color={meetingType === "in-person" ? colors.primary : colors.icon}
                />
                <ThemedText style={[styles.segmentText, { color: meetingType === "in-person" ? colors.text : colors.icon }]}>
                  Meet In-Person
                </ThemedText>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Choose Counsellor */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <ThemedText type="h3" style={styles.sectionTitle}>Professional Guidance</ThemedText>
              <ThemedText type="small" style={{ color: colors.primary }}>View All</ThemedText>
            </View>

            {loadingProviders ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.primary} />
                <ThemedText type="small" style={{ opacity: 0.7 }}>Discovery in progress...</ThemedText>
              </View>
            ) : counsellors.length === 0 ? (
              <Animated.View
                entering={ZoomIn}
                style={[styles.emptyBox, { backgroundColor: colors.surface }]}
              >
                <MaterialCommunityIcons name="account-search-outline" size={48} color={colors.icon} />
                <ThemedText style={{ textAlign: "center", fontWeight: '600' }}>No professionals available today</ThemedText>
                <ThemedText type="small" style={{ opacity: 0.6, textAlign: "center" }}>
                  Please check back later or try a different session type.
                </ThemedText>
              </Animated.View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
                snapToInterval={200 + Spacing.md}
                decelerationRate="fast"
              >
                {counsellors.map(renderCounsellor)}
              </ScrollView>
            )}
          </View>

          {/* Date & Time Selection */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>Choose Your Slot</ThemedText>

            {/* Horizontal Mini Calendar */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateScroll}
            >
              {Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const day = date.getDate();
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const isSelected = selectedDate === day;

                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedDate(day);
                    }}
                    style={[
                      styles.dateCard,
                      { backgroundColor: isSelected ? colors.primary : colors.card },
                      isSelected && PlatformStyles.premiumShadow
                    ]}
                  >
                    <ThemedText style={[styles.dateDay, { color: isSelected ? "#FFF" : colors.icon }]}>{dayName}</ThemedText>
                    <ThemedText style={[styles.dateNumber, { color: isSelected ? "#FFF" : colors.text }]}>{day}</ThemedText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Time Grid */}
            <View style={styles.timeGrid}>
              {timeSlots.map((time, index) => {
                const isSelected = selectedTime === time;
                const isUnavailable = time === "04:00 PM";
                return (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeSlot,
                      {
                        backgroundColor: isSelected ? colors.primary + "15" : colors.card,
                        borderColor: isSelected ? colors.primary : "transparent",
                        borderWidth: 1,
                        opacity: isUnavailable ? 0.4 : 1,
                      },
                      !isUnavailable && PlatformStyles.premiumShadow,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      !isUnavailable && setSelectedTime(time);
                    }}
                    disabled={isUnavailable}
                  >
                    <ThemedText
                      style={[
                        styles.timeText,
                        { color: isSelected ? colors.primary : colors.text, fontWeight: isSelected ? "800" : "500" }
                      ]}
                    >
                      {time}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Floating Action Button */}
        <SafeAreaView edges={["bottom"]} style={styles.fabContainer}>
          <TouchableOpacity
            onPress={handleConfirm}
            activeOpacity={0.9}
            style={styles.confirmWrapper}
          >
            <LinearGradient
              colors={["#4F46E5", "#7C3AED"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.confirmButton, PlatformStyles.premiumShadow]}
            >
              <ThemedText style={styles.confirmText}>Reserve My Session</ThemedText>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  segmentedWrapper: {
    flexDirection: "row",
    borderRadius: BorderRadius.xl,
    padding: 6,
    gap: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  segmentText: {
    fontWeight: '700',
    fontSize: 14,
  },
  horizontalScroll: {
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  counsellorCard: {
    width: 200,
    padding: Spacing.md,
    borderRadius: BorderRadius.xxl,
    alignItems: "center",
    position: 'relative',
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  counsellorAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  counsellorInfo: {
    alignItems: "center",
  },
  counsellorName: {
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 4,
  },
  counsellorSpecialty: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
  emptyBox: {
    padding: Spacing.xxl,
    borderRadius: BorderRadius.xxl,
    gap: 12,
    alignItems: "center",
  },
  dateScroll: {
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dateCard: {
    width: 60,
    height: 80,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: '900',
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  timeSlot: {
    width: (width - Spacing.lg * 2 - Spacing.md * 2) / 3,
    paddingVertical: 16,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
  },
  timeText: {
    fontSize: 13,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
  },
  confirmWrapper: {
    width: '100%',
  },
  confirmButton: {
    flexDirection: 'row',
    height: 64,
    borderRadius: BorderRadius.xxl,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  confirmText: {
    fontWeight: "900",
    fontSize: 18,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
});

