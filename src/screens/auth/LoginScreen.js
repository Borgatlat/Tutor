import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { toUserMessage } from '../../utils/errors';
import useToastStore from '../../store/useToastStore';
import colors from '../../theme/colors';
import { space, hit, press } from '../../theme/layout';
import { heading } from '../../theme/fonts';
import { SCHOOL_EMAIL_DOMAIN } from '../../constants';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../../constants/legal';
import {
  AuthShell, Button, Divider, ErrorBanner, Field, IconButton,
} from '../../components/ui';

const schema = z.object({
  email: z
    .string()
    .email('Enter a valid email')
    .refine(
      (val) => val.toLowerCase().endsWith(SCHOOL_EMAIL_DOMAIN),
      `Must be a ${SCHOOL_EMAIL_DOMAIN} address`,
    ),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginScreen({ navigation }) {
  const [loading, setLoading]         = useState(false);
  const [showPw, setShowPw]           = useState(false);
  const [submitError, setSubmitError] = useState('');
  const showToast                     = useToastStore((s) => s.show);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email, password }) => {
    setLoading(true);
    setSubmitError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        // Supabase still has "Confirm email" on - say what to do about it
        // instead of surfacing the raw "Email not confirmed".
        setSubmitError(toUserMessage(error, "We couldn't sign you in. Please try again."));
        return;
      }

      // Confirm the sign-in before App.js swaps this screen out from under us.
      const first = data?.session?.user?.user_metadata?.full_name
        ?.trim()
        .split(/\s+/)[0];
      showToast(first ? `Signed in. Welcome back, ${first}!` : 'Signed in. Welcome back!');
    } catch (e) {
      if (__DEV__) console.error('[Login]', e);
      setSubmitError(toUserMessage(e, "We couldn't sign you in. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={'Welcome back,\nCrusader'}
      subtitle="Peer tutoring for Strake Jesuit students, by Strake Jesuit students"
    >
      <Text style={styles.cardTitle}>Sign In</Text>

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

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value, onBlur } }) => (
          <Field
            label="Password"
            icon="lock-closed-outline"
            error={errors.password?.message}
            placeholder="••••••••"
            secureTextEntry={!showPw}
            autoComplete="current-password"
            textContentType="password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            trailing={
              <IconButton
                icon={showPw ? 'eye-off-outline' : 'eye-outline'}
                label={showPw ? 'Hide password' : 'Show password'}
                onPress={() => setShowPw(!showPw)}
                size={18}
              />
            }
          />
        )}
      />

      <Button
        label="Sign In"
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        fullWidth
        style={styles.submit}
      />

      <TouchableOpacity
        style={styles.forgotRow}
        onPress={() => navigation.navigate('ForgotPassword')}
        hitSlop={hit.slop}
        activeOpacity={press.opacity}
        accessibilityRole="link"
        accessibilityLabel="Forgot your password?"
      >
        <Text style={styles.forgotLink}>Forgot your password?</Text>
      </TouchableOpacity>

      <Divider label="New here?" />

      <Button
        label="Create an Account"
        variant="secondary"
        onPress={() => navigation.navigate('Onboarding')}
        fullWidth
      />

      <View style={styles.legalRow}>
        <TouchableOpacity
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
          hitSlop={hit.slop}
          activeOpacity={press.opacity}
          accessibilityRole="link"
        >
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </TouchableOpacity>
        <Text style={styles.legalSep}>·</Text>
        <TouchableOpacity
          onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}
          hitSlop={hit.slop}
          activeOpacity={press.opacity}
          accessibilityRole="link"
        >
          <Text style={styles.legalLink}>Terms of Service</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>Only {SCHOOL_EMAIL_DOMAIN} addresses are accepted</Text>
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
  submit: { marginTop: space.sm },

  forgotRow:  { alignItems: 'center', marginTop: space.lg },
  forgotLink: {
    fontSize: 13, color: colors.accent,
    fontWeight: '600', textDecorationLine: 'underline',
  },

  legalRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: space.sm, marginTop: space.xl,
  },
  legalLink: {
    fontSize: 11, color: colors.accent,
    fontWeight: '600', textDecorationLine: 'underline',
  },
  legalSep: { fontSize: 11, color: colors.gray300 },

  footer: {
    textAlign: 'center', fontSize: 11,
    color: colors.gray400, marginTop: space.sm,
  },
});
