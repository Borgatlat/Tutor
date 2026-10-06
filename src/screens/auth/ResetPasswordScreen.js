/**
 * ResetPasswordScreen - set a new password after following an emailed link.
 *
 * Rendered by App.js whenever useAuthStore.recovery is true, ahead of every
 * other branch. That matters: the recovery link signs the user in for real, so
 * without this gate they would land straight in the app and never get the
 * chance to choose a new password.
 */
import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import useToastStore from '../../store/useToastStore';
import { toUserMessage } from '../../utils/errors';
import colors from '../../theme/colors';
import { space } from '../../theme/layout';
import { heading } from '../../theme/fonts';
import {
  AuthShell, Button, ErrorBanner, Field, IconButton,
} from '../../components/ui';

export default function ResetPasswordScreen() {
  const setRecovery = useAuthStore((s) => s.setRecovery);
  const signOut     = useAuthStore((s) => s.signOut);
  const showToast   = useToastStore((s) => s.show);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (confirm !== password) errs.confirm = "Those passwords don't match";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setSubmitError('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setSubmitError(toUserMessage(error, "We couldn't update your password. Please try again."));
        return;
      }

      // Recovery is done. Clearing the flag hands routing back to App.js, which
      // now sees a normal signed-in session.
      setRecovery(false);
      showToast('Password updated. You are signed in.');
    } catch (e) {
      setSubmitError(toUserMessage(e, "We couldn't update your password. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  // Bailing out must drop the recovery session too, otherwise the user is left
  // silently signed in as themselves without ever proving they know a password.
  const cancel = async () => {
    setRecovery(false);
    await signOut();
  };

  return (
    <AuthShell
      title={'Choose a new\npassword'}
      subtitle="Almost done. Pick something you'll remember."
      headerRight={
        <IconButton
          icon="close"
          label="Cancel and sign out"
          onPress={cancel}
          size={22}
          color={colors.white}
        />
      }
    >
      <Text style={styles.cardTitle}>New Password</Text>

      <ErrorBanner message={submitError} />

      <Field
        label="New Password"
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

      <Field
        label="Confirm Password"
        icon="lock-closed-outline"
        error={fieldErrors.confirm}
        placeholder="Type it again"
        secureTextEntry={!showPw}
        autoComplete="new-password"
        textContentType="newPassword"
        value={confirm}
        onChangeText={setConfirm}
      />

      <Button
        label="Save Password"
        onPress={onSubmit}
        loading={loading}
        fullWidth
        style={styles.block}
      />

      <Button
        label="Cancel"
        variant="secondary"
        onPress={cancel}
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
});
