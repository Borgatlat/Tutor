import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase, uploadAvatar } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import colors from '../../theme/colors';
import { heading } from '../../theme/fonts';
import { SUBJECT_CATEGORIES, PERIODS } from '../../constants';
import { DAYS } from '../../constants';

export default function ProfileSetupScreen() {
  const { session, profile, refreshProfile, completeSetup } = useAuthStore();
  const userId = session?.user?.id;
  // Role comes from the profile (created from sign-up metadata) or metadata fallback
  const role = profile?.role ?? session?.user?.user_metadata?.role ?? 'student';
  const isTutor   = role === 'tutor' || role === 'both';
  const isStudent = role === 'student' || role === 'both';

  const [avatarUri, setAvatarUri]       = useState(null);
  const [bio, setBio]                   = useState(profile?.bio ?? '');
  const [phone, setPhone]               = useState(profile?.phone ?? '');

  // Pre-populate subjects from saved profile
  const savedSubjects = (profile?.subjects ?? []).map((s) =>
    typeof s === 'object' ? s.subject : s
  );
  const savedGradeMap = Object.fromEntries(
    (profile?.subjects ?? [])
      .filter((s) => typeof s === 'object' && s.grade)
      .map((s) => [s.subject, s.grade])
  );
  const [selectedSubjects, setSelected] = useState(savedSubjects);
  const [gradeMap, setGradeMap]         = useState(savedGradeMap);

  // Pre-populate free periods from saved availability (deduplicate by period number)
  const savedPeriods = new Set(
    (profile?.availability ?? []).map((a) => a.period)
  );
  const [selectedPeriods, setSelectedPeriods] = useState(savedPeriods);
  const [loading, setLoading]           = useState(false);
  const [saveError, setSaveError]       = useState('');

  const togglePeriod = (period) => {
    setSelectedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(period)) next.delete(period); else next.add(period);
      return next;
    });
  };

  // Expand selected periods across all days for DB save
  const availabilitySlots = [...selectedPeriods].flatMap((p) =>
    DAYS.map((d) => ({ day: d, period: p }))
  );

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return; // silently skip on web
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const toggleSubject = (s) => {
    setSelected((prev) => {
      if (prev.includes(s)) {
        setGradeMap((g) => { const copy = { ...g }; delete copy[s]; return copy; });
        return prev.filter((x) => x !== s);
      }
      return [...prev, s];
    });
  };

  const setGrade = (subject, grade) => {
    setGradeMap((prev) => ({ ...prev, [subject]: grade }));
  };

  const handleSave = async () => {
    setLoading(true);
    setSaveError('');
    try {
      // 1. Upload avatar if selected
      let avatarUrl = null;
      if (avatarUri) {
        try { avatarUrl = await uploadAvatar(userId, avatarUri); }
        catch (e) { if (__DEV__) console.warn('Avatar upload failed:', e.message); }
      }

      // 2. Update profile row (always set setup_complete: true here)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          setup_complete: true,
          ...(bio       ? { bio }       : {}),
          ...(phone     ? { phone }     : {}),
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        })
        .eq('id', userId);

      if (profileError) {
        if (__DEV__) console.warn('Profile update error:', profileError.message);
        setSaveError(profileError.message);
        // Don't return — still save subjects and navigate
      }

      // 3. Save subjects + grades (tutors / both only)
      if (selectedSubjects.length > 0) {
        const { error: subjectsError } = await supabase
          .from('tutor_subjects')
          .upsert(
            selectedSubjects.map((subject) => ({
              tutor_id: userId,
              subject,
              grade: gradeMap[subject] || null,
            })),
            { onConflict: 'tutor_id,subject' }
          );
        if (subjectsError && __DEV__) console.warn('Subjects error:', subjectsError.message);
      }

      // 4. Save free periods / availability
      if (availabilitySlots.length > 0) {
        if (isTutor) {
          await supabase.from('tutor_availability').delete().eq('tutor_id', userId);
          await supabase.from('tutor_availability').insert(
            availabilitySlots.map(({ day, period }) => ({ tutor_id: userId, day, period }))
          );
        }
        if (isStudent) {
          await supabase.from('student_availability').delete().eq('student_id', userId);
          await supabase.from('student_availability').insert(
            availabilitySlots.map(({ day, period }) => ({ student_id: userId, day, period }))
          );
        }
      }

      // 5. Refresh profile in store (best effort)
      try { await refreshProfile(); } catch (e) { if (__DEV__) console.warn('refreshProfile:', e); }

      // 5. Mark setup complete in DB + local state — switches App.js to AppNavigator
      await completeSetup();

    } catch (e) {
      if (__DEV__) console.error('[ProfileSetup] handleSave:', e);
      setSaveError(e?.message ?? 'Something went wrong. Please try again.');
      // Still navigate forward — user can update profile later from Profile tab
      await completeSetup();
    } finally {
      setLoading(false);
    }
  };

  const setupScroll = (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >

          {/* Header */}
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Set Up Your Profile</Text>
            <Text style={styles.heroSub}>All fields are optional — you can update these later</Text>
          </View>

          <View style={styles.card}>

            {/* Avatar */}
            <View style={styles.avatarSection}>
              <TouchableOpacity style={styles.avatarWrap} onPress={pickImage}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={42} color={colors.gray300} />
                  </View>
                )}
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera" size={16} color={colors.white} />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHint}>Tap to add a photo</Text>
            </View>

            {/* Bio */}
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell students a little about yourself…"
              placeholderTextColor={colors.gray300}
              multiline
              numberOfLines={3}
              value={bio}
              onChangeText={setBio}
            />

            {/* Phone */}
            <Text style={[styles.label, { marginTop: 20 }]}>Phone Number</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={18} color={colors.gray400} style={styles.inputIcon} />
              <TextInput
                style={styles.inputInner}
                placeholder="(713) 555-0100"
                placeholderTextColor={colors.gray300}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* Subjects */}
            <Text style={[styles.label, { marginTop: 24 }]}>Subjects You Can Teach</Text>
            <Text style={styles.hint}>Select all that apply. Skip if you're only a student.</Text>

            {Object.entries(SUBJECT_CATEGORIES).map(([category, subjects]) => (
              <View key={category} style={styles.categoryBlock}>
                <Text style={styles.categoryLabel}>{category}</Text>
                <View style={styles.chipRow}>
                  {subjects.map((s) => {
                    const active = selectedSubjects.includes(s);
                    return (
                      <TouchableOpacity
                        key={s}
                        style={[styles.subjectChip, active && styles.subjectChipActive]}
                        onPress={() => toggleSubject(s)}
                      >
                        {active && (
                          <Ionicons name="checkmark" size={13} color={colors.white} style={{ marginRight: 4 }} />
                        )}
                        <Text style={[styles.subjectText, active && styles.subjectTextActive]}>{s}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            {/* Grade inputs for selected subjects */}
            {selectedSubjects.length > 0 && (
              <View style={styles.gradeSection}>
                <Text style={[styles.label, { marginTop: 0 }]}>Your Grade / Score</Text>
                <Text style={styles.hint}>
                  Optional — SAT section scores are out of 800; AP grades are A–F or 1–5
                </Text>
                {selectedSubjects.map((s) => (
                  <View key={s} style={styles.gradeRow}>
                    <Text style={styles.gradeSubject} numberOfLines={1}>{s}</Text>
                    <TextInput
                      style={styles.gradeInput}
                      placeholder={
                        s === 'SAT Math' || s === 'SAT English'
                          ? 'e.g. 750'
                          : 'e.g. A+'
                      }
                      placeholderTextColor={colors.gray300}
                      value={gradeMap[s] ?? ''}
                      onChangeText={(t) => setGrade(s, t)}
                      maxLength={8}
                    />
                  </View>
                ))}
              </View>
            )}

            {/* Free periods */}
            <Text style={[styles.label, { marginTop: 28 }]}>
              {isTutor ? 'Your Free Periods (Availability)' : 'Your Free Periods'}
            </Text>
            <Text style={styles.hint}>
              {isTutor
                ? 'Students will see and book these slots'
                : 'Tutors with matching free periods rank higher in search'}
            </Text>
            <View style={styles.periodChipRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => {
                const active = selectedPeriods.has(p);
                return (
                  <TouchableOpacity
                    key={p}
                    style={[styles.periodChip, active && styles.periodChipActive]}
                    onPress={() => togglePeriod(p)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.periodChipText, active && styles.periodChipTextActive]}>
                      P{p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedPeriods.size > 0 && (
              <View style={styles.availCountBadge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.green} />
                <Text style={styles.availCountText}>
                  {selectedPeriods.size} period{selectedPeriods.size !== 1 ? 's' : ''} selected
                </Text>
              </View>
            )}

            {/* Save */}
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={colors.white} />
                : <Text style={styles.btnText}>Looks Good →</Text>}
            </TouchableOpacity>

            {saveError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={15} color={colors.error} />
                <Text style={styles.errorText}>{saveError}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.skipBtn} onPress={() => completeSetup()}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>

          </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {Platform.OS === 'web' ? (
        <View style={{ flex: 1 }}>{setupScroll}</View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
        >
          {setupScroll}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.green },
  scroll: { flexGrow: 1, paddingBottom: 24 },

  hero: {
    backgroundColor: colors.green,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
  },
  heroTitle: { color: colors.white, fontSize: 28, fontFamily: heading.lg.fontFamily, fontWeight: '800', marginBottom: 8 },
  heroSub:   { color: colors.white, fontSize: 14, opacity: 0.8, lineHeight: 20 },

  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 60,
  },

  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarWrap: { position: 'relative', marginBottom: 8 },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.gray100,
    borderWidth: 2, borderColor: colors.gray200,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.red,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.white,
  },
  avatarHint: { fontSize: 13, color: colors.gray400 },

  label: {
    fontSize: 12, fontWeight: '700', color: colors.gray600,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  hint: { fontSize: 12, color: colors.gray400, marginBottom: 10, marginTop: -4 },

  input: {
    borderWidth: 1.5, borderColor: colors.gray200, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: colors.black, backgroundColor: colors.offWhite,
  },
  textArea: { height: 88, textAlignVertical: 'top' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.gray200, borderRadius: 14,
    backgroundColor: colors.offWhite, paddingHorizontal: 14,
  },
  inputIcon:  { marginRight: 10 },
  inputInner: { flex: 1, fontSize: 15, color: colors.black, paddingVertical: 11 },

  categoryBlock: { marginBottom: 16 },
  categoryLabel: {
    fontSize: 11, fontWeight: '700', color: colors.red,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subjectChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.gray200,
    backgroundColor: colors.offWhite,
  },
  subjectChipActive: { backgroundColor: colors.red, borderColor: colors.red },
  subjectText:       { fontSize: 13, color: colors.gray700, fontWeight: '600' },
  subjectTextActive: { color: colors.white },

  gradeSection: {
    marginTop: 24,
    backgroundColor: colors.offWhite,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  gradeRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 10, gap: 10,
  },
  gradeSubject: {
    flex: 1, fontSize: 13, fontWeight: '600', color: colors.black,
  },
  gradeInput: {
    width: 90,
    borderWidth: 1.5, borderColor: colors.gray200, borderRadius: 10,
    backgroundColor: colors.white,
    paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 14, color: colors.black, textAlign: 'center',
  },

  btn: {
    backgroundColor: colors.green,
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 32,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.white, fontWeight: '800', fontSize: 16 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.errorMuted, borderRadius: 10,
    padding: 12, marginTop: 12,
    borderWidth: 1, borderColor: colors.errorBorder,
  },
  errorText: { flex: 1, color: colors.error, fontSize: 12 },

  skipBtn:  { alignItems: 'center', marginTop: 16 },
  skipText: { fontSize: 14, color: colors.gray400, textDecorationLine: 'underline' },

  periodChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  periodChip: {
    width: 54,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    backgroundColor: colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodChipActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  periodChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray600,
  },
  periodChipTextActive: {
    color: colors.white,
  },
  availCountBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 8,
  },
  availCountText: { fontSize: 12, color: colors.green, fontWeight: '700' },
});
