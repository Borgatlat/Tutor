import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import Celebration from '../../components/Celebration';
import { bookableDays, chipLabel, formatSessionDate } from '../../utils/schedule';
import { getSessionTimeLabel } from '../../utils/calendar';
import useAuthStore from '../../store/useAuthStore';
import colors from '../../theme/colors';
import { cardShadow } from '../../theme/shadows';
import { radii, space, border, press, hit, rule } from '../../theme/layout';
import { heading, label, type } from '../../theme/fonts';
import {
  Avatar, Button, Chip, EmptyState, ErrorBanner, Field, Mascot,
  OrganicBackdrop,
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
  const [celebrate, setCelebrate] = useState(false);
  const [bookError, setBookError] = useState('');

  // Real dates: the next school days this block can still be booked, with
  // the ones the tutor is already booked in greyed out.
  const days = useMemo(() => bookableDays({ period: slot.period, count: 10 }), [slot.period]);
  const [busy, setBusy] = useState(() => new Set());
  const [date, setDate] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.rpc('tutor_booked_slots', {
        tutor: tutor.id, from_date: days[0], to_date: days[days.length - 1],
      });
      if (!alive) return;
      const taken = new Set((data ?? []).filter((r) => r.period === slot.period).map((r) => r.session_date));
      setBusy(taken);
      setDate((d) => d ?? days.find((x) => !taken.has(x)) ?? null);
    })();
    return () => { alive = false; };
  }, [tutor.id, slot.period, days]);

  const handleBook = async () => {
    if (!subject) { setBookError('Please select a subject before continuing.'); return; }
    if (!date)    { setBookError('Pick a day for the session.'); return; }
    setLoading(true);
    setBookError('');
    const { error } = await supabase.from('sessions').insert({
      tutor_id:   tutor.id,
      student_id: profile.id,
      subject,
      period: slot.period,
      session_date: date,
      notes:  notes || null,
      status: 'pending',
    });
    setLoading(false);
    if (error) {
      // 23505 = someone took this block on this day a moment ago.
      setBookError(error.code === '23505'
        ? 'That block was just booked. Pick another day.'
        : error.message);
      if (error.code === '23505') setBusy((b) => new Set([...b, date]));
      return;
    }
    setBooked(true);
    setCelebrate(true);
  };

  // ── Success state ───────────────────────────────────────────────────────────
  if (booked) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successScreen}>
          <Celebration visible={celebrate} confettiOnly onDone={() => setCelebrate(false)} />
          <Mascot size={128} mood="happy" style={styles.successMascot} />
          <Text style={styles.successTitle}>Session requested</Text>
          <Text style={styles.successSub}>
            Your request has been sent to {tutor.full_name}.{'\n'}
            They'll confirm it shortly.
          </Text>

          <View style={styles.confirmCard}>
            {[
              { icon: 'person-outline',   text: tutor.full_name },
              { icon: 'book-outline',     text: subject },
              { icon: 'calendar-outline', text: `${formatSessionDate(date)} · Block ${slot.period}` },
              { icon: 'time-outline',     text: getSessionTimeLabel(null, slot.period).split(' · ')[1] },
            ].map((row) => (
              <View key={row.icon} style={styles.confirmRow}>
                <Ionicons name={row.icon} size={15} color={colors.gray500} />
                <Text style={styles.confirmText}>{row.text}</Text>
              </View>
            ))}
          </View>

          <Button
            label="View my sessions"
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
          <OrganicBackdrop />
          <View style={styles.headerRule} />
          <Text style={styles.headerTitle}>Book a session</Text>
        </View>

        <View style={styles.card}>
          {/* Tutor summary */}
          <View style={styles.tutorRow}>
            <Avatar uri={tutor.avatar_url} name={tutor.full_name} size={52} />
            <View style={styles.tutorMeta}>
              <Text style={styles.tutorName}>{tutor.full_name}</Text>
              <Text style={styles.tutorEmail}>Peer tutor</Text>
            </View>
          </View>

          {/* Slot summary */}
          <View style={styles.slotBanner}>
            <Ionicons name="calendar" size={20} color={colors.brandText} />
            <View>
              <Text style={styles.slotText}>
                {date ? `${formatSessionDate(date)} · ` : ''}Block {slot.period}
              </Text>
              <Text style={styles.slotSub}>{getSessionTimeLabel(null, slot.period).split(' · ')[1]}</Text>
            </View>
          </View>

          {/* Day */}
          <Text style={styles.label}>Day</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayRow}
            style={styles.dayScroll}
          >
            {days.map((d) => (
              <Chip
                key={d}
                label={chipLabel(d)}
                selected={date === d}
                disabled={busy.has(d)}
                onPress={() => { setDate(d); setBookError(''); }}
                accessibilityLabel={`${formatSessionDate(d)}${busy.has(d) ? ', already booked' : ''}`}
              />
            ))}
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
              actionLabel="Back to their profile"
              onAction={() => navigation.goBack()}
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
              Once it's booked, you and {tutor.full_name?.split(' ')[0]} can message each other
              in the session's chat. No phone numbers or emails needed.
            </Text>
          </View>

          <Button
            label="Send request"
            icon="checkmark-circle"
            onPress={handleBook}
            loading={loading}
            disabled={!subject || !date}
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
  backText: { ...label.ui, color: colors.white, fontSize: 15 },

  header: {
    overflow: 'hidden',
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
  headerTitle: { ...type.title, color: colors.white },

  card: {
    flex: 1,
    backgroundColor: colors.surface,
    margin: space.lg,
    borderRadius: radii.xl,
    ...cardShadow,
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
  slotSub:  { ...type.small, color: colors.gray600 },
  dayScroll: { marginHorizontal: -space.xxl, marginBottom: space.xl },
  dayRow:    { gap: space.sm, paddingHorizontal: space.xxl },
  slotText: { fontSize: 16, fontWeight: '800', color: colors.brandText },

  label: { ...type.small, fontWeight: '600', color: colors.gray700, marginBottom: space.sm },
  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },

  notesField: { marginTop: space.xl },

  contactNote: {
    flexDirection: 'row', gap: space.sm,
    backgroundColor: colors.offWhite,
    borderRadius: radii.sm, padding: space.md,
  },
  contactNoteText: { flex: 1, fontSize: 12, color: colors.gray500, lineHeight: 18 },

  submit: { marginTop: space.xl },

  // ── Success ───────────────────────────────────────────────────────────────
  successScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: space.xxxl,
    backgroundColor: colors.surface,
  },
  successMascot: { marginBottom: space.lg },
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
    color: colors.brandText, fontWeight: '600',
    fontSize: 14, textDecorationLine: 'underline',
  },
});
