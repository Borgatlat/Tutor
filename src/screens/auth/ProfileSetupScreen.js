import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase, uploadAvatar } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import colors from '../../theme/colors';
import { radii, space, border, press, hit } from '../../theme/layout';
import AvailabilityGrid from '../../components/AvailabilityGrid';
import {
  AuthShell, Button, ErrorBanner, Field, SubjectPicker,
} from '../../components/ui';

export default function ProfileSetupScreen() {
  const { session, profile, refreshProfile, completeSetup } = useAuthStore();
  const userId = session?.user?.id;
  // Role comes from the profile (created from sign-up metadata) or metadata fallback
  const role = profile?.role ?? session?.user?.user_metadata?.role ?? 'student';
  const isTutor = role === 'tutor' || role === 'both';

  const [avatarUri, setAvatarUri] = useState(null);
  const [bio, setBio]             = useState(profile?.bio ?? '');
  const [phone, setPhone]         = useState(profile?.phone ?? '');

  // Pre-populate subjects from saved profile
  const savedSubjects = (profile?.subjects ?? []).map((s) =>
    typeof s === 'object' ? s.subject : s,
  );
  const savedGradeMap = Object.fromEntries(
    (profile?.subjects ?? [])
      .filter((s) => typeof s === 'object' && s.grade)
      .map((s) => [s.subject, s.grade]),
  );
  const [selectedSubjects, setSelected] = useState(savedSubjects);
  const [gradeMap, setGradeMap]         = useState(savedGradeMap);

  // Pre-populate free blocks from saved availability (deduplicate by block number)
  const [selectedBlocks, setSelectedBlocks] = useState(
    () => new Set((profile?.availability ?? []).map((a) => a.period)),
  );
  const [loading, setLoading]     = useState(false);
  const [saveError, setSaveError] = useState('');

  const toggleBlock = (block) => {
    setSelectedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(block)) next.delete(block); else next.add(block);
      return next;
    });
  };

  // Each block is stored once per row — no day dimension
  const availabilitySlots = [...selectedBlocks].map((b) => ({ period: b }));

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

      // Stop here on failure so the banner is actually readable. Previously this
      // set saveError and then called completeSetup() anyway, navigating away
      // before the user could ever see why the save failed.
      if (profileError) {
        if (__DEV__) console.warn('Profile update error:', profileError.message);
        setSaveError(profileError.message);
        return;
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
            { onConflict: 'tutor_id,subject' },
          );
        if (subjectsError && __DEV__) console.warn('Subjects error:', subjectsError.message);
      }

      // 4. Save free blocks — stored in tutor_availability for all roles
      //    (student_availability table does not exist; one table covers everyone)
      if (availabilitySlots.length > 0) {
        await supabase.from('tutor_availability').delete().eq('tutor_id', userId);
        await supabase.from('tutor_availability').insert(
          availabilitySlots.map(({ period }) => ({ tutor_id: userId, period })),
        );
      }

      // 5. Refresh profile in store (best effort)
      try { await refreshProfile(); } catch (e) { if (__DEV__) console.warn('refreshProfile:', e); }

      // 6. Mark setup complete in DB + local state — switches App.js to AppNavigator
      await completeSetup();
    } catch (e) {
      if (__DEV__) console.error('[ProfileSetup] handleSave:', e);
      setSaveError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Set Up Your Profile"
      subtitle="All fields are optional — you can update these later"
    >
      <ErrorBanner message={saveError} />

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={pickImage}
          activeOpacity={press.opacity}
          hitSlop={hit.slop}
          accessibilityRole="button"
          accessibilityLabel="Add a profile photo"
        >
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

      <Field
        label="Bio"
        placeholder="Tell students a little about yourself…"
        multiline
        numberOfLines={3}
        value={bio}
        onChangeText={setBio}
      />

      <Field
        label="Phone Number"
        icon="call-outline"
        placeholder="(713) 555-0100"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        value={phone}
        onChangeText={setPhone}
      />

      {/* Subjects */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Subjects You Can Teach</Text>
        <Text style={styles.hint}>
          Core classes, SAT and AP — select all that apply. Skip if you're only a student.
        </Text>
        <SubjectPicker
          selected={selectedSubjects}
          onToggle={toggleSubject}
          grades={gradeMap}
          onGradeChange={setGrade}
        />
      </View>

      {/* Free blocks */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          {isTutor ? 'Your Free Blocks (Availability)' : 'Your Free Blocks'}
        </Text>
        <Text style={styles.hint}>
          {isTutor
            ? 'Students can book sessions during these blocks'
            : 'Tutors with matching free blocks rank higher in search'}
        </Text>

        <AvailabilityGrid
          availability={availabilitySlots}
          onToggle={toggleBlock}
        />

        {selectedBlocks.size > 0 ? (
          <View style={styles.availCount}>
            <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
            <Text style={styles.availCountText}>
              {selectedBlocks.size} block{selectedBlocks.size === 1 ? '' : 's'} selected
            </Text>
          </View>
        ) : null}
      </View>

      <Button
        label="Looks Good"
        icon="arrow-forward"
        onPress={handleSave}
        loading={loading}
        fullWidth
        style={styles.save}
      />

      <TouchableOpacity
        style={styles.skipBtn}
        onPress={() => completeSetup()}
        hitSlop={hit.slop}
        activeOpacity={press.opacity}
        accessibilityRole="button"
        accessibilityLabel="Skip profile setup for now"
      >
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  avatarSection: { alignItems: 'center', marginBottom: space.xxl },
  avatarWrap:    { position: 'relative', marginBottom: space.sm },
  avatarImage:   { width: 100, height: 100, borderRadius: radii.pill },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: radii.pill,
    backgroundColor: colors.gray100,
    borderWidth: border.control, borderColor: colors.gray200,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: border.control, borderColor: colors.white,
  },
  avatarHint: { fontSize: 13, color: colors.gray400 },

  section:      { marginBottom: space.xxl },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.gray600 },
  hint: {
    fontSize: 12, color: colors.gray500,
    marginTop: space.xs, marginBottom: space.md, lineHeight: 17,
  },

  availCount: {
    flexDirection: 'row', alignItems: 'center',
    gap: space.xs, marginTop: space.md,
  },
  availCountText: { fontSize: 12, color: colors.accent, fontWeight: '700' },

  save: { marginTop: space.xs },

  skipBtn:  { alignItems: 'center', marginTop: space.lg },
  skipText: { fontSize: 14, color: colors.gray500, textDecorationLine: 'underline' },
});
