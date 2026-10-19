/**
 * InviteButton: one tap to share the app, for screens that come up empty.
 *
 * An empty search or session list usually means not enough people have
 * joined yet, so instead of a dead end we ask the student to bring someone
 * in. 'recruit' asks a friend to tutor (optionally for the subject being
 * searched); 'friend' invites them to use the app. After sharing, a short
 * note confirms what happened (or that the link was copied).
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { shareInvite } from '../utils/invite';
import { success } from '../utils/haptics';
import colors from '../theme/colors';
import { space } from '../theme/layout';
import { type } from '../theme/fonts';
import { Button } from './ui';

export default function InviteButton({
  kind = 'friend',
  subject,
  isTutor = false,
  label,
  variant = 'primary',
  style,
}) {
  const [note, setNote] = useState('');

  const share = async () => {
    const result = await shareInvite(isTutor, { kind, subject });
    if (result === 'shared' || result === 'copied') success();
    setNote(
        result === 'copied' ? 'Invite link copied. Paste it to a friend!'
      : result === 'shared' ? 'Thanks for spreading the word!'
      : result === 'failed' ? "Couldn't open sharing on this device."
      : '',
    );
  };

  const text = label ?? (kind === 'recruit' ? 'Invite someone to tutor' : 'Invite a friend');

  return (
    <View style={[styles.wrap, style]}>
      <Button label={text} icon="share-outline" size="sm" variant={variant} onPress={share} />
      {note ? (
        <Text style={styles.note} accessibilityLiveRegion="polite" accessibilityRole="alert">
          {note}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginTop: space.md },
  note: { ...type.small, color: colors.brandText, marginTop: space.sm, textAlign: 'center' },
});
