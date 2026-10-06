import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import colors from '../../theme/colors';
import { radii, space, border, press, hit, rule } from '../../theme/layout';
import { heading, label } from '../../theme/fonts';
import {
  Avatar, Button, Chip, EmptyState, ErrorBanner, Field,
} from '../../components/ui';

export default function BookSessionScreen({ route, navigation }) {
  const { tutor, slot } = route.params;
  const { profile }     = useAuthStore();

  // subjects may be an array of strings or of { subject, grade } objects
  const subjectList = (tutor.subjects ?? []).map((s) => (typeof s === 'object' ? s.subject : s));

  const [subject, setSubject]     = useState(subjectList[0] ?? null);
  const [notes, setNotes]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [booked, setBooked]       = useState(false);
  const [bookError, setBookError] = useState('');

  const handleBook = async () => {
    if (!subject) { setBookError('Please select a subject before continuing.'); return; }
    setLoading(true);
    setBookError('');
    const { error } = await supabase.from('sessions').insert({
      tutor_id:   tutor.id,
      student_id: profile.id,
      subject,
      period: slot.period,
      notes:  notes || null,
      status: 'pending',
    });
    setLoading(false);
    if (error) { setBookError(error.message); return; }
    setBooked(true);
  };

  // ── Success state ───────────────────────────────────────────────────────────
  if (booked) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successScreen}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={44} color={colors.white} />
          </View>
          <Text style={styles.successTitle}>Session Requested</Text>
          <Text style={styles.successSub}>
            Your request has been sent to {tutor.full_name}.{'\n'}
            They'll confirm it shortly.
          </Text>

          <View style={styles.confirmCard}>
            {[
              { icon: 'person-outline',   text: tutor.full_name },
              { icon: 'book-outline',     text: subject },
              { icon: 'calendar-outline', text: `Block ${slot.period}` },
            ].map((row) => (
              <View key={row.icon} style={styles.confirmRow}>
                <Ionicons name={row.icon} size={15} color={colors.gray500} />
                <Text style={styles.confirmText}>{row.text}</Text>
              </View>
            ))}
          </View>

          <Button
            label="View My Sessions"
            onPress={() => navigation.navigate('Sessions')}
            fullWidth
          />
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.navigate('Search')}
            hitSlop={hit.slop}
            activeOpacity={press.opacity}
            accessibilityRole="button"
            accessibilityLabel="Find another tutor"
          >
            <Text style={styles.backLinkText}>Find another tutor</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Booking form ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand} />

      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={hit.slop}
          activeOpacity={press.opacity}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.white} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.headerRule} />
          <Text style={styles.headerTitle}>Book a Session</Text>
        </View>

        <View style={styles.card}>
          {/* Tutor summary */}
          <View style={styles.tutorRow}>
            <Avatar uri={tutor.avatar_url} name={tutor.full_name} size={52} />
            <View style={styles.tutorMeta}>
              <Text style={styles.tutorName}>{tutor.full_name}</Text>
              <Text style={styles.tutorEmail}>{tutor.email}</Text>
            </View>
          </View>

          {/* Slot summary */}
          <View style={styles.slotBanner}>
            <Ionicons name="calendar" size={20} color={colors.accentDark} />
            <Text style={styles.slotText}>Block {slot.period}</Text>
          </View>

          <ErrorBanner message={bookError} />

          {/* Subject */}
          <Text style={styles.label}>Subject</Text>
          {subjectList.length ? (
            <View style={styles.subjectRow}>
              {subjectList.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  selected={subject === s}
                  showCheck
                  onPress={() => setSubject(s)}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="book-outline"
              title="This tutor hasn't listed any subjects"
              body="Ask them to add subjects to their profile before booking."
              compact
            />
          )}

          <Field
            label="Notes (optional)"
            placeholder="What topics do you need help with?"
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
            style={styles.notesField}
          />

          {/* Contact info */}
          <View style={styles.contactNote}>
            <Ionicons name="information-circle-outline" size={15} color={colors.gray500} />
            <Text style={styles.contactNoteText}>
              After confirming, you and {tutor.full_name?.split(' ')[0]} can contact each
              other at <Text style={styles.emailHighlight}>{tutor.email}</Text>
            </Text>
          </View>

          <Button
            label="Send Request"
            icon="checkmark-circle"
            onPress={handleBook}
            loading={loading}
            disabled={!subject}
            fullWidth
            style={styles.submit}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },

  navBar:   { backgroundColor: colors.brand, paddingHorizontal: space.lg, paddingVertical: space.sm },
  backBtn:  { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  backText: { ...label.caps, color: colors.white, fontSize: 11, letterSpacing: 1.8 },

  header: {
    backgroundColor: colors.brand,
    paddingHorizontal: space.xl,
    paddingBottom: space.xxl,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
  },
  // Short gold rule above the screen title (school-site heading treatment).
  headerRule: {
    width: rule.width, height: rule.height, borderRadius: rule.radius,
    backgroundColor: colors.gold,
    marginBottom: space.md,
  },
  headerTitle: { ...heading.xl, color: colors.white, fontSize: 28 },

  card: {
    flex: 1,
    backgroundColor: colors.white,
    margin: space.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: space.xxl,
    paddingBottom: space.xxxl,
  },

  tutorRow:   { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.lg },
  tutorMeta:  { flex: 1 },
  tutorName:  { fontSize: 16, fontWeight: '700', color: colors.black },
  tutorEmail: { fontSize: 12, color: colors.gray500, marginTop: 2 },

  slotBanner: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.brandTint,
    borderRadius: radii.lg, padding: space.lg, marginBottom: space.xl,
  },
  slotText: { fontSize: 16, fontWeight: '800', color: colors.brand },

  label: {
    ...label.caps, fontSize: 11, letterSpacing: 1.6,
    color: colors.gray600, marginBottom: space.sm,
  },
  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },

  notesField: { marginTop: space.xl },

  contactNote: {
    flexDirection: 'row', gap: space.sm,
    backgroundColor: colors.offWhite,
    borderRadius: radii.sm, padding: space.md,
  },
  contactNoteText: { flex: 1, fontSize: 12, color: colors.gray500, lineHeight: 18 },
  emailHighlight:  { color: colors.accent, fontWeight: '600' },

  submit: { marginTop: space.xl },

  // ── Success ───────────────────────────────────────────────────────────────
  successScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: space.xxxl,
    backgroundColor: colors.white,
  },
  successCircle: {
    width: 88, height: 88, borderRadius: radii.pill,
    backgroundColor: colors.brand,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: space.xl,
  },
  successTitle: { ...heading.lg, fontSize: 26, color: colors.black, marginBottom: space.sm },
  successSub: {
    fontSize: 15, color: colors.gray500,
    lineHeight: 22, textAlign: 'center', marginBottom: space.xxl,
  },
  confirmCard: {
    backgroundColor: colors.offWhite,
    borderRadius: radii.lg,
    padding: space.lg,
    width: '100%',
    gap: space.sm,
    marginBottom: space.xxl,
  },
  confirmRow:  { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  confirmText: { fontSize: 14, color: colors.black, fontWeight: '600' },

  backLink:     { marginTop: space.lg },
  backLinkText: {
    color: colors.accent, fontWeight: '600',
    fontSize: 14, textDecorationLine: 'underline',
  },
});
