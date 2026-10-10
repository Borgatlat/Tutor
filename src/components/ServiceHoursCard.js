/**
 * ServiceHoursCard: a tutor's volunteer-hours log on their Profile.
 *
 * Counts every completed session they taught (one 50-minute block each) and
 * offers the full log as a CSV a moderator can check and sign.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import colors from '../theme/colors';
import { space, radii } from '../theme/layout';
import { type } from '../theme/fonts';
import { cardShadow } from '../theme/shadows';
import { summarizeHours, buildHoursCsv } from '../utils/hours';
import { saveTextFile } from '../utils/download';
import { Button, ErrorBanner, StatRow } from './ui';

export default function ServiceHoursCard({ tutorId, tutorName }) {
  const [sessions, setSessions] = useState([]);
  const [error, setError]       = useState('');
  const [saved, setSaved]       = useState(false);

  const load = useCallback(async () => {
    if (!tutorId) return;
    const { data, error: e } = await supabase
      .from('sessions')
      .select('*, student:profiles!sessions_student_id_fkey(full_name)')
      .eq('tutor_id', tutorId)
      .eq('status', 'completed');
    if (e) setError(`Could not load your hours: ${e.message}`);
    else setSessions(data ?? []);
  }, [tutorId]);

  useEffect(() => { load(); }, [load]);

  const summary = summarizeHours(sessions, tutorId);

  const download = async () => {
    setError('');
    const csv  = buildHoursCsv(sessions, tutorId, tutorName);
    const slug = (tutorName || 'tutor').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const res  = await saveTextFile(`service-hours-${slug}.csv`, csv, 'text/csv');
    if (res.success) setSaved(true);
    else setError(res.error);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Service hours</Text>
      <Text style={styles.hint}>
        Every session you mark as done counts as one 50-minute block.
      </Text>

      <StatRow
        style={styles.stats}
        stats={[
          { value: String(summary.hours),    label: 'Hours' },
          { value: String(summary.sessions), label: 'Sessions' },
          { value: String(summary.students), label: 'Students helped' },
        ]}
      />

      <ErrorBanner message={error} />

      <Button
        label={saved ? 'Log downloaded' : 'Download hours log'}
        icon={saved ? 'checkmark-circle' : 'download-outline'}
        variant="secondary"
        disabled={summary.sessions === 0}
        onPress={download}
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: space.xl,
    ...cardShadow,
  },
  title: { ...type.heading, color: colors.black, marginBottom: space.xs },
  hint:  { ...type.small, color: colors.gray500, marginBottom: space.lg },
  stats: { marginBottom: space.lg },
});
