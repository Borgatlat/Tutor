/**
 * OnboardingScreen - the pre-account wizard.
 *
 * Asks the profile questions FIRST and creates the account LAST, so a new
 * Crusader sees what the app is about before being asked for credentials:
 *
 *   1. I am a…        (student / tutor / both)
 *   2. Subjects        (skipped for students - they aren't teaching anything)
 *   3. Free blocks
 *   4. Name, email, password → account created
 *
 * Steps 1-3 are held in component state, not the database: RLS policies key off
 * auth.uid(), so there is no row to write to until the account exists. Step 4
 * creates the user and then flushes everything collected above in one go.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, emailRedirectTo } from '../../lib/supabase';
import { toUserMessage } from '../../utils/errors';
import useAuthStore from '../../store/useAuthStore';
import useToastStore from '../../store/useToastStore';
import colors from '../../theme/colors';
import { space, radii, hit, press } from '../../theme/layout';
import { SCHOOL_EMAIL_DOMAIN } from '../../constants';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../../constants/legal';
import AvailabilityGrid from '../../components/AvailabilityGrid';
import {
  AuthShell, Button, ErrorBanner, Field, IconButton, RoleSelector, SubjectPicker,
} from '../../components/ui';

const STEP_COPY = [
  { title: 'Welcome,\nCrusader',   subtitle: 'First, how will you be using the app?' },
  { title: 'What can you\nteach?', subtitle: 'Pick the subjects you can tutor other Crusaders in.' },
  { title: 'When are you\nfree?',  subtitle: 'Select the blocks you have open during the school day.' },
  { title: 'Create your\naccount', subtitle: 'Last step. This is how you sign in from now on.' },
];

export default function OnboardingScreen({ navigation }) {
  const setOnboarding = useAuthStore((s) => s.setOnboarding);
  const showToast     = useToastStore((s) => s.show);

  const [step, setStep] = useState(0);

  // ── Collected answers ───────────────────────────────────────────────────────
  const [role, setRole]                     = useState('student');
  const [selectedSubjects, setSelected]     = useState([]);
  const [gradeMap, setGradeMap]             = useState({});
  const [selectedBlocks, setSelectedBlocks] = useState(() => new Set());

  // ── Step 4 fields ───────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);

  const [loading, setLoading]         = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const isTutor = role === 'tutor' || role === 'both';

  // Students don't teach, so the subject step is noise for them.
  const stepsForRole = isTutor ? [0, 1, 2, 3] : [0, 2, 3];
  const position     = stepsForRole.indexOf(step) + 1;
  const totalForRole = stepsForRole.length;

  const goNext = () => {
    const i = stepsForRole.indexOf(step);
    setSubmitError('');
    if (i < stepsForRole.length - 1) setStep(stepsForRole[i + 1]);
  };

  const goBack = () => {
    const i = stepsForRole.indexOf(step);
    setSubmitError('');
    if (i > 0) setStep(stepsForRole[i - 1]);
    else navigation.goBack();
  };

  const toggleSubject = (s) => {
    setSelected((prev) => {
      if (prev.includes(s)) {
        setGradeMap((g) => { const copy = { ...g }; delete copy[s]; return copy; });
        return prev.filter((x) => x !== s);
      }
      return [...prev, s];
    });
  };

  const setGrade = (subject, grade) => {
    setGradeMap((prev) => ({ ...prev, [subject]: grade }));
  };

  const toggleBlock = (block) => {
    setSelectedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(block)) next.delete(block); else next.add(block);
      return next;
    });
  };

  const availabilitySlots = [...selectedBlocks].map((b) => ({ period: b }));

  // ── Step 4: validate, create the account, flush the collected answers ───────
  const validate = () => {
    const errs = {};
    if (fullName.trim().length < 2) errs.fullName = 'Enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = 'Enter a valid email';
    else if (!email.toLowerCase().trim().endsWith(SCHOOL_EMAIL_DOMAIN)) {
      errs.email = 'Must be a ' + SCHOOL_EMAIL_DOMAIN + ' address';
    }
    if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateAccount = async () => {
    if (!validate()) return;

    setLoading(true);
    setSubmitError('');
    // Hold the auth stack in place while we write - see useAuthStore.onboarding.
    setOnboarding(true);

    try {
      const cleanEmail = email.toLowerCase().trim();
      const cleanName  = fullName.trim();
      const firstName  = cleanName.split(/\s+/)[0];

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { full_name: cleanName, role }, emailRedirectTo: emailRedirectTo() },
      });
      if (error) {
        // A mailer failure is a server-side config problem (SMTP credentials or
        // an unverified Resend sender domain), not anything the student can fix.
        setSubmitError(toUserMessage(error, "We couldn't create your account. Please try again."));
        setOnboarding(false);
        return;
      }

      // Email confirmation off → session comes back straight away. If it didn't,
      // sign in directly so verification never gates a new account.
      let session = data?.session ?? null;
      if (!session) {
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        session = signInData?.session ?? null;

        if (!session) {
          setSubmitError(toUserMessage(signInError, 'Account created, but sign-in failed. Try signing in.'));
          setOnboarding(false);
          return;
        }
      }

      const userId = session.user.id;

      // 1. Profile row. loadProfile() may also upsert this from metadata, so
      //    upsert rather than update to stay race-safe.
      const { error: profileError } = await supabase.from('profiles').upsert({
        id:             userId,
        email:          cleanEmail,
        full_name:      cleanName,
        role,
        setup_complete: true,
      }, { onConflict: 'id' });
      if (profileError && __DEV__) console.warn('[Onboarding] profile:', profileError.message);

      // 2. Subjects (tutors / both only)
      if (selectedSubjects.length > 0) {
        const { error: subjErr } = await supabase.from('tutor_subjects').upsert(
          selectedSubjects.map((subject) => ({
            tutor_id: userId,
            subject,
            grade: gradeMap[subject] || null,
          })),
          { onConflict: 'tutor_id,subject' },
        );
        if (subjErr && __DEV__) console.warn('[Onboarding] subjects:', subjErr.message);
      }

      // 3. Free blocks - one table covers every role
      if (availabilitySlots.length > 0) {
        const { error: availErr } = await supabase.from('tutor_availability').insert(
          availabilitySlots.map(({ period }) => ({ tutor_id: userId, period })),
        );
        if (availErr && __DEV__) console.warn('[Onboarding] availability:', availErr.message);
      }

      // 4. Pull the freshly written row into the store, then release the auth
      //    stack - setupComplete is already true, so App.js lands on the app.
      await useAuthStore.getState().loadProfile(userId);
      useAuthStore.setState({ setupComplete: true });
      setOnboarding(false);

      showToast('Account created. Welcome, ' + firstName + '!');
    } catch (e) {
      if (__DEV__) console.error('[Onboarding]', e);
      setSubmitError(toUserMessage(e, "We couldn't create your account. Please try again."));
      setOnboarding(false);
    } finally {
      setLoading(false);
    }
  };

  const copy = STEP_COPY[step];

  return (
    <AuthShell
      title={copy.title}
      subtitle={copy.subtitle}
      headerRight={
        <IconButton
          icon="chevron-back"
          label="Go back"
          onPress={goBack}
          size={22}
          color={colors.white}
        />
      }
    >
      {/* Progress */}
      <View style={styles.progressRow}>
        {stepsForRole.map((s, i) => (
          <View
            key={s}
            style={[styles.progressBar, i < position && styles.progressBarActive]}
          />
        ))}
      </View>
      <Text style={styles.stepCount}>Step {position} of {totalForRole}</Text>

      <ErrorBanner message={submitError} />

      {/* ── Step 1: role ─────────────────────────────────────────────────── */}
      {step === 0 && (
        <>
          <Text style={styles.label}>I am a…</Text>
          <RoleSelector value={role} onChange={setRole} style={styles.block} />
          <Button label="Continue" icon="arrow-forward" onPress={goNext} fullWidth />
        </>
      )}

      {/* ── Step 2: subjects ─────────────────────────────────────────────── */}
      {step === 1 && (
        <>
          <Text style={styles.label}>Subjects You Can Teach</Text>
          <Text style={styles.hint}>Core classes, SAT and AP. Select all that apply.</Text>
          <SubjectPicker
            selected={selectedSubjects}
            onToggle={toggleSubject}
            grades={gradeMap}
            onGradeChange={setGrade}
          />
          <Button
            label={selectedSubjects.length ? 'Continue' : 'Skip for now'}
            icon="arrow-forward"
            onPress={goNext}
            fullWidth
            style={styles.block}
          />
        </>
      )}

      {/* ── Step 3: free blocks ──────────────────────────────────────────── */}
      {step === 2 && (
        <>
          <Text style={styles.label}>Your Free Blocks</Text>
          <Text style={styles.hint}>
            {isTutor
              ? 'Students can book sessions during these blocks.'
              : 'Tutors with matching free blocks rank higher in your search.'}
          </Text>
          <AvailabilityGrid availability={availabilitySlots} onToggle={toggleBlock} />
          {selectedBlocks.size > 0 ? (
            <View style={styles.availCount}>
              <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
              <Text style={styles.availCountText}>
                {selectedBlocks.size} block{selectedBlocks.size === 1 ? '' : 's'} selected
              </Text>
            </View>
          ) : null}
          <Button
            label={selectedBlocks.size ? 'Continue' : 'Skip for now'}
            icon="arrow-forward"
            onPress={goNext}
            fullWidth
            style={styles.block}
          />
        </>
      )}

      {/* ── Step 4: account ──────────────────────────────────────────────── */}
      {step === 3 && (
        <>
          <Field
            label="Full Name"
            icon="person-outline"
            error={fieldErrors.fullName}
            placeholder="John Smith"
            autoComplete="name"
            textContentType="name"
            value={fullName}
            onChangeText={setFullName}
          />

          <Field
            label="School Email"
            icon="mail-outline"
            error={fieldErrors.email}
            placeholder={'name' + SCHOOL_EMAIL_DOMAIN}
            keyboardType="email-address"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />

          <Field
            label="Password"
            icon="lock-closed-outline"
            error={fieldErrors.password}
            hint="At least 8 characters"
            placeholder="8+ characters"
            secureTextEntry={!showPw}
            autoComplete="new-password"
            textContentType="newPassword"
            value={password}
            onChangeText={setPassword}
            trailing={
              <IconButton
                icon={showPw ? 'eye-off-outline' : 'eye-outline'}
                label={showPw ? 'Hide password' : 'Show password'}
                onPress={() => setShowPw(!showPw)}
                size={18}
              />
            }
          />

          <Button
            label="Create Account"
            onPress={handleCreateAccount}
            loading={loading}
            fullWidth
            style={styles.block}
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
        </>
      )}

      <TouchableOpacity
        style={styles.loginLink}
        onPress={() => navigation.navigate('Login')}
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
  progressRow: { flexDirection: 'row', gap: space.xs, marginBottom: space.sm },
  progressBar: {
    flex: 1, height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.gray200,
  },
  progressBarActive: { backgroundColor: colors.accent },
  stepCount: {
    fontSize: 12, color: colors.gray500,
    fontWeight: '600', marginBottom: space.xl,
  },

  label: { fontSize: 13, fontWeight: '600', color: colors.gray600 },
  hint: {
    fontSize: 12, color: colors.gray500,
    marginTop: space.xs, marginBottom: space.md, lineHeight: 17,
  },
  block: { marginTop: space.lg },

  availCount: {
    flexDirection: 'row', alignItems: 'center',
    gap: space.xs, marginTop: space.md,
  },
  availCountText: { fontSize: 12, color: colors.accent, fontWeight: '700' },

  legalNotice: {
    fontSize: 11, color: colors.gray500,
    textAlign: 'center', lineHeight: 17, marginTop: space.lg,
  },
  legalLink: { color: colors.accent, fontWeight: '600', textDecorationLine: 'underline' },

  loginLink:       { alignItems: 'center', marginTop: space.xl },
  loginLinkText:   { fontSize: 13, color: colors.gray500 },
  loginLinkStrong: { color: colors.accent, fontWeight: '700' },
});
