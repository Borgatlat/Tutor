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
import { SCHOOL_EMAIL_DOMAIN, ROLES } from '../../constants';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../../constants/legal';
import { useResponsive } from '../../hooks/useResponsive';

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
  const { isWide } = useResponsive();

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', email: '', password: '' },
  });

  const onSubmit = async ({ full_name, email, password }) => {
    setLoading(true);
    setSubmitError('');
    try {
      const cleanEmail = email.toLowerCase().trim();
      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { full_name, role } },
      });
      if (error) { setSubmitError(error.message); return; }
      navigation.navigate('VerifyEmail', { email: cleanEmail });
    } catch (e) {
      if (__DEV__) console.error('[SignUp]', e);
      setSubmitError(
        e?.message?.includes('fetch')
          ? 'Cannot reach the server. Check your internet connection.'
          : (e?.message ?? 'Something went wrong. Please try again.'),
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Form content (shared) ──────────────────────────────────────────────────
  const FormContent = ({ showBack = false }) => (
    <>
      {showBack && (
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.gray500} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.cardTitle}>Create Account</Text>

      {submitError ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={colors.white} />
          <Text style={styles.errorBannerText}>{submitError}</Text>
        </View>
      ) : null}

      {/* Full Name */}
      <Text style={styles.label}>Full Name</Text>
      <Controller
        control={control} name="full_name"
        render={({ field: { onChange, value, onBlur } }) => (
          <View style={[styles.inputWrap, errors.full_name && styles.inputError]}>
            <Ionicons name="person-outline" size={18} color={colors.gray400} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="John Smith"
              placeholderTextColor={colors.gray300}
              value={value} onChangeText={onChange} onBlur={onBlur}
            />
          </View>
        )}
      />
      {errors.full_name && <Text style={styles.fieldError}>{errors.full_name.message}</Text>}

      {/* Email */}
      <Text style={[styles.label, { marginTop: 16 }]}>School Email</Text>
      <Controller
        control={control} name="email"
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
              value={value} onChangeText={onChange} onBlur={onBlur}
            />
          </View>
        )}
      />
      {errors.email && <Text style={styles.fieldError}>{errors.email.message}</Text>}

      {/* Password */}
      <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
      <Controller
        control={control} name="password"
        render={({ field: { onChange, value, onBlur } }) => (
          <View style={[styles.inputWrap, errors.password && styles.inputError]}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.gray400} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="8+ characters"
              placeholderTextColor={colors.gray300}
              secureTextEntry={!showPw}
              value={value} onChangeText={onChange} onBlur={onBlur}
            />
            <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
              <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.gray400} />
            </TouchableOpacity>
          </View>
        )}
      />
      {errors.password && <Text style={styles.fieldError}>{errors.password.message}</Text>}

      {/* Role picker */}
      <Text style={[styles.label, { marginTop: 24 }]}>I am a…</Text>
      <View style={styles.roleRow}>
        {ROLES.map((r) => {
          const active = role === r.key;
          return (
            <TouchableOpacity
              key={r.key}
              style={[styles.roleCard, active && styles.roleCardActive]}
              onPress={() => setRole(r.key)}
              activeOpacity={0.8}
            >
              <View style={[styles.roleIcon, active && styles.roleIconActive]}>
                <Ionicons name={r.icon} size={22} color={active ? colors.white : colors.gray500} />
              </View>
              <Text style={[styles.roleLabel, active && styles.roleLabelActive]}>{r.label}</Text>
              <Text style={[styles.roleDesc, active && styles.roleDescActive]}>{r.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={colors.white} />
          : <Text style={styles.btnText}>Create Account</Text>}
      </TouchableOpacity>

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

      <TouchableOpacity style={styles.loginLink} onPress={() => navigation.goBack()}>
        <Text style={styles.loginLinkText}>
          Already have an account?{' '}
          <Text style={{ color: colors.red, fontWeight: '700' }}>Sign In</Text>
        </Text>
      </TouchableOpacity>
    </>
  );

  // ─── Desktop: true two-column full-screen layout ────────────────────────────
  if (isWide) {
    return (
      <View style={styles.desktopRoot}>
        {/* Left branding panel */}
        <View style={styles.desktopLeft}>
          <View style={styles.heroBadge}>
            <Ionicons name="school" size={36} color={colors.white} />
          </View>
          <Text style={styles.heroSchool}>STRAKE JESUIT</Text>
          <Text style={styles.desktopHeroTitle}>Join the{'\n'}Community</Text>
          <Text style={styles.desktopHeroSub}>
            Connect with fellow Crusaders as a tutor, a student, or both.
          </Text>

          <View style={styles.featureList}>
            {[
              { icon: 'people-outline',    text: 'Peer-to-peer tutoring from Crusaders' },
              { icon: 'book-outline',      text: 'All subjects — core, AP, SAT & more' },
              { icon: 'time-outline',      text: 'Schedule around your free periods' },
              { icon: 'shield-checkmark-outline', text: 'Strake Jesuit email required' },
            ].map((f) => (
              <View key={f.text} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon} size={16} color={colors.white} />
                </View>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Right form panel */}
        <ScrollView
          style={styles.desktopRight}
          contentContainerStyle={styles.desktopFormScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.desktopFormCard}>
            <FormContent showBack />
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── Mobile layout ───────────────────────────────────────────────────────────
  const SignUpInner = (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={true}
    >
      <View style={styles.hero}>
        <TouchableOpacity style={styles.mobileBackBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.heroSchool}>STRAKE JESUIT</Text>
        <Text style={styles.heroTitle}>Join the{'\n'}Community</Text>
      </View>
      <View style={styles.card}>
        <FormContent />
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {Platform.OS === 'web' ? (
        <View style={{ flex: 1 }}>{SignUpInner}</View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
        >
          {SignUpInner}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ── Mobile ──────────────────────────────────────────────────────────────────
  safe:   { flex: 1, backgroundColor: colors.red },
  scroll: { flexGrow: 1, paddingBottom: 32 },

  hero: {
    backgroundColor: colors.red,
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 36,
  },
  mobileBackBtn: { marginBottom: 16 },
  heroBadge: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.green,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  heroSchool: {
    color: colors.white, fontSize: 11, fontWeight: '700',
    letterSpacing: 2.5, opacity: 0.8, marginBottom: 6,
  },
  heroTitle: {
    color: colors.white, fontSize: 32,
    fontFamily: heading.xl.fontFamily, fontWeight: '800', lineHeight: 38,
  },

  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 56,
  },

  // ── Desktop ─────────────────────────────────────────────────────────────────
  desktopRoot: {
    flex: 1,
    flexDirection: 'row',
    ...Platform.select({ web: { minHeight: '100vh' }, default: {} }),
  },
  desktopLeft: {
    flex: 1,
    backgroundColor: colors.red,
    paddingHorizontal: 56,
    paddingVertical: 64,
    justifyContent: 'center',
  },
  desktopHeroTitle: {
    color: colors.white, fontSize: 48,
    fontFamily: heading.xl.fontFamily, fontWeight: '800',
    lineHeight: 56, marginBottom: 16, marginTop: 12,
  },
  desktopHeroSub: {
    color: colors.white, fontSize: 16, opacity: 0.8,
    lineHeight: 24, marginBottom: 48, maxWidth: 380,
  },
  featureList: { gap: 16 },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { color: colors.white, fontSize: 14, opacity: 0.9, flex: 1 },

  desktopRight: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  desktopFormScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  desktopFormCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 40,
    ...Platform.select({
      web: { boxShadow: '0 4px 32px rgba(0,0,0,0.10)' },
      default: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
    }),
  },

  // ── Shared form styles ───────────────────────────────────────────────────────
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  backBtnText: { fontSize: 14, color: colors.gray500, fontWeight: '600' },

  cardTitle: {
    fontSize: 22, fontFamily: heading.lg.fontFamily,
    fontWeight: '800', color: colors.black, marginBottom: 20,
  },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.error, borderRadius: 12,
    padding: 14, marginBottom: 16,
  },
  errorBannerText: { flex: 1, color: colors.white, fontSize: 13, fontWeight: '600' },

  label: {
    fontSize: 12, fontWeight: '700', color: colors.gray600,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.gray200,
    borderRadius: 14, backgroundColor: colors.offWhite,
    paddingHorizontal: 14, paddingVertical: 3,
  },
  inputError: { borderColor: colors.error },
  inputIcon:  { marginRight: 10 },
  input:      { flex: 1, fontSize: 15, color: colors.black, paddingVertical: 11 },
  eyeBtn:     { padding: 6 },
  fieldError: { fontSize: 12, color: colors.error, marginTop: 4 },

  roleRow: { flexDirection: 'row', gap: 10 },
  roleCard: {
    flex: 1, borderWidth: 1.5, borderColor: colors.gray200,
    borderRadius: 16, padding: 12,
    alignItems: 'center', backgroundColor: colors.offWhite,
  },
  roleCardActive:  { borderColor: colors.red, backgroundColor: colors.redMuted },
  roleIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.gray100,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  roleIconActive:  { backgroundColor: colors.red },
  roleLabel:       { fontSize: 13, fontWeight: '700', color: colors.gray700, textAlign: 'center' },
  roleLabelActive: { color: colors.red },
  roleDesc:        { fontSize: 10, color: colors.gray400, textAlign: 'center', marginTop: 3 },
  roleDescActive:  { color: colors.redLight },

  btn: {
    backgroundColor: colors.red, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 28,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: colors.white, fontWeight: '800', fontSize: 16 },

  legalNotice: {
    fontSize: 11, color: colors.gray400, textAlign: 'center',
    lineHeight: 17, marginTop: 16, paddingHorizontal: 8,
  },
  legalLink:     { color: colors.green, fontWeight: '600', textDecorationLine: 'underline' },
  loginLink:     { alignItems: 'center', marginTop: 16 },
  loginLinkText: { fontSize: 14, color: colors.gray500 },
});
