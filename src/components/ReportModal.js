/**
 * ReportModal — Apple App Store guideline 5.1.1 / 1.2
 * Required for any app with user-generated content.
 * Lets signed-in users report inappropriate users and block them.
 */
import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import useAuthStore from '../store/useAuthStore';
import colors from '../theme/colors';

const REPORT_REASONS = [
  'Inappropriate content',
  'Spam or advertising',
  'Harassment or bullying',
  'Fake profile',
  'Other',
];

export default function ReportModal({ visible, onClose, reportedUser }) {
  const { profile } = useAuthStore();

  const [reason, setReason]       = useState('');
  const [details, setDetails]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [blocking, setBlocking]   = useState(false);
  const [done, setDone]           = useState(null); // 'reported' | 'blocked'
  const [error, setError]         = useState('');

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

          {/* Handle bar */}
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
              <TouchableOpacity style={styles.doneBtn} onPress={handleClose}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Report or Block</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={colors.gray500} />
                </TouchableOpacity>
              </View>

              <Text style={styles.subtitle}>
                Reporting <Text style={styles.userName}>{reportedUser?.full_name}</Text>
              </Text>

              {/* Reason chips */}
              <Text style={styles.label}>Reason</Text>
              <View style={styles.reasonGrid}>
                {REPORT_REASONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.reasonChip, reason === r && styles.reasonChipActive]}
                    onPress={() => setReason(r)}
                  >
                    <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Details */}
              <Text style={[styles.label, { marginTop: 16 }]}>Additional details (optional)</Text>
              <TextInput
                style={styles.detailsInput}
                placeholder="Describe what happened…"
                placeholderTextColor={colors.gray300}
                multiline
                numberOfLines={3}
                value={details}
                onChangeText={setDetails}
              />

              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}

              {/* Submit report */}
              <TouchableOpacity
                style={[styles.reportBtn, (!reason || submitting) && { opacity: 0.5 }]}
                onPress={handleReport}
                disabled={!reason || submitting}
              >
                {submitting
                  ? <ActivityIndicator color={colors.white} />
                  : (
                    <View style={styles.btnInner}>
                      <Ionicons name="flag" size={16} color={colors.white} />
                      <Text style={styles.reportBtnText}>Submit Report</Text>
                    </View>
                  )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Block */}
              <TouchableOpacity
                style={[styles.blockBtn, blocking && { opacity: 0.5 }]}
                onPress={handleBlock}
                disabled={blocking}
              >
                {blocking
                  ? <ActivityIndicator color={colors.error} />
                  : (
                    <View style={styles.btnInner}>
                      <Ionicons name="ban-outline" size={16} color={colors.error} />
                      <Text style={styles.blockBtnText}>
                        Block {reportedUser?.full_name?.split(' ')[0]}
                      </Text>
                    </View>
                  )}
              </TouchableOpacity>
              <Text style={styles.blockNote}>
                Blocking prevents this user from seeing your profile and hides them from your search results.
              </Text>

              <View style={{ height: 32 }} />
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: '85%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.gray200,
    alignSelf: 'center', marginBottom: 20,
  },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  title:    { fontSize: 20, fontWeight: '800', color: colors.black },
  closeBtn: { padding: 4 },
  subtitle: { fontSize: 14, color: colors.gray500, marginBottom: 20 },
  userName: { fontWeight: '700', color: colors.black },

  label: { fontSize: 11, fontWeight: '700', color: colors.gray500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },

  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reasonChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.gray200,
    backgroundColor: colors.offWhite,
  },
  reasonChipActive: { backgroundColor: colors.red, borderColor: colors.red },
  reasonText:       { fontSize: 13, color: colors.gray700, fontWeight: '600' },
  reasonTextActive: { color: colors.white },

  detailsInput: {
    borderWidth: 1.5, borderColor: colors.gray200, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: colors.black, backgroundColor: colors.offWhite,
    height: 80, textAlignVertical: 'top',
  },
  errorText: { fontSize: 12, color: colors.error, marginTop: 8 },

  reportBtn: {
    backgroundColor: colors.red, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 20,
  },
  reportBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },

  divider: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.gray100 },
  dividerText: { fontSize: 13, color: colors.gray400 },

  blockBtn: {
    borderWidth: 2, borderColor: colors.error, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  blockBtnText: { color: colors.error, fontWeight: '700', fontSize: 15 },
  blockNote: { fontSize: 11, color: colors.gray400, textAlign: 'center', marginTop: 10, lineHeight: 16 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  // Done state
  doneWrap:   { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 16 },
  doneCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.red,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  doneTitle: { fontSize: 22, fontWeight: '800', color: colors.black, marginBottom: 10 },
  doneSub:   { fontSize: 14, color: colors.gray500, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  doneBtn:   { backgroundColor: colors.red, borderRadius: 14, paddingHorizontal: 40, paddingVertical: 14 },
  doneBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
});
