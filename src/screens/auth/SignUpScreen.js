import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase, emailRedirectTo } from '../../lib/supabase';
import { toUserMessage } from '../../utils/errors';
import useToastStore from '../../store/useToastStore';
import colors from '../../theme/colors';
import { space, hit, press } from '../../theme/layout';
import { heading } from '../../theme/fonts';
import { SCHOOL_EMAIL_DOMAIN } from '../../constants';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../../constants/legal';
import {
  AuthShell, Button, ErrorBanner, Field, IconButton, RoleSelector,
} from '../../components/ui';

const schema = z.object({
  full_name: z.string().min(2, 'Enter your full name'),
  email: z
    .string()
    .email('Enter a valid email')
    .refine(
      (val) => val.toLowerCase().endsWith(SCHOOL_EMAIL_DOMAIN),
      `Must be a ${SCHOOL_EMAIL_DOMAIN} address`,
    ),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function SignUpScreen({ navigation }) {
  const [role, setRole]               = useState('student');
  const [loading, setLoading]         = useState(false);
  const [showPw, setShowPw]           = useState(false);
  const [submitError, setSubmitError] = useState('');
  const showToast                     = useToastStore((s) => s.show);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', email: '', password: '' },
  });

  const onSubmit = async ({ full_name, email, password }) => {
    setLoading(true);
    setSubmitError('');
    try {
      const cleanEmail = email.toLowerCase().trim();
      const firstName  = full_name.trim().split(/\s+/)[0];

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { full_name, role }, emailRedirectTo: emailRedirectTo() },
      });
      if (error) {
        setSubmitError(toUserMessage(error, "We couldn't create your account. Please try again."));
        return;
      }

      // Email confirmation OFF in Supabase → signUp already returns a session.
      // onAuthStateChange picks it up and App.js routes to ProfileSetup.
      if (data?.session) {
        showToast(`Account created. Welcome, ${firstName}!`);
        return;
      }

      // No session came back. Sign in directly rather than parking the user on
      // a "check your email" screen, so verification never gates a new account.
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email: cleanEmail, password });

      if (signInData?.session) {
        showToast(`Account created. Welcome, ${firstName}!`);
        return;
      }

      // Supabase is still enforcing confirmation (Auth → Providers → Email →
      // "Confirm email"). Nothing the client can do; send them to VerifyEmail.
      if (/confirm/i.test(signInError?.message ?? '')) {
        navigation.navigate('VerifyEmail', { email: cleanEmail });
        return;
      }

      setSubmitError(
        toUserMessage(signInError, 'Account created, but sign-in failed. Try signing in.'),
      );
    } catch (e) {
      if (__DEV__) console.error('[SignUp]', e);
      setSubmitError(toUserMessage(e, "We couldn't create your account. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={'Join the\nCommunity'}
      subtitle="Connect with fellow Crusaders as a tutor, a student, or both."
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
      <Text style={styles.cardTitle}>Create Account</Text>

      <ErrorBanner message={submitError} />

      <Controller
        control={control}
        name="full_name"
        render={({ field: { onChange, value, onBlur } }) => (
          <Field
            label="Full Name"
            icon="person-outline"
            error={errors.full_name?.message}
            placeholder="John Smith"
            autoComplete="name"
            textContentType="name"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
          />
        )}
      />

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
            hint="At least 8 characters"
            placeholder="8+ characters"
            secureTextEntry={!showPw}
            autoComplete="new-password"
            textContentType="newPassword"
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

      <Text style={styles.label}>I am a…</Text>
      <RoleSelector value={role} onChange={setRole} style={styles.roles} />

      <Button
        label="Create Account"
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        fullWidth
      />

      <Text style={styles.legalNotice}>
        By creating an account you agree to our{' '}
        <Text style={styles.legalLink} onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}>
          Terms of Service
        </Text>
        {' '}and{' '}
        <Text style={styles.legalLink} onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
          Privacy Policy
        </Text>
        .
      </Text>

      <TouchableOpacity
        style={styles.loginLink}
        onPress={() => navigation.goBack()}
        hitSlop={hit.slop}
        activeOpacity={press.opacity}
        accessibilityRole="link"
        accessibilityLabel="Already have an account? Sign in"
      >
        <Text style={styles.loginLinkText}>
          Already have an account?{' '}
          <Text style={styles.loginLinkStrong}>Sign In</Text>
        </Text>
      </TouchableOpacity>
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

  label: {
    fontSize: 13, fontWeight: '600',
    color: colors.gray600, marginBottom: space.sm,
  },
  roles: { marginBottom: space.xxl },

  legalNotice: {
    fontSize: 11, color: colors.gray500,
    textAlign: 'center', lineHeight: 17, marginTop: space.lg,
  },
  legalLink: { color: colors.accent, fontWeight: '600', textDecorationLine: 'underline' },

  loginLink:       { alignItems: 'center', marginTop: space.xl },
  loginLinkText:   { fontSize: 13, color: colors.gray500 },
  loginLinkStrong: { color: colors.accent, fontWeight: '700' },
});
