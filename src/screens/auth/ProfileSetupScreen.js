/**
 * ProfileSetupScreen: a short, guided setup after sign-up.
 *
 *   Tutors / both:  1 About you → 2 What you teach → 3 When you're free
 *   Students:       1 About you → 2 When you're free
 *
 * People who signed up with Google never saw the role picker, so they start
 * with a "How will you use it?" step.
 *
 * Ollie explains each step, a progress bar shows how far along you are, and
 * everything is saved in one go at the end. "Skip for now" is always there.
 * Phone numbers are not asked for here: they're private and optional, and can
 * be added later from Profile.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase, uploadAvatar } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import colors from '../../theme/colors';
import { radii, space, border, press, hit } from '../../theme/layout';
import AvailabilityGrid from '../../components/AvailabilityGrid';
import { type } from '../../theme/fonts';
import {
  AuthShell, Button, ErrorBanner, FadeIn, Field, Mascot, RoleSelector, SubjectPicker,
} from '../../components/ui';

const STEP_COPY = {
  role: {
    title: 'How will you use it?',
    ollie: 'Welcome! Are you here to find a tutor, to tutor others, or both? You can change this later.',
  },
  about: {
    title: 'About you',
    ollie: "Hi! I'm Ollie. Add a photo and a line about yourself so people know who they're meeting.",
  },
  teach: {
    title: 'What you teach',
    ollie: 'Pick the classes you can help with. Add your grade if you like; it builds trust.',
  },
  free: {
    title: "When you're free",
    ollie: 'Tap the blocks you usually have free. This is how we match tutors and students.',
  },
};

export default function ProfileSetupScreen() {
  const { session, profile, refreshProfile, completeSetup } = useAuthStore();
  const userId = session?.user?.id;
  // Email sign-ups chose a role on the sign-up form; Google sign-ups pick it here.
  const askRole = !session?.user?.user_metadata?.role;
  const [role, setRole] = useState(profile?.role ?? session?.user?.user_metadata?.role ?? 'student');
  const isTutor = role === 'tutor' || role === 'both';

  const steps = [...(askRole ? ['role'] : []), 'about', ...(isTutor ? ['teach'] : []), 'free'];
  const [stepIndex, setStepIndex] = useState(0);
  const step   = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const copy   = STEP_COPY[step];

  const [avatarUri, setAvatarUri] = useState(null);
  const [bio, setBio]             = useState(profile?.bio ?? '');

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

  // Each block is stored once per row, no day dimension
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
          ...(askRole   ? { role }      : {}),
          ...(bio       ? { bio }       : {}),
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

      // 4. Save free blocks: stored in tutor_availability for all roles
      //    (student_availability table does not exist; one table covers everyone)
      if (availabilitySlots.length > 0) {
        await supabase.from('tutor_availability').delete().eq('tutor_id', userId);
        await supabase.from('tutor_availability').insert(
          availabilitySlots.map(({ period }) => ({ tutor_id: userId, period })),
        );
      }

      // 5. Refresh profile in store (best effort)
      try { await refreshProfile(); } catch (e) { if (__DEV__) console.warn('refreshProfile:', e); }

      // 6. Mark setup complete in DB + local state, which switches App.js to AppNavigator
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
      title={copy.title}
      subtitle={`Step ${stepIndex + 1} of ${steps.length}`}
    >
      {/* Progress */}
      <View
        style={styles.progressTrack}
        accessibilityRole="progressbar"
        accessibilityLabel={`Setup step ${stepIndex + 1} of ${steps.length}`}
        accessibilityValue={{ min: 1, max: steps.length, now: stepIndex + 1 }}
      >
        {steps.map((s, i) => (
          <View key={s} style={[styles.progressSeg, i <= stepIndex && styles.progressSegOn]} />
        ))}
      </View>

      {/* Ollie explains the step */}
      <FadeIn key={`ollie-${step}`} style={styles.guide}>
        <Mascot size={52} mood={isLast ? 'happy' : 'default'} />
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{copy.ollie}</Text>
        </View>
      </FadeIn>

      <ErrorBanner message={saveError} />

      <FadeIn key={step}>
        {step === 'role' ? (
          <RoleSelector value={role} onChange={setRole} />
        ) : null}

        {step === 'about' ? (
          <>
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
              <Text style={styles.avatarHint}>Tap to add a photo (optional)</Text>
            </View>

            <Field
              label="Bio"
              placeholder={isTutor
                ? 'e.g. Junior, strong in Algebra 2 and SAT Math'
                : 'e.g. Sophomore, working on Chemistry'}
              multiline
              numberOfLines={3}
              value={bio}
              onChangeText={setBio}
            />
          </>
        ) : null}

        {step === 'teach' ? (
          <SubjectPicker
            selected={selectedSubjects}
            onToggle={toggleSubject}
            grades={gradeMap}
            onGradeChange={setGrade}
          />
        ) : null}

        {step === 'free' ? (
          <>
            <Text style={styles.hint}>
              {isTutor
                ? 'Students can book you during these blocks.'
                : 'Tutors who share your free blocks show up first.'}
            </Text>
            <AvailabilityGrid
              availability={availabilitySlots}
              onToggle={toggleBlock}
            />
            {selectedBlocks.size > 0 ? (
              <View style={styles.availCount}>
                <Ionicons name="checkmark-circle" size={14} color={colors.brandText} />
                <Text style={styles.availCountText}>
                  {selectedBlocks.size} block{selectedBlocks.size === 1 ? '' : 's'} selected
                </Text>
              </View>
            ) : null}
          </>
        ) : null}
      </FadeIn>

      <View style={styles.nav}>
        {stepIndex > 0 ? (
          <Button
            label="Back"
            variant="secondary"
            onPress={() => setStepIndex(stepIndex - 1)}
            style={styles.navBack}
          />
        ) : null}
        <Button
          label={isLast ? 'Finish setup' : 'Next'}
          icon={isLast ? 'checkmark' : 'arrow-forward'}
          onPress={isLast ? handleSave : () => setStepIndex(stepIndex + 1)}
          loading={isLast && loading}
          style={styles.navNext}
        />
      </View>

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
    backgroundColor: colors.offWhite,
    borderWidth: border.control, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: radii.pill,
    backgroundColor: colors.brand,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.white,
  },
  avatarHint: { ...type.small, color: colors.gray500 },

  progressTrack: { flexDirection: 'row', gap: 6, marginBottom: space.xl },
  progressSeg:   { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.gray200 },
  progressSegOn: { backgroundColor: colors.gold },

  guide:  { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, marginBottom: space.xl },
  bubble: {
    flex: 1,
    backgroundColor: colors.brandTint,
    borderRadius: radii.lg,
    borderBottomLeftRadius: 4,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  bubbleText: { ...type.small, color: colors.black },

  hint: { ...type.small, color: colors.gray500, marginBottom: space.md },

  availCount: {
    flexDirection: 'row', alignItems: 'center',
    gap: space.xs, marginTop: space.md,
  },
  availCountText: { ...type.small, color: colors.brandText, fontWeight: '700' },

  nav:     { flexDirection: 'row', gap: space.sm, marginTop: space.xxl },
  navBack: { flex: 1 },
  navNext: { flex: 2 },

  skipBtn:  { alignItems: 'center', marginTop: space.lg },
  skipText: { ...type.small, color: colors.gray500, textDecorationLine: 'underline' },
});
