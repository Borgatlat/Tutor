/**
 * InsightsPanel: the moderator's picture of tutoring at school over the last
 * 30 days, from the insights() database function (moderators only).
 *
 *   - totals: sessions, hours, tutors, students helped, how many were
 *     confirmed by both the tutor and the student (check-in)
 *   - subjects students searched for and found nobody, with a button to
 *     recruit a tutor for the top one
 *   - sessions per week, busiest blocks, most requested subjects
 *
 * Bars are plain Views (no chart library): each row's fill is its share of
 * the biggest value in that card.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import colors from '../theme/colors';
import { radii, space } from '../theme/layout';
import { type } from '../theme/fonts';
import { cardShadow } from '../theme/shadows';
import { blockLabel } from '../utils/schedule';
import InviteButton from './InviteButton';
import { EmptyState, ErrorBanner, StatRow } from './ui';

const DAYS = 30;

const weekLabel = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

function Bars({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return rows.map((r) => (
    <View key={r.key} style={styles.barRow} accessible accessibilityLabel={`${r.label}: ${r.value}`}>
      <Text style={styles.barLabel} numberOfLines={1}>{r.label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${(r.value / max) * 100}%` }]} />
      </View>
      <Text style={styles.barValue}>{r.value}</Text>
    </View>
  ));
}

function Section({ title, hint, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {children}
    </View>
  );
}

export default function InsightsPanel() {
  const [data, setData]             = useState(null);
  const [error, setError]           = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError('');
    const { data: d, error: e } = await supabase.rpc('insights', { days: DAYS });
    if (e) setError(e.message);
    else setData(d);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const totals   = data?.totals ?? {};
  const sessions = Number(totals.sessions ?? 0);
  const confirmed = Number(totals.confirmed ?? 0);
  const unmet    = data?.unmet ?? [];

  return (
    <ScrollView
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandText} />}
    >
      <ErrorBanner message={error} />
      {data ? (
        <>
          <Text style={styles.eyebrow}>Last {DAYS} days</Text>
          <StatRow
            stats={[
              { value: String(sessions),              label: 'Sessions' },
              { value: String(totals.hours ?? 0),     label: 'Hours' },
              { value: String(totals.tutors ?? 0),    label: 'Tutors' },
              { value: String(totals.students ?? 0),  label: 'Students helped' },
            ]}
          />
          <Text style={styles.confirmed}>
            {sessions
              ? `${confirmed} of ${sessions} confirmed by both tutor and student (${Math.round((confirmed / sessions) * 100)}%)`
              : 'No completed sessions yet.'}
          </Text>

          <Section
            title="Students are looking for help in…"
            hint="Subjects students searched for and found no tutor."
          >
            {unmet.length ? (
              <>
                {unmet.map((u) => (
                  <View key={u.subject} style={styles.unmetRow}>
                    <Text style={styles.unmetSubject}>{u.subject}</Text>
                    <Text style={styles.unmetMeta}>
                      {u.searches} search{u.searches === 1 ? '' : 'es'} · {u.tutors ? `${u.tutors} tutor${u.tutors === 1 ? '' : 's'}` : 'no tutors yet'}
                    </Text>
                  </View>
                ))}
                <InviteButton
                  kind="recruit"
                  subject={unmet[0].subject}
                  variant="secondary"
                  label={`Recruit tutors for ${unmet[0].subject}`}
                />
              </>
            ) : (
              <Text style={styles.hint}>No unanswered searches yet. Every subject students looked for had a tutor.</Text>
            )}
          </Section>

          <Section title="Sessions per week">
            <Bars rows={(data.weekly ?? []).map((w) => ({ key: w.week, label: weekLabel(w.week), value: Number(w.sessions) }))} />
          </Section>

          <Section title="Busiest blocks" hint="Booked sessions by block, so you know when tutors are needed.">
            {(data.blocks ?? []).length
              ? <Bars rows={data.blocks.map((b) => ({ key: String(b.period), label: blockLabel(b.period), value: Number(b.sessions) }))} />
              : <Text style={styles.hint}>No bookings yet.</Text>}
          </Section>

          <Section title="Most requested subjects">
            {(data.subjects ?? []).length
              ? <Bars rows={data.subjects.map((s) => ({ key: s.subject, label: s.subject, value: Number(s.sessions) }))} />
              : <Text style={styles.hint}>No bookings yet.</Text>}
          </Section>
        </>
      ) : !error ? (
        <EmptyState icon="stats-chart-outline" title="Loading insights" compact />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list:      { padding: space.lg, gap: space.md, paddingBottom: space.xxxl },
  eyebrow:   { ...type.eyebrow, color: colors.gray500 },
  confirmed: { ...type.small, fontWeight: '600', color: colors.brandText, textAlign: 'center' },

  card: {
    backgroundColor: colors.surface, borderRadius: radii.lg,
    padding: space.lg, gap: space.sm, ...cardShadow,
  },
  cardTitle: { ...type.heading, color: colors.black },
  hint:      { ...type.small, color: colors.gray500 },

  unmetRow:     { paddingVertical: space.xs },
  unmetSubject: { ...type.body, fontWeight: '700', color: colors.black },
  unmetMeta:    { ...type.small, color: colors.gray500 },

  barRow:   { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  barLabel: { ...type.small, color: colors.gray600, width: 96 },
  barTrack: { flex: 1, height: 10, borderRadius: radii.pill, backgroundColor: colors.cream, overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: radii.pill, backgroundColor: colors.brand },
  barValue: { ...type.small, fontWeight: '700', color: colors.black, width: 28, textAlign: 'right' },
});
