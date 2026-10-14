import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { authEmailRedirectTo, friendlyAuthEmailError } from '../../lib/authRedirect';
import colors from '../../theme/colors';
import { radii, space, border, rule } from '../../theme/layout';
import { heading, label, type } from '../../theme/fonts';
import { Button, Divider, ErrorBanner, Mascot, OrganicBackdrop } from '../../components/ui';

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
    setResent(false);
    // Guard: route.params can be missing if someone deep-links to this screen.
    if (!email) {
      setResendError('Missing email address. Go back and sign up again.');
      setResending(false);
      return;
    }
    try {
      // Same redirect as signup so the new link lands in the same app/site.
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: authEmailRedirectTo() },
      });
      if (error) {
        setResendError(friendlyAuthEmailError(error.message) ?? error.message);
        return;
      }
      // Important: Auth often returns success with an empty body even when no
      // mail was actually delivered (or the address was never registered).
      // We still show a soft success, but the copy below does not promise inbox delivery.
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
        <OrganicBackdrop />
        <Mascot size={104} onDark />
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
                <Ionicons name={s.icon} size={20} color={colors.brandText} />
              </View>
              <Text style={styles.stepText}>{s.text}</Text>
            </View>
          ))}
        </View>

        <Divider />

        {resent ? (
          <View style={styles.resentBanner}>
            <Ionicons name="checkmark-circle" size={16} color={colors.brandText} />
            <Text style={styles.resentText}>
              Resend requested. Check inbox and spam — school filters can delay mail.
            </Text>
          </View>
        ) : null}

        <ErrorBanner message={resendError} />

        <Text style={styles.resendLabel}>Didn't get the email?</Text>
        <Button
          label="Resend confirmation email"
          icon="refresh"
          onPress={handleResend}
          loading={resending}
          fullWidth
          disabled={!email}
        />

        <Text style={styles.spamNote}>
          <Ionicons name="information-circle-outline" size={13} color={colors.gray400} />
          {' '}Check spam / junk. If signup showed a send error, ask an admin to fix Auth SMTP.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.brand },

  hero: {
    overflow: 'hidden',
    backgroundColor: colors.brand,
    alignItems: 'center',
    paddingTop: space.huge,
    paddingBottom: space.huge,
    paddingHorizontal: space.xxxl,
  },
  rule: {
    width: rule.width, height: rule.height, borderRadius: rule.radius,
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
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    padding: space.xxxl,
  },

  stepList: { gap: space.lg },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stepIconWrap: {
    width: 40, height: 40, borderRadius: radii.pill,
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
  resentText: { fontSize: 13, color: colors.brandText, fontWeight: '600' },

  resendLabel: {
    fontSize: 13, color: colors.gray500,
    textAlign: 'center', marginBottom: space.md,
  },
  spamNote: {
    fontSize: 12, color: colors.gray500,
    textAlign: 'center', marginTop: space.lg,
  },
});
