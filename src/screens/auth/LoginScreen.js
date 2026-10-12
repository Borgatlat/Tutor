import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import colors from '../../theme/colors';
import { space, hit, press } from '../../theme/layout';
import { heading, label, type } from '../../theme/fonts';
import { school } from '../../theme/school';
import { SCHOOL_EMAIL_DOMAIN } from '../../constants';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../../constants/legal';
import {
  AuthShell, Button, Divider, ErrorBanner, Field, IconButton,
} from '../../components/ui';

const FEATURES = [
  { icon: 'search-outline',   text: 'Find tutors by subject & free period' },
  { icon: 'calendar-outline', text: 'Book sessions that fit your schedule' },
  { icon: 'ribbon-outline',   text: `Core classes, SAT & AP prep from fellow ${school.memberPlural}` },
  { icon: 'star-outline',     text: 'Ratings & reviews for every tutor' },
];

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
  const [resetNote, setResetNote]     = useState('');

  const { control, handleSubmit, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email, password }) => {
    setLoading(true);
    setSubmitError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });
      if (error) setSubmitError(error.message);
    } catch (e) {
      if (__DEV__) console.error('[Login]', e);
      setSubmitError(
        e?.message?.includes('fetch')
          ? 'Cannot reach the server. Check your internet connection.'
          : (e?.message ?? 'Something went wrong.'),
      );
    } finally {
      setLoading(false);
    }
  };

  // Sends a reset link to the school email typed above.
  const handleForgot = async () => {
    const email = (getValues('email') ?? '').toLowerCase().trim();
    setSubmitError('');
    setResetNote('');
    if (!email.endsWith(SCHOOL_EMAIL_DOMAIN)) {
      setSubmitError(`Type your ${SCHOOL_EMAIL_DOMAIN} email above, then tap "Forgot password?" again.`);
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setSubmitError(error.message);
    else setResetNote(`We sent a reset link to ${email}.`);
  };

  return (
    <AuthShell
      title={`Welcome back,\n${school.memberName}`}
      subtitle={`Peer tutoring for ${school.name} students, by ${school.name} students`}
      features={FEATURES}
    >
      <Text style={styles.cardTitle}>Sign in</Text>

      <ErrorBanner message={submitError} />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value, onBlur } }) => (
          <Field
            label="School email"
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

      <TouchableOpacity
        style={styles.forgot}
        onPress={handleForgot}
        hitSlop={hit.slop}
        activeOpacity={press.opacity}
        accessibilityRole="button"
        accessibilityLabel="Forgot password? Send a reset link to my school email"
      >
        <Text style={styles.forgotText}>Forgot password?</Text>
      </TouchableOpacity>

      {resetNote ? (
        <Text style={styles.resetNote} accessibilityLiveRegion="polite">{resetNote}</Text>
      ) : null}

      <Button
        label="Sign in"
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        fullWidth
        style={styles.submit}
      />

      <Divider label="New here?" />

      <Button
        label="Create an account"
        variant="secondary"
        onPress={() => navigation.navigate('SignUp')}
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
  forgot:     { alignSelf: 'flex-end', marginTop: -space.sm, marginBottom: space.md },
  forgotText: { ...type.small, fontWeight: '600', color: colors.brandText },
  resetNote:  { ...type.small, color: colors.brandText, marginBottom: space.md },
  submit: { marginTop: space.sm },

  legalRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: space.sm, marginTop: space.xl,
  },
  legalLink: {
    fontSize: 11, color: colors.brandText,
    fontWeight: '600', textDecorationLine: 'underline',
  },
  legalSep: { fontSize: 11, color: colors.gray300 },

  footer: {
    textAlign: 'center', fontSize: 11,
    color: colors.gray500, marginTop: space.sm,
  },
});
