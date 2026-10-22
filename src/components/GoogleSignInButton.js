/**
 * GoogleSignInButton: "Continue with Google" plus an "or" divider, for the
 * sign-in and sign-up screens. Draws nothing until Google sign-in is turned on
 * in Supabase, so students never hit a dead end.
 *
 * Props
 *  onError – (message) => void, for the screen's error banner
 */
import React, { useEffect, useState } from 'react';
import { Button, Divider } from './ui';
import { googleSignInEnabled, signInWithGoogle } from '../lib/googleSignIn';

export default function GoogleSignInButton({ onError, style }) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    googleSignInEnabled().then((on) => { if (alive) setEnabled(on); });
    return () => { alive = false; };
  }, []);

  if (!enabled) return null;

  const onPress = async () => {
    setLoading(true);
    onError?.('');
    const { error } = await signInWithGoogle();
    setLoading(false);
    if (error) onError?.(error);
  };

  return (
    <>
      <Button
        label="Continue with Google"
        icon="logo-google"
        variant="secondary"
        onPress={onPress}
        loading={loading}
        fullWidth
        style={style}
        accessibilityLabel="Continue with your school Google account"
      />
      <Divider label="or use your school email" />
    </>
  );
}
