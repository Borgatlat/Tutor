import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Linking,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import colors from '../../theme/colors';
import { heading } from '../../theme/fonts';
import { SCHOOL_EMAIL_DOMAIN } from '../../constants';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../../constants/legal';

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

  const { control, handleSubmit, formState: { errors } } = useForm({
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
      if (error) {
        setSubmitError(error.message);
      }
      // On success, onAuthStateChange fires and App.js switches to AppNavigator automatically
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

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroBadge}>
              <Ionicons name="school" size={32} color={colors.white} />
            </View>
            <Text style={styles.heroSchool}>STRAKE JESUIT</Text>
            <Text style={styles.heroTitle}>Welcome back,{'\n'}Crusader</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>

            {submitError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={colors.white} />
                <Text style={styles.errorBannerText}>{submitError}</Text>
              </View>
            ) : null}

            {/* Email */}
            <Text style={styles.label}>School Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value, onBlur } }) => (
                <View style={[styles.inputWrap, errors.email && styles.inputError]}>
                  <Ionicons name="mail-outline" size={18} color={colors.gray400} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={`name${SCHOOL_EMAIL_DOMAIN}`}
                    placeholderTextColor={colors.gray300}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                </View>
              )}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

            {/* Password */}
            <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value, onBlur } }) => (
                <View style={[styles.inputWrap, errors.password && styles.inputError]}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.gray400} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={colors.gray300}
                    secureTextEntry={!showPw}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                  <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                    <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.gray400} />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={colors.white} />
                : <Text style={styles.btnText}>Sign In</Text>}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>New here?</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate('SignUp')}
            >
              <Text style={styles.secondaryBtnText}>Create an Account</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            Only {SCHOOL_EMAIL_DOMAIN} addresses are accepted
          </Text>

          <View style={styles.legalRow}>
            <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.legalSep}>·</Text>
            <TouchableOpacity onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}>
              <Text style={styles.legalLink}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: colors.red },
  scroll: { flexGrow: 1 },

  hero: {
    backgroundColor: colors.red,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
    alignItems: 'flex-start',
  },
  heroBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroSchool: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    opacity: 0.8,
    marginBottom: 6,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 32,
    fontFamily: heading.xl.fontFamily,
    fontWeight: '800',
    lineHeight: 38,
  },

  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 40,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: heading.lg.fontFamily,
    fontWeight: '800',
    color: colors.black,
    marginBottom: 24,
  },

  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray200,
    borderRadius: 14,
    backgroundColor: colors.offWhite,
    paddingHorizontal: 14,
    paddingVertical: 3,
  },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.error, borderRadius: 12,
    padding: 14, marginBottom: 16,
  },
  errorBannerText: { flex: 1, color: colors.white, fontSize: 13, fontWeight: '600' },

  inputError: { borderColor: colors.error },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: colors.black, paddingVertical: 11 },
  eyeBtn: { padding: 6 },
  errorText: { fontSize: 12, color: colors.error, marginTop: 4 },

  btn: {
    backgroundColor: colors.red,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.white, fontWeight: '800', fontSize: 16 },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.gray200 },
  dividerText: { fontSize: 13, color: colors.gray400 },

  secondaryBtn: {
    borderWidth: 2,
    borderColor: colors.green,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { color: colors.green, fontWeight: '700', fontSize: 15 },

  footer: {
    backgroundColor: colors.white,
    textAlign: 'center',
    fontSize: 11,
    color: colors.gray400,
    paddingBottom: 8,
    paddingHorizontal: 24,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  legalLink: { fontSize: 11, color: colors.green, fontWeight: '600', textDecorationLine: 'underline' },
  legalSep:  { fontSize: 11, color: colors.gray300 },
});
