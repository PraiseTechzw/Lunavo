/**
 * Edit Profile Screen - Premium Experience
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { useCurrentUser } from '@/hooks/use-auth-guard';
import { updateUser } from '@/lib/database';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { user, loading: userLoading } = useCurrentUser();

    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        bio: '',
        program: '',
        academicYear: '',
        academicSemester: '',
        location: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        specialization: '',
        interests: '',
        studentNumber: '',
        preferredContactMethod: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                phone: user.phone || '',
                bio: user.bio || '',
                program: user.program || '',
                academicYear: user.academicYear?.toString() || '',
                academicSemester: user.academicSemester?.toString() || '',
                location: user.location || '',
                emergencyContactName: user.emergencyContactName || '',
                emergencyContactPhone: user.emergencyContactPhone || '',
                specialization: user.specialization || '',
                interests: user.interests?.join(', ') || '',
                studentNumber: user.studentNumber || '',
                preferredContactMethod: user.preferredContactMethod || '',
            });
        }
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await updateUser(user.id, {
                fullName: formData.fullName,
                phone: formData.phone,
                bio: formData.bio,
                program: formData.program,
                academicYear: parseInt(formData.academicYear) || undefined,
                academicSemester: parseInt(formData.academicSemester) || undefined,
                location: formData.location,
                emergencyContactName: formData.emergencyContactName,
                emergencyContactPhone: formData.emergencyContactPhone,
                specialization: formData.specialization,
                interests: formData.interests.split(',').map(s => s.trim()).filter(s => s !== ''),
                studentNumber: formData.studentNumber,
                preferredContactMethod: formData.preferredContactMethod,
            });
            Alert.alert('Success', 'Profile updated successfully!');
            router.back();
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const InputField = ({ label, value, onChangeText, placeholder, icon, multiline = false, keyboardType = 'default' }: any) => (
        <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>{label}</ThemedText>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name={icon} size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                    style={[styles.input, { color: colors.text, height: multiline ? 100 : 50 }]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.icon}
                    multiline={multiline}
                    keyboardType={keyboardType}
                    textAlignVertical={multiline ? 'top' : 'center'}
                />
            </View>
        </View>
    );

    if (userLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="close" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <ThemedText type="h2">Edit Profile</ThemedText>
                    <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
                        {saving ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <ThemedText style={{ color: colors.primary, fontWeight: '700' }}>Save</ThemedText>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.section}>
                        <ThemedText type="h3" style={styles.sectionTitle}>Basic Information</ThemedText>
                        <InputField
                            label="Full Name"
                            value={formData.fullName}
                            onChangeText={(txt: string) => setFormData({ ...formData, fullName: txt })}
                            placeholder="Your real name"
                            icon="person-outline"
                        />
                        <InputField
                            label="Phone Number"
                            value={formData.phone}
                            onChangeText={(txt: string) => setFormData({ ...formData, phone: txt })}
                            placeholder="+263 ..."
                            icon="call-outline"
                            keyboardType="phone-pad"
                        />
                        <InputField
                            label="Bio"
                            value={formData.bio}
                            onChangeText={(txt: string) => setFormData({ ...formData, bio: txt })}
                            placeholder="Tell us a bit about yourself..."
                            icon="document-text-outline"
                            multiline={true}
                        />
                    </View>

                    <View style={styles.section}>
                        <ThemedText type="h3" style={styles.sectionTitle}>Academic details</ThemedText>
                        <InputField
                            label="Program of Study"
                            value={formData.program}
                            onChangeText={(txt: string) => setFormData({ ...formData, program: txt })}
                            placeholder="e.g. BSc Computer Science"
                            icon="school-outline"
                        />
                        <InputField
                            label="Student Number"
                            value={formData.studentNumber}
                            onChangeText={(txt: string) => setFormData({ ...formData, studentNumber: txt })}
                            placeholder="e.g. C231...O"
                            icon="id-card-outline"
                        />
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                            <View style={{ flex: 1 }}>
                                <InputField
                                    label="Year"
                                    value={formData.academicYear}
                                    onChangeText={(txt: string) => setFormData({ ...formData, academicYear: txt })}
                                    placeholder="1-5"
                                    icon="calendar-outline"
                                    keyboardType="number-pad"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <InputField
                                    label="Semester"
                                    value={formData.academicSemester}
                                    onChangeText={(txt: string) => setFormData({ ...formData, academicSemester: txt })}
                                    placeholder="1-2"
                                    icon="time-outline"
                                    keyboardType="number-pad"
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <ThemedText type="h3" style={styles.sectionTitle}>Emergency & Safety</ThemedText>
                        <InputField
                            label="Location / Residence"
                            value={formData.location}
                            onChangeText={(txt: string) => setFormData({ ...formData, location: txt })}
                            placeholder="e.g. Block 4, Room 12"
                            icon="location-outline"
                        />
                        <InputField
                            label="Emergency Contact Name"
                            value={formData.emergencyContactName}
                            onChangeText={(txt: string) => setFormData({ ...formData, emergencyContactName: txt })}
                            placeholder="Name of relative/friend"
                            icon="heart-outline"
                        />
                        <InputField
                            label="Emergency Contact Phone"
                            value={formData.emergencyContactPhone}
                            onChangeText={(txt: string) => setFormData({ ...formData, emergencyContactPhone: txt })}
                            placeholder="Emergency phone number"
                            icon="alert-circle-outline"
                            keyboardType="phone-pad"
                        />
                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.inputLabel}>Preferred Contact Method</ThemedText>
                            <View style={styles.radioGroup}>
                                {['WhatsApp', 'Call', 'In-Person', 'Email'].map((method) => (
                                    <TouchableOpacity
                                        key={method}
                                        style={[
                                            styles.radioOption,
                                            {
                                                backgroundColor: formData.preferredContactMethod === method ? colors.primary + '20' : colors.card,
                                                borderColor: formData.preferredContactMethod === method ? colors.primary : colors.border
                                            }
                                        ]}
                                        onPress={() => setFormData({ ...formData, preferredContactMethod: method })}
                                    >
                                        <ThemedText style={{ color: formData.preferredContactMethod === method ? colors.primary : colors.text, fontSize: 12, fontWeight: '700' }}>
                                            {method}
                                        </ThemedText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    {user?.role?.includes('peer-educator') && (
                        <View style={styles.section}>
                            <ThemedText type="h3" style={styles.sectionTitle}>Professional info</ThemedText>
                            <InputField
                                label="Specialization"
                                value={formData.specialization}
                                onChangeText={(txt: string) => setFormData({ ...formData, specialization: txt })}
                                placeholder="e.g. Mental Health Advocate"
                                icon="medal-outline"
                            />
                        </View>
                    )}

                    <View style={styles.section}>
                        <ThemedText type="h3" style={styles.sectionTitle}>Interests</ThemedText>
                        <InputField
                            label="Topics of Interest"
                            value={formData.interests}
                            onChangeText={(txt: string) => setFormData({ ...formData, interests: txt })}
                            placeholder="e.g. Anxiety, Career Growth, Mindfulness (comma separated)"
                            icon="bookmark-outline"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.fullSaveBtn, { backgroundColor: colors.primary }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <ThemedText style={styles.fullSaveBtnText}>Complete Profile Update</ThemedText>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
    },
    backBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    fullSaveBtn: {
        height: 56,
        borderRadius: BorderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        ...PlatformStyles.premiumShadow,
    },
    fullSaveBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    radioGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    radioOption: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
    },
});
