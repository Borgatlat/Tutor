import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import colors from '../../theme/colors';
import { radii, space, border, rule } from '../../theme/layout';
import { heading } from '../../theme/fonts';
import { Button, Divider, ErrorBanner } from '../../components/ui';

const STEPS = [
  { icon: 'mail-outline',             text: 'Open the confirmation email we sent you' },
  { icon: 'finger-print-outline',     text: 'Tap the "Confirm your email" link' },
  { icon: 'checkmark-circle-outline', text: "You'll be signed in automatically" },
];

export default function VerifyEmailScreen({ route }) {
  const { email } = route.params ?? {};
  const [resending, setResending]     = useState(false);
  const [resent, setResent]           = useState(false);
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
      <View style={styles.hero}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail-unread" size={32} color={colors.white} />
        </View>
        <View style={styles.rule} />
        <Text style={styles.heroTitle}>Confirm Your Email</Text>
        <Text style={styles.heroSub}>
          We sent a confirmation link to{'\n'}
          <Text style={styles.heroEmail}>{email}</Text>
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.stepList}>
          {STEPS.map((s) => (
            <View key={s.text} style={styles.step}>
              <View style={styles.stepIconWrap}>
                <Ionicons name={s.icon} size={20} color={colors.brand} />
              </View>
              <Text style={styles.stepText}>{s.text}</Text>
            </View>
          ))}
        </View>

        <Divider />

        {resent ? (
          <View style={styles.resentBanner}>
            <Ionicons name="checkmark-circle" size={16} color={colors.brand} />
            <Text style={styles.resentText}>New link sent! Check your inbox.</Text>
          </View>
        ) : null}

        <ErrorBanner message={resendError} />

        <Text style={styles.resendLabel}>Didn't get the email?</Text>
        <Button
          label="Resend Confirmation Email"
          icon="refresh"
          onPress={handleResend}
          loading={resending}
          fullWidth
        />

        <Text style={styles.spamNote}>
          <Ionicons name="information-circle-outline" size={13} color={colors.gray400} />
          {' '}Check your spam / junk folder too
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.brand },

  hero: {
    backgroundColor: colors.brand,
    alignItems: 'center',
    paddingTop: space.huge,
    paddingBottom: space.huge,
    paddingHorizontal: space.xxxl,
  },
  iconCircle: {
    width: 72, height: 72, borderRadius: radii.sm,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: border.control, borderColor: colors.whiteAlpha[30],
  },
  rule: {
    width: rule.width, height: rule.height,
    backgroundColor: colors.gold,
    marginTop: space.xxl, marginBottom: space.lg,
  },
  heroTitle: {
    ...heading.lg,
    color: colors.white, fontSize: 28,
    marginBottom: space.sm, textAlign: 'center',
  },
  heroSub: {
    color: colors.whiteAlpha[80],
    fontSize: 15, lineHeight: 24, textAlign: 'center',
  },
  heroEmail: { color: colors.white, fontWeight: '800' },

  card: {
    flex: 1,
    backgroundColor: colors.white,
    padding: space.xxxl,
  },

  stepList: { gap: space.lg },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stepIconWrap: {
    width: 40, height: 40, borderRadius: radii.sm,
    backgroundColor: colors.brandTint,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  stepText: {
    flex: 1, fontSize: 15, color: colors.black,
    fontWeight: '500', lineHeight: 21,
  },

  resentBanner: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.brandTint,
    borderRadius: radii.sm, padding: space.md, marginBottom: space.lg,
  },
  resentText: { fontSize: 13, color: colors.brand, fontWeight: '600' },

  resendLabel: {
    fontSize: 13, color: colors.gray500,
    textAlign: 'center', marginBottom: space.md,
  },
  spamNote: {
    fontSize: 12, color: colors.gray400,
    textAlign: 'center', marginTop: space.lg,
  },
});
