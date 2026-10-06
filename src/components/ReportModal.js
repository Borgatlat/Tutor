/**
 * ReportModal — Apple App Store guideline 5.1.1 / 1.2
 * Required for any app with user-generated content.
 * Lets signed-in users report inappropriate users and block them.
 */
import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import useAuthStore from '../store/useAuthStore';
import colors from '../theme/colors';
import { radii, space } from '../theme/layout';
import { sheetShadow } from '../theme/shadows';
import { heading } from '../theme/fonts';
import Button from './ui/Button';
import Chip from './ui/Chip';
import Field from './ui/Field';
import Divider from './ui/Divider';
import ErrorBanner from './ui/ErrorBanner';
import IconButton from './ui/IconButton';

const REPORT_REASONS = [
  'Inappropriate content',
  'Spam or advertising',
  'Harassment or bullying',
  'Fake profile',
  'Other',
];

export default function ReportModal({ visible, onClose, reportedUser }) {
  const { profile } = useAuthStore();

  const [reason, setReason]         = useState('');
  const [details, setDetails]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [blocking, setBlocking]     = useState(false);
  const [done, setDone]             = useState(null); // 'reported' | 'blocked'
  const [error, setError]           = useState('');

  const reset = () => {
    setReason(''); setDetails(''); setDone(null); setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleReport = async () => {
    if (!reason) { setError('Please select a reason.'); return; }
    setSubmitting(true);
    setError('');
    const { error: err } = await supabase.from('reports').insert({
      reporter_id:      profile.id,
      reported_user_id: reportedUser.id,
      reason,
      details: details || null,
    });
    setSubmitting(false);
    if (err) { setError(err.message); return; }
    setDone('reported');
  };

  const handleBlock = async () => {
    setBlocking(true);
    setError('');
    const { error: err } = await supabase.from('blocked_users').upsert({
      blocker_id: profile.id,
      blocked_id: reportedUser.id,
    }, { onConflict: 'blocker_id,blocked_id' });
    setBlocking(false);
    if (err) { setError(err.message); return; }
    setDone('blocked');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {done ? (
            /* ── Success state ── */
            <View style={styles.doneWrap}>
              <View style={styles.doneCircle}>
                <Ionicons name="checkmark" size={30} color={colors.white} />
              </View>
              <Text style={styles.doneTitle}>
                {done === 'blocked' ? 'User Blocked' : 'Report Submitted'}
              </Text>
              <Text style={styles.doneSub}>
                {done === 'blocked'
                  ? `${reportedUser?.full_name ?? 'This user'} will no longer appear in your search results.`
                  : 'Thank you. Our team will review this report within 24 hours.'}
              </Text>
              <Button label="Done" onPress={handleClose} style={styles.doneBtn} />
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.header}>
                <Text style={styles.title}>Report or Block</Text>
                <IconButton icon="close" label="Close" onPress={handleClose} size={22} />
              </View>

              <Text style={styles.subtitle}>
                Reporting <Text style={styles.userName}>{reportedUser?.full_name}</Text>
              </Text>

              <ErrorBanner message={error} />

              <Text style={styles.label}>Reason</Text>
              <View style={styles.reasonGrid}>
                {REPORT_REASONS.map((r) => (
                  <Chip
                    key={r}
                    label={r}
                    selected={reason === r}
                    onPress={() => setReason(r)}
                  />
                ))}
              </View>

              <Field
                label="Additional details (optional)"
                placeholder="Describe what happened…"
                multiline
                numberOfLines={3}
                value={details}
                onChangeText={setDetails}
                style={styles.detailsField}
              />

              <Button
                label="Submit Report"
                icon="flag"
                onPress={handleReport}
                disabled={!reason}
                loading={submitting}
                fullWidth
              />

              <Divider label="or" />

              <Button
                label={`Block ${reportedUser?.full_name?.split(' ')[0] ?? 'user'}`}
                icon="ban-outline"
                variant="danger"
                onPress={handleBlock}
                loading={blocking}
                fullWidth
              />
              <Text style={styles.blockNote}>
                Blocking prevents this user from seeing your profile and hides them
                from your search results.
              </Text>

              <View style={styles.bottomSpacer} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    borderTopWidth: 4,
    borderTopColor: colors.brand,
    paddingHorizontal: space.xxl,
    paddingTop: space.md,
    maxHeight: '85%',
    ...sheetShadow,
  },
  handle: {
    width: 40, height: 4, borderRadius: radii.pill,
    backgroundColor: colors.line,
    alignSelf: 'center', marginBottom: space.xl,
  },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: space.xs,
  },
  title:    { ...heading.lg, fontSize: 20, color: colors.black },
  subtitle: { fontSize: 14, color: colors.gray500, marginBottom: space.xl },
  userName: { fontWeight: '700', color: colors.black },

  label: {
    fontSize: 11, fontWeight: '600', letterSpacing: 1.6, textTransform: 'uppercase',
    color: colors.gray600, marginBottom: space.sm,
  },

  reasonGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  detailsField: { marginTop: space.lg },

  blockNote: {
    fontSize: 11, color: colors.gray400,
    textAlign: 'center', marginTop: space.md, lineHeight: 16,
  },
  bottomSpacer: { height: space.xxxl },

  // ── Done state ──────────────────────────────────────────────────────────────
  doneWrap: {
    alignItems: 'center',
    paddingVertical: space.huge,
    paddingHorizontal: space.lg,
  },
  doneCircle: {
    width: 72, height: 72, borderRadius: radii.pill,
    backgroundColor: colors.brand,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: space.xl,
  },
  doneTitle: { ...heading.lg, fontSize: 22, color: colors.black, marginBottom: space.sm },
  doneSub: {
    fontSize: 14, color: colors.gray500,
    textAlign: 'center', lineHeight: 22, marginBottom: space.xxl,
  },
  doneBtn: { paddingHorizontal: space.huge },
});
