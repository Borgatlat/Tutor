import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { toUserMessage } from '../../utils/errors';
import {
  upcomingSchoolDays, toDateKey, dateChipParts, formatSessionDate,
} from '../../utils/schoolDays';
import useAuthStore from '../../store/useAuthStore';
import colors from '../../theme/colors';
import { radii, space, border, press, hit } from '../../theme/layout';
import { heading } from '../../theme/fonts';
import {
  Avatar, Button, Chip, EmptyState, ErrorBanner, Field,
} from '../../components/ui';

export default function BookSessionScreen({ route, navigation }) {
  const { tutor, slot } = route.params;
  const { profile }     = useAuthStore();

  // subjects may be an array of strings or of { subject, grade } objects
  const subjectList = (tutor.subjects ?? []).map((s) => (typeof s === 'object' ? s.subject : s));

  // A booking is a date plus a block. Default to the next school day so the
  // common case ("as soon as possible") needs no extra tap.
  const schoolDays = useMemo(() => upcomingSchoolDays(15), []);
  const [date, setDate]           = useState(schoolDays[0]);

  const [subject, setSubject]     = useState(subjectList[0] ?? null);
  const [notes, setNotes]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [booked, setBooked]       = useState(false);
  const [bookError, setBookError] = useState('');

  const handleBook = async () => {
    if (!subject) { setBookError('Please select a subject before continuing.'); return; }
    if (!date)    { setBookError('Please pick a day before continuing.'); return; }
    setLoading(true);
    setBookError('');
    const base = {
      tutor_id:   tutor.id,
      student_id: profile.id,
      subject,
      period:     slot.period,
      notes:      notes || null,
      status:     'pending',
    };

    let { error } = await supabase
      .from('sessions')
      .insert({ ...base, session_date: toDateKey(date) });

    // 42703 = column does not exist, meaning
    // supabase/migrations/0001_sessions_date.sql has not been run yet and the
    // table still has the old `day` column. Fall back so booking works either
    // way; once the migration is applied this branch never runs.
    if (error?.code === '42703') {
      const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const retry = await supabase
        .from('sessions')
        .insert({ ...base, day: DOW[date.getDay()] });
      error = retry.error;
    }

    setLoading(false);
    if (error) { setBookError(toUserMessage(error, "We couldn't book that session. Please try again.")); return; }
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
              { icon: 'calendar-outline', text: `${formatSessionDate(date)} · Block ${slot.period}` },
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
            <Text style={styles.slotText}>
              {formatSessionDate(date)} · Block {slot.period}
            </Text>
          </View>

          {/* Day picker - weekdays only, the next three school weeks */}
          <Text style={styles.label}>Day</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayRow}
          >
            {schoolDays.map((d) => {
              const key      = toDateKey(d);
              const active   = toDateKey(date) === key;
              const { dow, day } = dateChipParts(d);
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.dayChip, active && styles.dayChipActive]}
                  onPress={() => setDate(d)}
                  activeOpacity={press.opacity}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={formatSessionDate(d)}
                >
                  <Text style={[styles.dayDow, active && styles.dayTextActive]}>{dow}</Text>
                  <Text style={[styles.dayNum, active && styles.dayTextActive]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

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
  backText: { color: colors.white, fontSize: 15, fontWeight: '600' },

  header: {
    backgroundColor: colors.brand,
    paddingHorizontal: space.xl,
    paddingBottom: space.xxl,
  },
  headerTitle: { ...heading.lg, color: colors.white, fontSize: 26 },

  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    padding: space.xxl,
    paddingBottom: space.huge,
  },

  tutorRow:   { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.lg },
  tutorMeta:  { flex: 1 },
  tutorName:  { fontSize: 16, fontWeight: '800', color: colors.black },
  tutorEmail: { fontSize: 12, color: colors.gray500, marginTop: 2 },

  slotBanner: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.accentTint,
    borderRadius: radii.md, padding: space.md, marginBottom: space.xl,
    borderWidth: border.control, borderColor: colors.accent,
  },
  slotText: { fontSize: 16, fontWeight: '700', color: colors.accentDark },

  label: {
    fontSize: 13, fontWeight: '600',
    color: colors.gray600, marginBottom: space.sm,
  },
  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },

  notesField: { marginTop: space.xl },

  contactNote: {
    flexDirection: 'row', gap: space.sm,
    backgroundColor: colors.offWhite,
    borderRadius: radii.md, padding: space.md,
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
    backgroundColor: colors.accent,
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
