/**
 * ForgotPasswordScreen - request a reset link.
 *
 * Deliberately says the same thing whether or not an account exists. Telling
 * someone "no account with that email" would let anyone check which students
 * are signed up, so the confirmation is identical either way.
 *
 * Note: this sends through the project's SMTP settings. If those are broken the
 * request still reports success here (by design, see above) but no mail
 * arrives - check Supabase's Auth logs, not this screen.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { supabase, emailRedirectTo } from '../../lib/supabase';
import { toUserMessage } from '../../utils/errors';
import colors from '../../theme/colors';
import { space, radii } from '../../theme/layout';
import { heading } from '../../theme/fonts';
import { SCHOOL_EMAIL_DOMAIN } from '../../constants';
import {
  AuthShell, Button, ErrorBanner, Field, IconButton,
} from '../../components/ui';

const schema = z.object({
  email: z
    .string()
    .email('Enter a valid email')
    .refine(
      (val) => val.toLowerCase().endsWith(SCHOOL_EMAIL_DOMAIN),
      `Must be a ${SCHOOL_EMAIL_DOMAIN} address`,
    ),
});

export default function ForgotPasswordScreen({ navigation }) {
  const [loading, setLoading]         = useState(false);
  const [sent, setSent]               = useState(false);
  const [sentTo, setSentTo]           = useState('');
  const [submitError, setSubmitError] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }) => {
    setLoading(true);
    setSubmitError('');
    try {
      const cleanEmail = email.toLowerCase().trim();
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: emailRedirectTo(),
      });

      // Only surface errors that are about us, not about the address. A missing
      // account must look identical to a real one.
      if (error) {
        setSubmitError(toUserMessage(error, "We couldn't send the reset link. Please try again."));
        return;
      }

      setSentTo(cleanEmail);
      setSent(true);
    } catch (e) {
      setSubmitError(toUserMessage(e, "We couldn't send the reset link. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  // ── Sent ────────────────────────────────────────────────────────────────────
  if (sent) {
    return (
      <AuthShell
        title={'Check your\ninbox'}
        subtitle="If an account exists for that address, a reset link is on its way."
        headerRight={
          <IconButton
            icon="chevron-back"
            label="Back to sign in"
            onPress={() => navigation.navigate('Login')}
            size={22}
            color={colors.white}
          />
        }
      >
        <View style={styles.sentIcon}>
          <Ionicons name="mail-unread" size={28} color={colors.accent} />
        </View>

        <Text style={styles.sentTitle}>Reset link sent</Text>
        <Text style={styles.sentBody}>
          We sent it to <Text style={styles.sentEmail}>{sentTo}</Text>. The link expires after a
          while, so use it soon. Check your spam folder if it isn't there in a few minutes.
        </Text>

        <Button
          label="Back to Sign In"
          onPress={() => navigation.navigate('Login')}
          fullWidth
          style={styles.block}
        />

        <Button
          label="Send it again"
          variant="secondary"
          onPress={() => setSent(false)}
          fullWidth
          style={styles.blockTight}
        />
      </AuthShell>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <AuthShell
      title={'Forgot your\npassword?'}
      subtitle="Enter your school email and we'll send you a link to set a new one."
      headerRight={
        <IconButton
          icon="chevron-back"
          label="Back to sign in"
          onPress={() => navigation.goBack()}
          size={22}
          color={colors.white}
        />
      }
    >
      <Text style={styles.cardTitle}>Reset Password</Text>

      <ErrorBanner message={submitError} />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value, onBlur } }) => (
          <Field
            label="School Email"
            icon="mail-outline"
            error={errors.email?.message}
            placeholder={`name${SCHOOL_EMAIL_DOMAIN}`}
            keyboardType="email-address"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
          />
        )}
      />

      <Button
        label="Send Reset Link"
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        fullWidth
        style={styles.block}
      />

      <Button
        label="Back to Sign In"
        variant="secondary"
        onPress={() => navigation.goBack()}
        fullWidth
        style={styles.blockTight}
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    ...heading.lg,
    fontSize: 22,
    color: colors.black,
    marginBottom: space.xxl,
  },
  block:      { marginTop: space.lg },
  blockTight: { marginTop: space.sm },

  sentIcon: {
    width: 56, height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.accentTint,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: space.lg,
  },
  sentTitle: {
    ...heading.lg,
    fontSize: 20,
    color: colors.black,
  },
  sentBody: {
    fontSize: 13,
    color: colors.gray500,
    lineHeight: 20,
    marginTop: space.sm,
  },
  sentEmail: { color: colors.gray700, fontWeight: '700' },
});
