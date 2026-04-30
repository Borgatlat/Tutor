import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import colors from '../../theme/colors';
import { heading } from '../../theme/fonts';

export default function VerifyEmailScreen({ route }) {
  const { email } = route.params ?? {};
  const [resending, setResending] = useState(false);
  const [resent, setResent]       = useState(false);
  const [resendError, setResendError] = useState('');

  const handleResend = async () => {
    setResending(true);
    setResendError('');
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) { setResendError(error.message); return; }
      setResent(true);
    } catch (e) {
      setResendError(e?.message ?? 'Could not resend. Try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail-unread" size={36} color={colors.white} />
        </View>
        <Text style={styles.heroTitle}>Confirm Your Email</Text>
        <Text style={styles.heroSub}>
          We sent a confirmation link to{'\n'}
          <Text style={styles.heroEmail}>{email}</Text>
        </Text>
      </View>

      {/* Card */}
      <View style={styles.card}>

        {/* Steps */}
        <View style={styles.stepList}>
          {[
            { icon: 'mail-outline',             text: 'Open the confirmation email we sent you' },
            { icon: 'finger-print-outline',     text: 'Tap the "Confirm your email" link' },
            { icon: 'checkmark-circle-outline', text: "You'll be signed in automatically" },
          ].map((s, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepIconWrap}>
                <Ionicons name={s.icon} size={20} color={colors.red} />
              </View>
              <Text style={styles.stepText}>{s.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Resent confirmation */}
        {resent && (
          <View style={styles.resentBanner}>
            <Ionicons name="checkmark-circle" size={16} color="#1B4D2E" />
            <Text style={styles.resentText}>New link sent! Check your inbox.</Text>
          </View>
        )}

        {resendError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.white} />
            <Text style={styles.errorText}>{resendError}</Text>
          </View>
        ) : null}

        <Text style={styles.resendLabel}>Didn't get the email?</Text>
        <TouchableOpacity
          style={[styles.resendBtn, resending && { opacity: 0.6 }]}
          onPress={handleResend}
          disabled={resending}
        >
          {resending
            ? <ActivityIndicator color={colors.white} size="small" />
            : (
              <View style={styles.resendBtnInner}>
                <Ionicons name="refresh" size={16} color={colors.white} />
                <Text style={styles.resendBtnText}>Resend Confirmation Email</Text>
              </View>
            )}
        </TouchableOpacity>

        <Text style={styles.spamNote}>
          <Ionicons name="information-circle-outline" size={13} color={colors.gray400} />
          {' '}Check your spam / junk folder too
        </Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.red },

  hero: {
    backgroundColor: colors.red,
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 40,
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  heroTitle: {
    color: colors.white, fontSize: 28,
    fontFamily: heading.lg.fontFamily, fontWeight: '800',
    marginBottom: 10, textAlign: 'center',
  },
  heroSub: {
    color: colors.white, opacity: 0.85,
    fontSize: 15, lineHeight: 24, textAlign: 'center',
  },
  heroEmail: { fontWeight: '800', opacity: 1 },

  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 32,
    paddingTop: 36,
  },

  stepList: { gap: 18, marginBottom: 28 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.redMuted,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  stepText: { flex: 1, fontSize: 15, color: colors.black, fontWeight: '500', lineHeight: 21 },

  divider: { height: 1, backgroundColor: colors.gray100, marginBottom: 24 },

  resentBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.redMuted,
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  resentText: { fontSize: 13, color: colors.red, fontWeight: '600' },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.error, borderRadius: 10,
    padding: 12, marginBottom: 16,
  },
  errorText: { flex: 1, color: colors.white, fontSize: 13, fontWeight: '600' },

  resendLabel: {
    fontSize: 13, color: colors.gray500,
    textAlign: 'center', marginBottom: 12,
  },
  resendBtn: {
    backgroundColor: colors.red, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  resendBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resendBtnText:  { color: colors.white, fontWeight: '700', fontSize: 15 },

  spamNote: {
    fontSize: 12, color: colors.gray400,
    textAlign: 'center', marginTop: 16,
  },
});
