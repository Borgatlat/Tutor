/**
 * Card — the one elevated surface in the app.
 *
 * Every card-shaped thing should use this so radius, padding and elevation
 * stay identical. `padded={false}` for cards that manage their own insets
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
      style={[styles.card, padded && styles.padded, !flat && cardShadow, style]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
  },
  padded: {
    padding: space.lg,
  },
});
