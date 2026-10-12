/**
 * Card: the one elevated surface in the app.
 *
 * Every card-shaped thing should use this so radius, padding and elevation
 * stay identical. One depth effect only: a soft shadow, no outline. `padded={false}` for cards that manage their own insets
 * (e.g. ones with a full-bleed header).
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import colors from '../../theme/colors';
import { radii, space } from '../../theme/layout';
import { cardShadow } from '../../theme/shadows';

export default function Card({ style, padded = true, flat = false, children, ...rest }) {
  return (
    <View
      style={[styles.card, padded && styles.padded, !flat && cardShadow, flat && styles.flat, style]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
  },
  // A flat card has no shadow, so it gets the hairline instead.
  flat: { borderWidth: 1, borderColor: colors.lineSoft },
  padded: {
    padding: space.lg,
  },
});
