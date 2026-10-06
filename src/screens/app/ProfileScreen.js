import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase, uploadAvatar } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import colors from '../../theme/colors';
import { radii, space, border, press, hit, rule } from '../../theme/layout';
import { heading, label } from '../../theme/fonts';
import SubjectBadge from '../../components/SubjectBadge';
import AvailabilityGrid from '../../components/AvailabilityGrid';
import {
  Avatar, Button, Divider, EmptyState, ErrorBanner,
  Field, RoleSelector, SubjectPicker,
} from '../../components/ui';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../../constants/legal';

export default function ProfileScreen() {
  const { profile, session, signOut, refreshProfile } = useAuthStore();
  const userId = session?.user?.id;

  const [editing, setEditing]     = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [bio, setBio]             = useState(profile?.bio ?? '');
  const [phone, setPhone]         = useState(profile?.phone ?? '');
  const [avatarUri, setAvatarUri] = useState(null);
  const [saveError, setSaveError] = useState('');

  const [availability, setAvailability] = useState(profile?.availability ?? []);

  // Subjects editor
  const initSubjects = () =>
    (profile?.subjects ?? []).map((s) => (typeof s === 'object' ? s.subject : s));
  const initGradeMap = () =>
    Object.fromEntries(
      (profile?.subjects ?? [])
        .filter((s) => typeof s === 'object' && s.grade)
        .map((s) => [s.subject, s.grade]),
    );

  const [editingSubjects, setEditingSubjects]   = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState(initSubjects);
  const [gradeMap, setGradeMap]                 = useState(initGradeMap);
  const [savingSubjects, setSavingSubjects]     = useState(false);
  const [subjectError, setSubjectError]         = useState('');

  // Re-sync subjects when profile refreshes
  useEffect(() => {
    setSelectedSubjects(initSubjects());
    setGradeMap(initGradeMap());
  }, [profile?.subjects]);

  const [selectedRole, setSelectedRole] = useState(profile?.role ?? 'student');
  const [savingRole, setSavingRole]     = useState(false);
  const [roleError, setRoleError]       = useState('');
  const roleChanged = selectedRole !== (profile?.role ?? 'student');

  // Keep local role in sync whenever profile refreshes
  useEffect(() => {
    if (profile?.role) setSelectedRole(profile.role);
  }, [profile?.role]);

  const isTutor = profile?.role === 'tutor' || profile?.role === 'both';
  const canTeach = selectedRole === 'tutor' || selectedRole === 'both';

  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const handleSaveProfile = async () => {
    setSavingBio(true);
    setSaveError('');
    try {
      let avatarUrl = profile?.avatar_url;
      if (avatarUri) avatarUrl = await uploadAvatar(userId, avatarUri);

      const { error: updateError } = await supabase.from('profiles').update({
        bio:   bio   || null,
        phone: phone || null,
        ...(avatarUrl && { avatar_url: avatarUrl }),
      }).eq('id', userId);

      if (updateError) { setSaveError(updateError.message); }
      else { await refreshProfile(); setEditing(false); }
    } catch (e) {
      setSaveError(e?.message ?? 'Could not save changes.');
    } finally {
      setSavingBio(false);
    }
  };

  const handleSaveRole = async () => {
    setSavingRole(true);
    setRoleError('');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', userId);
      if (error) { setRoleError(error.message); return; }
      await refreshProfile();
    } catch (e) {
      setRoleError(e?.message ?? 'Could not update role.');
    } finally {
      setSavingRole(false);
    }
  };

  const toggleSubject = (s) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(s)) {
        setGradeMap((g) => { const copy = { ...g }; delete copy[s]; return copy; });
        return prev.filter((x) => x !== s);
      }
      return [...prev, s];
    });
  };

  const setGrade = (subject, val) =>
    setGradeMap((prev) => ({ ...prev, [subject]: val }));

  const handleSaveSubjects = async () => {
    setSavingSubjects(true);
    setSubjectError('');
    try {
      // Delete all existing subjects then re-insert
      await supabase.from('tutor_subjects').delete().eq('tutor_id', userId);
      if (selectedSubjects.length > 0) {
        const { error } = await supabase.from('tutor_subjects').insert(
          selectedSubjects.map((subject) => ({
            tutor_id: userId,
            subject,
            grade: gradeMap[subject] || null,
          })),
        );
        if (error) { setSubjectError(error.message); return; }
      }
      await refreshProfile();
      setEditingSubjects(false);
    } catch (e) {
      setSubjectError(e?.message ?? 'Could not save subjects.');
    } finally {
      setSavingSubjects(false);
    }
  };

  // Block schedule: toggle a block on/off (no day dimension).
  // All roles use tutor_availability — student_availability table doesn't exist.
  const toggleAvailability = async (block) => {
    const exists = availability.some((a) => a.period === block);
    setAvailability(exists
      ? availability.filter((a) => a.period !== block)
      : [...availability, { period: block }]);

    if (exists) {
      await supabase.from('tutor_availability')
        .delete().eq('tutor_id', userId).eq('period', block);
    } else {
      await supabase.from('tutor_availability')
        .insert({ tutor_id: userId, period: block });
    }
  };

  const avatarSource = avatarUri ?? profile?.avatar_url;
  const savedSubjects = profile?.subjects ?? [];

  const editLink = (active, onPress, label) => (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={hit.slop}
      activeOpacity={press.opacity}
      accessibilityRole="button"
      accessibilityLabel={`${active ? 'Cancel editing' : 'Edit'} ${label}`}
    >
      <Text style={styles.editLink}>{active ? 'Cancel' : 'Edit'}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand} />

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Hero */}
        <View style={styles.hero}>
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={editing ? pickImage : undefined}
            disabled={!editing}
            activeOpacity={editing ? press.opacity : 1}
            hitSlop={hit.slop}
            accessibilityRole={editing ? 'button' : 'image'}
            accessibilityLabel={editing ? 'Change your profile photo' : 'Your profile photo'}
          >
            <View style={styles.avatarRing}>
              <Avatar
                uri={avatarSource}
                name={profile?.full_name}
                size={84}
                color={colors.accentLight}
              />
            </View>
            {editing ? (
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={16} color={colors.white} />
              </View>
            ) : null}
          </TouchableOpacity>

          <View style={styles.heroRule} />
          <Text style={styles.heroName}>{profile?.full_name}</Text>
          <Text style={styles.heroEmail}>{profile?.email}</Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* Profile info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Profile Info</Text>
              {editLink(editing, () => { setEditing(!editing); setSaveError(''); }, 'profile info')}
            </View>

            <ErrorBanner message={saveError} />

            {editing ? (
              <>
                <Field
                  label="Bio"
                  placeholder="Tell students about yourself…"
                  multiline
                  numberOfLines={3}
                  value={bio}
                  onChangeText={setBio}
                />
                <Field
                  label="Phone"
                  icon="call-outline"
                  placeholder="(713) 555-0100"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
                <Button
                  label="Save Changes"
                  onPress={handleSaveProfile}
                  loading={savingBio}
                  fullWidth
                />
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>Bio</Text>
                <Text style={styles.fieldValue}>{profile?.bio || 'No bio yet'}</Text>

                <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Phone</Text>
                <Text style={styles.fieldValue}>{profile?.phone || 'Not provided'}</Text>
              </>
            )}
          </View>

          {/* Role */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Role</Text>
            <Text style={styles.hint}>
              You can be a student, a tutor, or both at the same time.
            </Text>

            <ErrorBanner message={roleError} />

            <RoleSelector value={selectedRole} onChange={setSelectedRole} />

            {roleChanged ? (
              <Button
                label="Save Role"
                onPress={handleSaveRole}
                loading={savingRole}
                fullWidth
                style={styles.sectionAction}
              />
            ) : null}
          </View>

          {/* Subjects (tutors / both) */}
          {canTeach ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My Subjects</Text>
                {editLink(
                  editingSubjects,
                  () => { setEditingSubjects(!editingSubjects); setSubjectError(''); },
                  'subjects',
                )}
              </View>

              {editingSubjects ? (
                <>
                  <Text style={styles.hint}>
                    Tap a category to expand it, then tap subjects to add or remove them.
                  </Text>

                  <ErrorBanner message={subjectError} />

                  <SubjectPicker
                    selected={selectedSubjects}
                    onToggle={toggleSubject}
                    grades={gradeMap}
                    onGradeChange={setGrade}
                  />

                  <Button
                    label="Save Subjects"
                    onPress={handleSaveSubjects}
                    loading={savingSubjects}
                    fullWidth
                    style={styles.sectionAction}
                  />
                </>
              ) : savedSubjects.length ? (
                <View style={styles.badgeRow}>
                  {savedSubjects.map((s) => {
                    const name  = typeof s === 'object' ? s.subject : s;
                    const grade = typeof s === 'object' ? s.grade   : undefined;
                    return <SubjectBadge key={name} subject={name} grade={grade} />;
                  })}
                </View>
              ) : (
                <EmptyState
                  icon="book-outline"
                  title="No subjects yet"
                  body="Tap Edit to pick the classes you can help with — core classes, SAT and AP."
                  compact
                />
              )}
            </View>
          ) : null}

          {/* Availability */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isTutor ? 'My Availability' : 'My Free Blocks'}
            </Text>
            <Text style={styles.hint}>
              {isTutor
                ? 'Tap a block to toggle when students can book you'
                : 'Tap a block to mark it free — tutors who share your blocks rank higher in search'}
            </Text>
            <AvailabilityGrid
              availability={availability}
              onToggle={toggleAvailability}
            />
          </View>

          {/* Account */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>

            <View style={styles.legalRow}>
              <TouchableOpacity
                onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
                hitSlop={hit.slop}
                activeOpacity={press.opacity}
                accessibilityRole="link"
              >
                <Text style={styles.legalLink}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={styles.legalSep}>·</Text>
              <TouchableOpacity
                onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}
                hitSlop={hit.slop}
                activeOpacity={press.opacity}
                accessibilityRole="link"
              >
                <Text style={styles.legalLink}>Terms of Service</Text>
              </TouchableOpacity>
            </View>

            <Divider />

            {confirmSignOut ? (
              <View>
                <Text style={styles.signOutPrompt}>Sign out of your account?</Text>
                <View style={styles.rowActions}>
                  <Button
                    label="Cancel"
                    variant="neutral"
                    size="sm"
                    onPress={() => setConfirmSignOut(false)}
                    style={styles.grow}
                  />
                  <Button
                    label="Sign Out"
                    variant="dangerSolid"
                    size="sm"
                    onPress={signOut}
                    style={styles.grow}
                  />
                </View>
              </View>
            ) : (
              <Button
                label="Sign Out"
                icon="log-out-outline"
                variant="danger"
                size="sm"
                onPress={() => setConfirmSignOut(true)}
                style={styles.signOutBtn}
              />
            )}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: colors.brand,
    alignItems: 'center',
    paddingTop: space.xl,
    paddingBottom: space.xxl,
    paddingHorizontal: space.xl,
  },
  avatarWrap: { position: 'relative', marginBottom: space.md },
  avatarRing: {
    borderRadius: radii.pill,
    borderWidth: 3,
    borderColor: colors.white,
  },
  cameraIcon: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: radii.pill,
    backgroundColor: colors.brand,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.white,
  },
  heroRule: {
    width: rule.width, height: rule.height,
    backgroundColor: colors.gold,
    marginTop: space.xs, marginBottom: space.md,
  },
  heroName:  { ...heading.xl, color: colors.white, fontSize: 26, marginBottom: space.xs },
  heroEmail: { color: colors.whiteAlpha[80], fontSize: 13, marginBottom: space.sm },

  roleBadge: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radii.xs,
    backgroundColor: colors.maroon,
  },
  roleBadgeText: { ...label.caps, fontSize: 10, letterSpacing: 1.6, color: colors.white },

  // ── Sections ──────────────────────────────────────────────────────────────
  body: { padding: space.lg, gap: space.md },
  section: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: space.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.md,
  },
  sectionTitle:  { ...heading.lg, fontSize: 18, color: colors.black, marginBottom: space.xs },
  sectionAction: { marginTop: space.lg },
  editLink:      { ...label.caps, fontSize: 11, letterSpacing: 1.6, color: colors.brand },

  fieldLabel: {
    ...label.caps, fontSize: 10, letterSpacing: 1.8,
    color: colors.gray500, marginBottom: space.xs,
  },
  fieldLabelSpaced: { marginTop: space.md },
  fieldValue: { fontSize: 14, color: colors.gray700, lineHeight: 20 },

  hint: {
    fontSize: 12, color: colors.gray500,
    marginBottom: space.md, lineHeight: 17,
  },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },

  // ── Account ───────────────────────────────────────────────────────────────
  legalRow:  { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  legalLink: {
    fontSize: 13, color: colors.brand,
    fontWeight: '600', textDecorationLine: 'underline',
  },
  legalSep: { fontSize: 13, color: colors.gray300 },

  signOutPrompt: { fontSize: 14, color: colors.gray700, marginBottom: space.md },
  signOutBtn:    { alignSelf: 'flex-start' },
  rowActions:    { flexDirection: 'row', gap: space.sm },
  grow:          { flex: 1 },

  bottomSpacer: { height: space.huge },
});
