/**
 * Premium Multi-Step Registration Screen
 * Overhauled with PEACE branding, Glassmorphism, and Blobs
 */

import { LunavoLogo } from "@/app/components/lunavo-logo";
import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import { CUT_SCHOOLS } from "@/app/constants/programs";
import {
  BorderRadius,
  Colors,
  PlatformStyles,
  Spacing,
} from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { signUp } from "@/lib/auth";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Easing,
  FadeInRight,
  FadeOutLeft,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

type RegisterStep = 1 | 2 | 3 | 4 | 5 | 6;

const InputField = ({
  label,
  icon,
  value,
  onChange,
  placeholder,
  secure = false,
  statusIcon,
  colors,
}: any) => (
  <View style={styles.inputGroup}>
    <ThemedText style={styles.label}>{label}</ThemedText>
    <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
      <Ionicons name={icon} size={20} color={colors.icon} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.icon}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        autoCapitalize="none"
      />
      {statusIcon}
    </View>
  </View>
);

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { height, width } = useWindowDimensions();
  const isSmall = height < 700 || width < 360;

  const [step, setStep] = useState<RegisterStep>(1);
  const [loading, setLoading] = useState(false);
  const [showPassReg, setShowPassReg] = useState(false);
  const [showConfirmReg, setShowConfirmReg] = useState(false);

  // Background animation
  const floatValue = useSharedValue(0);
  useEffect(() => {
    floatValue.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  // Button press animation
  const buttonScale = useSharedValue(1);
  const buttonOpacity = useSharedValue(1);

  const animateButtonPress = () => {
    buttonScale.value = withTiming(0.95, { duration: 100 }, () => {
      buttonScale.value = withTiming(1, {
        duration: 200,
        easing: Easing.elastic(1.2),
      });
    });
    buttonOpacity.value = withTiming(0.8, { duration: 100 }, () => {
      buttonOpacity.value = withTiming(1, { duration: 200 });
    });
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    opacity: buttonOpacity.value,
  }));

  const blob1Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(floatValue.value, [0, 1], [0, 60]) },
      { translateX: interpolate(floatValue.value, [0, 1], [0, 30]) },
    ],
  }));

  const blob2Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(floatValue.value, [0, 1], [0, -50]) },
      { translateX: interpolate(floatValue.value, [0, 1], [0, -20]) },
    ],
  }));

  // Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    studentNumber: "",
    program: "",
    year: 1,
    semester: 1,
    username: "",
    phone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    acceptedTerms: false,
  });

  const [emailStatus, setEmailStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [studentIdStatus, setStudentIdStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [showProgramPicker, setShowProgramPicker] = useState(false);
  const [programSpecialization, setProgramSpecialization] = useState("");

  const canContinue = useMemo(() => {
    if (step === 1) {
      return (
        !!formData.email &&
        !!formData.studentNumber &&
        emailStatus !== "taken" &&
        studentIdStatus !== "taken" &&
        studentIdStatus !== "invalid"
      );
    }
    if (step === 2) {
      return (
        !!formData.fullName &&
        !!formData.program &&
        !!formData.username &&
        usernameStatus !== "taken"
      );
    }
    if (step === 3) {
      return !!formData.year && !!formData.semester;
    }
    if (step === 4) {
      return (
        !!formData.phone &&
        !!formData.emergencyContactName &&
        !!formData.emergencyContactPhone
      );
    }
    if (step === 5) {
      const strongEnough = formData.password.length >= 6;
      const matches = formData.password === formData.confirmPassword;
      return strongEnough && matches;
    }
    if (step === 6) {
      return formData.acceptedTerms;
    }
    return true;
  }, [step, formData, emailStatus, usernameStatus, studentIdStatus]);
  // Logic for Email validation
  useEffect(() => {
    if (formData.email.includes("@")) {
      setEmailStatus("checking");
      const t = setTimeout(async () => {
        const { checkEmailAvailability } = await import("@/lib/database");
        const avVal = await checkEmailAvailability(formData.email);
        setEmailStatus(avVal ? "available" : "taken");
      }, 500);
      return () => clearTimeout(t);
    } else {
      setEmailStatus("idle");
    }
  }, [formData.email]);

  // Logic for Username validation
  useEffect(() => {
    if (formData.username.length >= 3) {
      setUsernameStatus("checking");
      const t = setTimeout(async () => {
        const { checkUsernameAvailability } = await import("@/lib/database");
        const avVal = await checkUsernameAvailability(formData.username);
        setUsernameStatus(avVal ? "available" : "taken");
      }, 500);
      return () => clearTimeout(t);
    } else {
      setUsernameStatus("idle");
    }
  }, [formData.username]);

  // Logic for Student ID validation
  useEffect(() => {
    const sn = formData.studentNumber.toUpperCase().trim();
    const validFormat = /^[A-Z]\d{8}[A-Z]$/.test(sn);
    if (!sn) {
      setStudentIdStatus("idle");
      return;
    }
    if (!validFormat) {
      setStudentIdStatus("invalid");
      return;
    }
    setStudentIdStatus("checking");
    const t = setTimeout(async () => {
      const { checkStudentIdAvailability } = await import("@/lib/database");
      const avVal = await checkStudentIdAvailability(sn);
      setStudentIdStatus(avVal ? "available" : "taken");
    }, 500);
    return () => clearTimeout(t);
  }, [formData.studentNumber]);

  const handleRegister = async () => {
    console.log("[Register] Handle register called");
    if (!formData.acceptedTerms) {
      console.log("[Register] Terms not accepted");
      Alert.alert("Required", "Accept terms to proceed.");
      return;
    }
    setLoading(true);
    try {
      console.log("[Register] Calling signUp with:", {
        ...formData,
        password: "***",
        confirmPassword: "***",
      });
      const { user, error } = await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        username: formData.username,
        studentNumber: formData.studentNumber,
        program: formData.program,
        year: formData.year,
        semester: formData.semester,
        phone: formData.phone,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        role: "student",
      });

      console.log("[Register] signUp result:", { hasUser: !!user, error });

      if (error) throw error;

      console.log("[Register] Success. Navigating to verify-email.");
      router.replace({
        pathname: "/auth/verify-email",
        params: { email: formData.email },
      });
    } catch (e: any) {
      console.error("[Register] Error caught:", e);
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonPress = () => {
    animateButtonPress();
    if (step === 6) {
      // Delay the actual registration to let animation play
      setTimeout(handleRegister, 150);
    } else {
      setTimeout(() => setStep((step + 1) as any), 150);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Animated Background Blobs */}
      <View style={styles.background}>
        <Animated.View
          style={[styles.blobWrapper, blob1Style, { top: -200, left: -100 }]}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.blob}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.blobWrapper,
            blob2Style,
            { bottom: -200, right: -100 },
          ]}
        >
          <LinearGradient
            colors={[colors.success, colors.primary]}
            style={styles.blob}
          />
        </Animated.View>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              isSmall ? { padding: Spacing.lg } : null,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
          >
            <View
              style={[
                styles.fixedHeader,
                isSmall ? { marginBottom: 24 } : null,
              ]}
            >
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backBtn}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.progressTrack}>
                {[1, 2, 3, 4, 5, 6].map((s) => (
                  <View
                    key={s}
                    style={[
                      styles.progressDot,
                      {
                        backgroundColor:
                          s <= step ? colors.primary : colors.border,
                        width: s === step ? 30 : 20,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
            <View style={{ marginBottom: 20 }}>
              <ThemedText style={[styles.progressInfo, { color: colors.text }]}>
                Step {step} of 6
              </ThemedText>
              <View
                style={[
                  styles.progressBarTrack,
                  { backgroundColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${(step / 6) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View
              style={[
                styles.logoSection,
                isSmall ? { marginBottom: 20 } : null,
              ]}
            >
              <LunavoLogo size={isSmall ? 64 : 80} />
              <ThemedText
                type="h2"
                style={[styles.stepTitle, isSmall ? { marginTop: 6 } : null]}
              >
                {step === 1
                  ? "Academic ID"
                  : step === 2
                    ? "Identity"
                    : step === 3
                      ? "Academic Profile"
                      : step === 4
                        ? "Contact"
                        : step === 5
                          ? "Security"
                          : "Protocol"}
              </ThemedText>
            </View>

            <Animated.View
              key={step}
              entering={FadeInRight.duration(400)}
              exiting={FadeOutLeft.duration(400)}
              style={[
                styles.card,
                { backgroundColor: colors.card },
                isSmall ? { padding: Spacing.lg } : null,
              ]}
            >
              {step === 1 && (
                <View>
                  <InputField
                    label="University Email"
                    icon="mail-outline"
                    value={formData.email}
                    onChange={(v: string) =>
                      setFormData({ ...formData, email: v })
                    }
                    placeholder="name@cut.ac.zw"
                    statusIcon={
                      emailStatus === "checking" ? (
                        <ActivityIndicator size="small" />
                      ) : emailStatus === "available" ? (
                        <Ionicons
                          name="checkmark-circle"
                          color={colors.success}
                          size={20}
                        />
                      ) : emailStatus === "taken" ? (
                        <Ionicons
                          name="close-circle"
                          color={colors.danger}
                          size={20}
                        />
                      ) : null
                    }
                    colors={colors}
                  />
                  <InputField
                    label="Student ID"
                    icon="card-outline"
                    value={formData.studentNumber}
                    onChange={(v: string) =>
                      setFormData({
                        ...formData,
                        studentNumber: v.toUpperCase().replace(/\s+/g, ""),
                      })
                    }
                    placeholder="C23123456O"
                    statusIcon={
                      studentIdStatus === "checking" ? (
                        <ActivityIndicator size="small" />
                      ) : studentIdStatus === "available" ? (
                        <Ionicons
                          name="checkmark-circle"
                          color={colors.success}
                          size={20}
                        />
                      ) : studentIdStatus === "taken" ? (
                        <Ionicons
                          name="close-circle"
                          color={colors.danger}
                          size={20}
                        />
                      ) : studentIdStatus === "invalid" ? (
                        <Ionicons
                          name="alert-circle"
                          color={colors.danger}
                          size={20}
                        />
                      ) : null
                    }
                    colors={colors}
                  />
                  {studentIdStatus === "invalid" && (
                    <ThemedText
                      style={[styles.hintText, { color: colors.danger }]}
                    >
                      Must match: Letter + 8 digits + Letter (e.g., C23123456O)
                    </ThemedText>
                  )}
                  <ThemedText style={styles.hintText}>
                    Format: Letter + 8 digits + Letter (e.g., C23123456O)
                  </ThemedText>
                </View>
              )}

              {step === 2 && (
                <View>
                  <InputField
                    label="Full Name"
                    icon="person-outline"
                    value={formData.fullName}
                    onChange={(v: string) =>
                      setFormData({ ...formData, fullName: v })
                    }
                    placeholder="As on student ID"
                    colors={colors}
                  />
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.label}>
                      Program of Study
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => setShowProgramPicker(true)}
                      style={[
                        styles.inputWrapper,
                        { borderColor: colors.border },
                      ]}
                    >
                      <Ionicons
                        name="school-outline"
                        size={20}
                        color={colors.icon}
                      />
                      <ThemedText
                        style={[
                          styles.input,
                          {
                            color: formData.program ? colors.text : colors.icon,
                          },
                        ]}
                      >
                        {formData.program || "Select your program"}
                      </ThemedText>
                      <Ionicons
                        name="chevron-down-outline"
                        size={20}
                        color={colors.icon}
                      />
                    </TouchableOpacity>
                  </View>

                  <InputField
                    label="Community Alias"
                    icon="at-outline"
                    value={formData.username}
                    onChange={(v: string) =>
                      setFormData({
                        ...formData,
                        username: v.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                      })
                    }
                    placeholder="lowercase_only"
                    statusIcon={
                      usernameStatus === "checking" ? (
                        <ActivityIndicator size="small" />
                      ) : usernameStatus === "available" ? (
                        <Ionicons
                          name="checkmark-circle"
                          color={colors.success}
                          size={20}
                        />
                      ) : usernameStatus === "taken" ? (
                        <Ionicons
                          name="close-circle"
                          color={colors.danger}
                          size={20}
                        />
                      ) : null
                    }
                    colors={colors}
                  />
                  <ThemedText style={styles.hintText}>
                    Lowercase only (a-z, 0-9, _). Visible to peers.
                  </ThemedText>
                </View>
              )}

              {step === 3 && (
                <View>
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.label}>
                      Academic Year & Semester
                    </ThemedText>
                    <View style={styles.academicRow}>
                      <View style={{ flex: 1 }}>
                        <ThemedText
                          style={[styles.label, { fontSize: 11, opacity: 0.6 }]}
                        >
                          Year
                        </ThemedText>
                        <View style={styles.yearRow}>
                          {[1, 2, 3, 4, 5].map((y) => (
                            <TouchableOpacity
                              key={y}
                              onPress={() =>
                                setFormData({ ...formData, year: y })
                              }
                              style={[
                                styles.yearBox,
                                {
                                  borderColor:
                                    formData.year === y
                                      ? colors.primary
                                      : colors.border,
                                  backgroundColor: "transparent",
                                  height: isSmall ? 36 : styles.yearBox.height,
                                  borderRadius: 999,
                                  transform: [
                                    { scale: formData.year === y ? 1.06 : 1 },
                                  ],
                                } as any,
                              ]}
                            >
                              {formData.year === y ? (
                                <LinearGradient
                                  colors={colors.gradients.primary as any}
                                  style={styles.yearGradient}
                                >
                                  <ThemedText
                                    style={{
                                      color: "#FFF",
                                      fontWeight: "700",
                                      fontSize: 12,
                                    }}
                                  >
                                    Y{y}
                                  </ThemedText>
                                </LinearGradient>
                              ) : (
                                <ThemedText
                                  style={{
                                    color: colors.text,
                                    fontWeight: "700",
                                    fontSize: 12,
                                  }}
                                >
                                  Y{y}
                                </ThemedText>
                              )}
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <ThemedText
                          style={[styles.label, { fontSize: 11, opacity: 0.6 }]}
                        >
                          Semester
                        </ThemedText>
                        <View style={styles.yearRow}>
                          {[1, 2].map((s) => (
                            <TouchableOpacity
                              key={s}
                              onPress={() =>
                                setFormData({ ...formData, semester: s })
                              }
                              style={[
                                styles.semesterBox,
                                {
                                  borderColor:
                                    formData.semester === s
                                      ? colors.primary
                                      : colors.border,
                                  backgroundColor: "transparent",
                                  height: isSmall
                                    ? 36
                                    : styles.semesterBox.height,
                                  borderRadius: 999,
                                  transform: [
                                    {
                                      scale: formData.semester === s ? 1.06 : 1,
                                    },
                                  ],
                                } as any,
                              ]}
                            >
                              {formData.semester === s ? (
                                <LinearGradient
                                  colors={colors.gradients.primary as any}
                                  style={styles.semGradient}
                                >
                                  <ThemedText
                                    style={{
                                      color: "#FFF",
                                      fontWeight: "700",
                                      fontSize: 12,
                                    }}
                                  >
                                    S{s}
                                  </ThemedText>
                                </LinearGradient>
                              ) : (
                                <ThemedText
                                  style={{
                                    color: colors.text,
                                    fontWeight: "700",
                                    fontSize: 12,
                                  }}
                                >
                                  S{s}
                                </ThemedText>
                              )}
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </View>
                    <ThemedText style={[styles.hintText, { marginTop: 6 }]}>
                      Selected: Year {formData.year} (
                      {
                        ["First", "Second", "Third", "Fourth", "Fifth"][
                        formData.year - 1
                        ]
                      }
                      ) • Semester {formData.semester}
                    </ThemedText>
                  </View>
                </View>
              )}

              {step === 4 && (
                <View>
                  <InputField
                    label="Your Phone"
                    icon="phone-portrait-outline"
                    value={formData.phone}
                    onChange={(v: string) =>
                      setFormData({ ...formData, phone: v })
                    }
                    placeholder="+263..."
                    colors={colors}
                  />
                  <InputField
                    label="Emergency Name"
                    icon="people-outline"
                    value={formData.emergencyContactName}
                    onChange={(v: string) =>
                      setFormData({ ...formData, emergencyContactName: v })
                    }
                    placeholder="Full Name"
                    colors={colors}
                  />
                  <InputField
                    label="Emergency Phone"
                    icon="call-outline"
                    value={formData.emergencyContactPhone}
                    onChange={(v: string) =>
                      setFormData({ ...formData, emergencyContactPhone: v })
                    }
                    placeholder="+263..."
                    colors={colors}
                  />
                </View>
              )}
              {step === 5 && (
                <View>
                  <InputField
                    label="Password"
                    icon="lock-closed-outline"
                    secure={!showPassReg}
                    value={formData.password}
                    onChange={(v: string) =>
                      setFormData({ ...formData, password: v })
                    }
                    placeholder="••••••••"
                    statusIcon={
                      <TouchableOpacity
                        onPress={() => setShowPassReg(!showPassReg)}
                      >
                        <Ionicons
                          name={showPassReg ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color={colors.icon}
                        />
                      </TouchableOpacity>
                    }
                    colors={colors}
                  />
                  <View
                    style={[
                      styles.progressBarTrack,
                      { backgroundColor: colors.border, marginTop: 8 },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          backgroundColor:
                            formData.password.length >= 10 &&
                              /[A-Z]/.test(formData.password) &&
                              /[0-9]/.test(formData.password) &&
                              /[^A-Za-z0-9]/.test(formData.password)
                              ? colors.success
                              : formData.password.length >= 6
                                ? colors.primary
                                : colors.danger,
                          width:
                            formData.password.length >= 10
                              ? "100%"
                              : formData.password.length >= 6
                                ? "66%"
                                : "33%",
                        },
                      ]}
                    />
                  </View>
                  <InputField
                    label="Confirm"
                    icon="lock-closed-outline"
                    secure={!showConfirmReg}
                    value={formData.confirmPassword}
                    onChange={(v: string) =>
                      setFormData({ ...formData, confirmPassword: v })
                    }
                    placeholder="••••••••"
                    statusIcon={
                      <TouchableOpacity
                        onPress={() => setShowConfirmReg(!showConfirmReg)}
                      >
                        <Ionicons
                          name={
                            showConfirmReg ? "eye-off-outline" : "eye-outline"
                          }
                          size={20}
                          color={colors.icon}
                        />
                      </TouchableOpacity>
                    }
                    colors={colors}
                  />
                </View>
              )}

              {step === 6 && (
                <View>
                  <ThemedText type="h3">Community Protocols</ThemedText>
                  <ThemedText style={styles.termsText}>
                    By joining PEACE, you agree to uphold our values of
                    anonymity, mutual respect, and institutional oversight. Your
                    identity is shared ONLY with professional responders during
                    critical escalations.
                  </ThemedText>
                  <View style={styles.protocolList}>
                    {[
                      "Respect anonymity and confidentiality",
                      "Use real academic email for verification",
                      "Report harm or urgent issues promptly",
                    ].map((p, i) => (
                      <View
                        key={i}
                        style={[
                          styles.protocolChip,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.surface,
                          },
                        ]}
                      >
                        <Ionicons
                          name="shield-checkmark-outline"
                          size={16}
                          color={colors.primary}
                        />
                        <ThemedText style={{ color: colors.text }}>
                          {p}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        acceptedTerms: !formData.acceptedTerms,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: colors.primary,
                          backgroundColor: formData.acceptedTerms
                            ? colors.primary
                            : "transparent",
                        },
                      ]}
                    >
                      {formData.acceptedTerms && (
                        <Ionicons name="checkmark" size={14} color="#FFF" />
                      )}
                    </View>
                    <ThemedText>I uphold the PEACE protocol</ThemedText>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.actionRow}>
                {step > 1 && (
                  <TouchableOpacity
                    style={[styles.navBtn, { borderColor: colors.border }]}
                    onPress={() => setStep((step - 1) as any)}
                  >
                    <ThemedText>Back</ThemedText>
                  </TouchableOpacity>
                )}
                <Animated.View
                  style={[
                    styles.primaryBtnWrapper,
                    { flex: 1 },
                    animatedButtonStyle,
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={handleButtonPress}
                    disabled={loading || !canContinue}
                  >
                    <LinearGradient
                      colors={colors.gradients.primary as any}
                      style={[
                        styles.primaryBtn,
                        !canContinue || loading ? { opacity: 0.6 } : null,
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <ThemedText style={styles.btnText}>
                          {step === 6 ? "ESTABLISH LINK" : "CONTINUE"}
                        </ThemedText>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </Animated.View>

            <View style={styles.footer}>
              <ThemedText style={{ opacity: 0.6 }}>
                Already connected?{" "}
              </ThemedText>
              <TouchableOpacity onPress={() => router.push("/auth/login")}>
                <ThemedText
                  style={{ color: colors.primary, fontWeight: "700" }}
                >
                  Sign In
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Program Picker Modal */}
      <Modal
        visible={showProgramPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProgramPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Select Your Program</ThemedText>
              <TouchableOpacity onPress={() => setShowProgramPicker(false)}>
                <Ionicons name="close-circle" size={32} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.programList}
              showsVerticalScrollIndicator={false}
            >
              {CUT_SCHOOLS.map((school, schoolIndex) => (
                <View key={schoolIndex} style={styles.schoolSection}>
                  <ThemedText style={styles.schoolName}>
                    {school.name}
                  </ThemedText>
                  {school.programs.map((program, progIndex) => (
                    <TouchableOpacity
                      key={progIndex}
                      style={[
                        styles.programItem,
                        {
                          backgroundColor:
                            formData.program === program.name
                              ? colors.primary + "20"
                              : colors.card,
                          borderColor:
                            formData.program === program.name
                              ? colors.primary
                              : colors.border,
                        },
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, program: program.name });
                        setShowProgramPicker(false);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.programName}>
                          {program.name}
                        </ThemedText>
                        <View style={styles.programMeta}>
                          <View
                            style={[
                              styles.durationBadge,
                              { backgroundColor: colors.primary + "30" },
                            ]}
                          >
                            <Ionicons
                              name="time-outline"
                              size={12}
                              color={colors.primary}
                            />
                            <ThemedText
                              style={[
                                styles.durationText,
                                { color: colors.primary },
                              ]}
                            >
                              {program.duration} years
                            </ThemedText>
                          </View>
                          {program.options && (
                            <ThemedText style={styles.optionsText}>
                              Options: {program.options.join(", ")}
                            </ThemedText>
                          )}
                        </View>
                      </View>
                      {formData.program === program.name && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  blobWrapper: {
    position: "absolute",
    width: 600,
    height: 600,
  },
  blob: {
    width: "100%",
    height: "100%",
    borderRadius: 300,
    opacity: 0.1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    flexGrow: 1,
    justifyContent: "center",
  },
  fixedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  progressTrack: {
    flexDirection: "row",
    gap: 8,
  },
  progressDot: {
    height: 6,
    borderRadius: 3,
  },
  progressInfo: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
    opacity: 0.7,
    textAlign: "center",
  },
  progressBarTrack: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  stepTitle: {
    marginTop: 10,
    letterSpacing: 2,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  card: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    ...PlatformStyles.premiumShadow,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: Spacing.xs,
    marginLeft: 4,
    opacity: 0.7,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    height: 52,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.md,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  hintText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: "center",
  },
  termsText: {
    marginTop: Spacing.md,
    lineHeight: 22,
    opacity: 0.8,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 30,
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: 20,
  },
  navBtn: {
    paddingHorizontal: 25,
    height: 52,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtnWrapper: {
    ...PlatformStyles.premiumShadow,
  },
  primaryBtn: {
    height: 56,
    borderRadius: BorderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: {
    color: "#FFF",
    fontWeight: "900",
    letterSpacing: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  academicRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  yearRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  yearBox: {
    width: "18%",
    height: 45,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  semesterBox: {
    width: "48%",
    height: 45,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  yearGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  semGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  protocolList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  protocolChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    height: "85%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: Spacing.xl,
    ...PlatformStyles.premiumShadow,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  programList: {
    flex: 1,
  },
  schoolSection: {
    marginBottom: 25,
  },
  schoolName: {
    fontSize: 14,
    fontWeight: "800",
    opacity: 0.5,
    marginBottom: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  programItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 10,
  },
  programName: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 6,
  },
  programMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 11,
    fontWeight: "700",
  },
  optionsText: {
    fontSize: 11,
    opacity: 0.6,
    fontStyle: "italic",
  },
});
