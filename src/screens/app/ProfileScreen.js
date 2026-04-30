import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, Image,
  ActivityIndicator, Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase, uploadAvatar } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import colors from '../../theme/colors';
import { heading } from '../../theme/fonts';
import SubjectBadge from '../../components/SubjectBadge';
import AvailabilityGrid from '../../components/AvailabilityGrid';
import { SUBJECTS } from '../../constants';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../../constants/legal';

export default function ProfileScreen() {
  const { profile, session, signOut, refreshProfile } = useAuthStore();
  const userId = session?.user?.id;

  const [editing, setEditing]     = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [bio, setBio]             = useState(profile?.bio ?? '');
  const [phone, setPhone]         = useState(profile?.phone ?? '');
  const [avatarUri, setAvatarUri] = useState(null);

  const [availability, setAvailability]   = useState(profile?.availability ?? []);
  const [savingAvail, setSavingAvail]     = useState(false);

  const isTutor   = profile?.role === 'tutor' || profile?.role === 'both';
  const isStudent = profile?.role === 'student' || profile?.role === 'both';

  const initials = profile?.full_name?.split(' ').map((w) => w[0]).slice(0, 2).join('') ?? '?';

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

  const [saveError, setSaveError] = useState('');

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

  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const toggleAvailability = async (day, period) => {
    const exists = availability.some((a) => a.day === day && a.period === period);
    const updated = exists
      ? availability.filter((a) => !(a.day === day && a.period === period))
      : [...availability, { day, period }];
    setAvailability(updated);

    // Persist to the correct table(s) based on role
    if (isTutor) {
      if (exists) {
        await supabase.from('tutor_availability')
          .delete().eq('tutor_id', userId).eq('day', day).eq('period', period);
      } else {
        await supabase.from('tutor_availability')
          .insert({ tutor_id: userId, day, period });
      }
    }
    if (isStudent) {
      if (exists) {
        await supabase.from('student_availability')
          .delete().eq('student_id', userId).eq('day', day).eq('period', period);
      } else {
        await supabase.from('student_availability')
          .insert({ student_id: userId, day, period });
      }
    }
  };

  const avatarSource = avatarUri ?? profile?.avatar_url;

  const roleBadgeColor = {
    student: colors.greenMuted,
    tutor:   colors.redMuted,
    both:    colors.gray100,
  }[profile?.role ?? 'student'];

  const roleBadgeTextColor = {
    student: colors.green,
    tutor:   colors.red,
    both:    colors.gray700,
  }[profile?.role ?? 'student'];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.red} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.hero}>
          <TouchableOpacity style={styles.avatarWrap} onPress={editing ? pickImage : undefined}>
            {avatarSource ? (
              <Image source={{ uri: avatarSource }} style={styles.heroAvatar} />
            ) : (
              <View style={styles.heroAvatarPlaceholder}>
                <Text style={styles.heroInitials}>{initials}</Text>
              </View>
            )}
            {editing && (
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={16} color={colors.white} />
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.heroName}>{profile?.full_name}</Text>
          <Text style={styles.heroEmail}>{profile?.email}</Text>

          <View style={[styles.roleBadge, { backgroundColor: roleBadgeColor }]}>
            <Text style={[styles.roleText, { color: roleBadgeTextColor }]}>
              {(profile?.role ?? 'student').charAt(0).toUpperCase() + (profile?.role ?? 'student').slice(1)}
            </Text>
          </View>
        </View>

        {/* Bio & Phone */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profile Info</Text>
            <TouchableOpacity onPress={() => setEditing(!editing)}>
              <Text style={styles.editLink}>{editing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>Bio</Text>
          {editing ? (
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={3}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell students about yourself…"
              placeholderTextColor={colors.gray300}
            />
          ) : (
            <Text style={styles.fieldValue}>{profile?.bio || 'No bio yet'}</Text>
          )}

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Phone</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="(713) 555-0100"
              placeholderTextColor={colors.gray300}
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.fieldValue}>{profile?.phone || 'Not provided'}</Text>
          )}

          {saveError ? (
            <Text style={styles.saveErrorText}>{saveError}</Text>
          ) : null}
          {editing && (
            <TouchableOpacity
              style={[styles.saveBtn, savingBio && { opacity: 0.6 }]}
              onPress={handleSaveProfile}
              disabled={savingBio}
            >
              {savingBio
                ? <ActivityIndicator color={colors.white} />
                : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          )}
        </View>

        {/* Subjects (tutors only) */}
        {isTutor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Subjects</Text>
            <View style={styles.badgeRow}>
              {(profile?.subjects ?? []).map((s) => (
                <SubjectBadge
                  key={typeof s === 'object' ? s.subject : s}
                  subject={typeof s === 'object' ? s.subject : s}
                  grade={typeof s === 'object' ? s.grade : undefined}
                />
              ))}
              {(profile?.subjects ?? []).length === 0 && (
                <Text style={styles.fieldValue}>None set yet</Text>
              )}
            </View>
          </View>
        )}

        {/* Availability / Free Periods (all users) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isTutor ? 'My Availability' : 'My Free Periods'}
          </Text>
          <Text style={styles.availHint}>
            {isTutor
              ? 'Tap a cell to toggle when students can book you'
              : 'Tap a cell to mark your free periods — tutors who share them rank higher in search'}
          </Text>
          <AvailabilityGrid
            availability={availability}
            onToggle={toggleAvailability}
          />
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          {/* PP / ToS links */}
          <View style={styles.legalRow}>
            <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.legalSep}>·</Text>
            <TouchableOpacity onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}>
              <Text style={styles.legalLink}>Terms of Service</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Sign out — inline confirm instead of Alert */}
          {confirmSignOut ? (
            <View style={styles.signOutConfirm}>
              <Text style={styles.signOutConfirmText}>Sign out of your account?</Text>
              <View style={styles.signOutConfirmBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmSignOut(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={signOut}>
                  <Text style={styles.confirmBtnText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={() => setConfirmSignOut(true)}
            >
              <Ionicons name="log-out-outline" size={18} color={colors.red} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },

  hero: {
    backgroundColor: colors.red,
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  heroAvatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: colors.white },
  heroAvatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroInitials: { color: colors.white, fontSize: 30, fontWeight: '800' },
  cameraIcon: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.green,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.white,
  },
  heroName:  { color: colors.white, fontSize: 22, fontFamily: heading.lg.fontFamily, fontWeight: '800', marginBottom: 3 },
  heroEmail: { color: colors.white, fontSize: 13, opacity: 0.8, marginBottom: 10 },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  roleText:  { fontSize: 13, fontWeight: '700' },

  section: {
    backgroundColor: colors.white,
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle:  { fontSize: 16, fontWeight: '800', color: colors.black },
  editLink:      { fontSize: 14, color: colors.red, fontWeight: '600' },

  fieldLabel: { fontSize: 11, fontWeight: '700', color: colors.gray500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  fieldValue: { fontSize: 14, color: colors.gray700, lineHeight: 20 },

  input: {
    borderWidth: 1.5, borderColor: colors.gray200, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: colors.black, backgroundColor: colors.offWhite,
  },
  textArea: { height: 80, textAlignVertical: 'top' },

  saveBtn: {
    backgroundColor: colors.red, borderRadius: 12,
    paddingVertical: 13, alignItems: 'center', marginTop: 18,
  },
  saveBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  availHint: { fontSize: 12, color: colors.gray400, marginBottom: 12 },

  saveErrorText: { fontSize: 12, color: colors.error, marginTop: 8 },

  legalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  legalLink: { fontSize: 13, color: colors.green, fontWeight: '600', textDecorationLine: 'underline' },
  legalSep:  { fontSize: 13, color: colors.gray300 },

  divider: { height: 1, backgroundColor: colors.gray100, marginVertical: 12 },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 6,
  },
  signOutText: { fontSize: 15, color: colors.red, fontWeight: '600' },

  signOutConfirm: { paddingVertical: 6 },
  signOutConfirmText: { fontSize: 14, color: colors.gray700, marginBottom: 12 },
  signOutConfirmBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: colors.gray200, borderRadius: 12,
    paddingVertical: 10, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, color: colors.gray600, fontWeight: '600' },
  confirmBtn: {
    flex: 1, backgroundColor: colors.red, borderRadius: 12,
    paddingVertical: 10, alignItems: 'center',
  },
  confirmBtnText: { fontSize: 14, color: colors.white, fontWeight: '700' },
});
